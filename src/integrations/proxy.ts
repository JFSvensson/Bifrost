// @ts-ignore - Node.js server file
const http: any = require('http');
// @ts-ignore
const https: any = require('https');
// @ts-ignore
const urlModule: any = require('url');
// @ts-ignore
const { URL } = urlModule;

/**
 * NOTE: This file runs in Node.js environment, not the browser.
 * console.log/error statements are kept for now since this is a standalone Node.js proxy server.
 * When converting this to a service or integrating with the browser-based logger,
 * replace console statements with logger utility:
 * 
 * import { logger } from '../utils/logger.js';
 * console.log() → logger.info() or logger.debug()
 * console.error() → logger.error()
 */

const PORT = 8787;
const DEFAULT_ID = '6811ef70ccac616726792271_matsedel-grundskola';
const BASE = 'https://menu.matildaplatform.com/meals/week/';

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseNextDataFromHtml(html) {
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const start = html.indexOf(marker);
    if (start === -1) {return null;}
    const jsonStart = start + marker.length;
    const end = html.indexOf('</script>', jsonStart);
    if (end === -1) {return null;}
    const jsonText = html.slice(jsonStart, end);
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        return null;
    }
}

function capitalize(text) {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function transformToSimpleModel(nextData) {
    const pageProps = nextData?.props?.pageProps || {};
    const meals = Array.isArray(pageProps.meals) ? pageProps.meals : [];
    const byDate = new Map();
    for (const entry of meals) {
        const dateStr = entry.date; // e.g. 2025-09-09T00:00:00
        if (!dateStr) {continue;}
        const d = new Date(dateStr);
        const key = d.toISOString().slice(0, 10);
        if (!byDate.has(key)) {
            const dayName = capitalize(d.toLocaleDateString('sv-SE', { weekday: 'long' }));
            byDate.set(key, { dayName, meals: [] });
        }
        const bucket = byDate.get(key);
        const courses = Array.isArray(entry.courses) ? entry.courses : [];
        for (const c of courses) {
            if (c?.name) {bucket.meals.push({ name: c.name });}
        }
    }
    // Sort by date
    const days = Array.from(byDate.entries())
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([, v]) => v);

    return {
        startDate: pageProps.startDate || null,
        endDate: pageProps.endDate || null,
        days
    };
}

function fetchRemoteHtml(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, {
                headers: {
                    'User-Agent': 'Bifrost-Proxy',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Encoding': 'identity'
                }
            }, (res) => {
                const { statusCode } = res;
                if (!statusCode || statusCode < 200 || statusCode >= 300) {
                    res.resume();
                    return reject(new Error(`Upstream status ${statusCode}`));
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            })
            .on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
    }

    if (req.url.startsWith('/api/school-menu')) {
        try {
            const u = new URL(req.url, `http://localhost:${PORT}`);
            const id = u.searchParams.get('id') || DEFAULT_ID;
            const startDate = u.searchParams.get('startDate');
            const endDate = u.searchParams.get('endDate');
            const remoteUrl = new URL(id, BASE);
            if (startDate) {remoteUrl.searchParams.set('startDate', startDate);}
            if (endDate) {remoteUrl.searchParams.set('endDate', endDate);}

            console.log('Fetching upstream:', remoteUrl.toString());
            const html = await fetchRemoteHtml(remoteUrl.toString());
            const nextData = parseNextDataFromHtml(html);
            if (!nextData) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Failed to parse upstream data' }));
            }
            const model = transformToSimpleModel(nextData);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=900'
            });
            return res.end(JSON.stringify(model));
        } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Bad gateway', detail: err.message }));
        }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.on('listening', () => {
    console.log(`Proxy running on http://localhost:${PORT}/api/school-menu`);
});
server.on('error', (e) => {
    console.error('Proxy error:', e);
});
server.listen(PORT);