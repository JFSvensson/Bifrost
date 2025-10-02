const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');

class ObsidianBridge {
    constructor(config) {
        this.vaultPath = config.vaultPath;
        this.todoFiles = config.todoFiles || ['TODO.md'];
        this.port = config.port || 8080;
        this.cachedTodos = new Map();
        this.watchedFiles = new Set();
        
        console.log(`🔍 Watching Obsidian vault: ${this.vaultPath}`);
    }

    // Hitta och övervaka alla todo-filer
    initializeWatchers() {
        this.todoFiles.forEach(fileName => {
            const fullPath = path.join(this.vaultPath, fileName);
            
            if (fs.existsSync(fullPath)) {
                this.watchFile(fullPath, fileName);
                this.loadTodosFromFile(fullPath, fileName);
            } else {
                console.warn(`⚠️  Todo-fil hittades inte: ${fullPath}`);
                console.log(`💡 Skapa filen: ${fileName} i din Obsidian vault`);
            }
        });

        // Övervaka också om nya .md filer skapas
        this.watchForNewTodoFiles();
    }

    // Övervaka specifik fil för ändringar
    watchFile(filePath, fileName) {
        if (this.watchedFiles.has(filePath)) return;
        
        console.log(`👀 Övervakar: ${fileName}`);
        this.watchedFiles.add(filePath);

        // fs.watchFile är mer tillförlitlig än fs.watch för text-filer
        fs.watchFile(filePath, { 
            interval: 1000,  // Kolla varje sekund
            persistent: true 
        }, (curr, prev) => {
            // Bara reagera på ändringar, inte när filen läses
            if (curr.mtime > prev.mtime) {
                console.log(`📝 ${fileName} ändrades, laddar om todos...`);
                this.loadTodosFromFile(filePath, fileName);
            }
        });

        // Initial load
        this.loadTodosFromFile(filePath, fileName);
    }

    // Läs och parsa todos från fil
    loadTodosFromFile(filePath, fileName) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const todos = this.parseMarkdownTodos(content, fileName);
            
            this.cachedTodos.set(fileName, {
                todos: todos,
                lastUpdated: new Date(),
                filePath: filePath
            });
            
            console.log(`✅ Laddade ${todos.length} todos från ${fileName}`);
        } catch (error) {
            console.error(`❌ Fel vid läsning av ${fileName}:`, error.message);
        }
    }

    // Parsa Markdown-format för todos
    parseMarkdownTodos(content, source) {
        const lines = content.split('\n');
        const todos = [];
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Upptäck sektioner (# Rubriker)
            const sectionMatch = line.match(/^#+\s+(.+)$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                continue;
            }

            // Parse olika todo-format
            const patterns = [
                /^-\s+\[\s\]\s+(.+)$/,           // - [ ] Standard todo
                /^-\s+\[\s\]\s+(.+)$/,           // - [ ] Med extra space  
                /^\*\s+\[\s\]\s+(.+)$/,          // * [ ] Stjärn-variant
                /^[\d]+\.\s+\[\s\]\s+(.+)$/,     // 1. [ ] Numrerad lista
                /^>\s+\[\s\]\s+(.+)$/            // > [ ] Quote-block todo
            ];

            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                    todos.push({
                        text: match[1].trim(),
                        completed: false,
                        source: source,
                        section: currentSection,
                        priority: this.extractPriority(match[1]),
                        tags: this.extractTags(match[1]),
                        dueDate: this.extractDueDate(match[1]),
                        originalLine: line,
                        lineNumber: i + 1
                    });
                    break;
                }
            }

            // Parse completed todos (för statistik)
            const completedPattern = /^-\s+\[x\]\s+(.+)$/i;
            const completedMatch = line.match(completedPattern);
            if (completedMatch) {
                todos.push({
                    text: completedMatch[1].trim(),
                    completed: true,
                    source: source,
                    section: currentSection,
                    completedAt: new Date(),
                    originalLine: line,
                    lineNumber: i + 1
                });
            }
        }

        return todos;
    }

    // Extrahera prioritet från todo-text
    extractPriority(text) {
        const priorityMatch = text.match(/\[!(high|medium|low)\]/i);
        if (priorityMatch) return priorityMatch[1].toLowerCase();
        
        // Eller använd emoji-system
        if (text.includes('🔥') || text.includes('❗')) return 'high';
        if (text.includes('⚠️') || text.includes('📌')) return 'medium';
        
        return 'normal';
    }

    // Extrahera tags (#tag format)
    extractTags(text) {
        const tagMatches = text.match(/#[\w-]+/g);
        return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
    }

    // Extrahera datum (@2025-01-15 format)
    extractDueDate(text) {
        const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            return new Date(dateMatch[1]);
        }
        return null;
    }

    // Övervaka nya .md filer som kan innehålla todos
    watchForNewTodoFiles() {
        if (!fs.existsSync(this.vaultPath)) {
            console.error(`❌ Obsidian vault hittades inte: ${this.vaultPath}`);
            return;
        }

        fs.watch(this.vaultPath, { recursive: false }, (eventType, fileName) => {
            if (eventType === 'rename' && fileName && fileName.endsWith('.md')) {
                const fullPath = path.join(this.vaultPath, fileName);
                
                // Om ny fil som kan innehålla todos
                if (fs.existsSync(fullPath) && this.shouldWatchFile(fileName)) {
                    console.log(`🆕 Ny potentiell todo-fil: ${fileName}`);
                    setTimeout(() => {
                        this.watchFile(fullPath, fileName);
                    }, 1000); // Vänta lite för att filen ska vara klar
                }
            }
        });
    }

    // Bestäm om en fil ska övervakas baserat på innehåll
    shouldWatchFile(fileName) {
        const todoKeywords = ['todo', 'task', 'checklist', 'action'];
        const lowerName = fileName.toLowerCase();
        
        return todoKeywords.some(keyword => lowerName.includes(keyword));
    }

    // Samla alla todos från alla filer
    getAllTodos() {
        const allTodos = [];
        
        for (const [fileName, data] of this.cachedTodos) {
            // Bara icke-klara todos som standard
            const activeTodos = data.todos.filter(todo => !todo.completed);
            allTodos.push(...activeTodos);
        }

        // Sortera efter prioritet och sedan alfabetiskt
        return allTodos.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, normal: 1, low: 0 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Hög prioritet först
            }
            
            return a.text.localeCompare(b.text);
        });
    }

    // HTTP Server för Bifrost
    startServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            try {
                this.handleRequest(url, req, res);
            } catch (error) {
                console.error('❌ Server error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        server.listen(this.port, () => {
            console.log(`🚀 Obsidian Bridge server running on http://localhost:${this.port}`);
            console.log(`📡 Bifrost kan nu hämta todos från: http://localhost:${this.port}/obsidian/todos`);
        });

        return server;
    }

    // Hantera HTTP requests
    handleRequest(url, req, res) {
        const path = url.pathname;
        res.setHeader('Content-Type', 'application/json');

        switch (path) {
            case '/obsidian/todos':
                const todos = this.getAllTodos();
                res.writeHead(200);
                res.end(JSON.stringify({
                    todos: todos,
                    count: todos.length,
                    lastUpdated: new Date(),
                    sources: Array.from(this.cachedTodos.keys())
                }));
                break;

            case '/obsidian/stats':
                res.writeHead(200);
                res.end(JSON.stringify(this.getStats()));
                break;

            case '/obsidian/files':
                res.writeHead(200);
                res.end(JSON.stringify({
                    watchedFiles: Array.from(this.watchedFiles),
                    cachedFiles: Array.from(this.cachedTodos.keys())
                }));
                break;

            case '/health':
                res.writeHead(200);
                res.end(JSON.stringify({ 
                    status: 'healthy', 
                    uptime: process.uptime(),
                    watchingFiles: this.watchedFiles.size
                }));
                break;

            default:
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
    }

    // Statistik över todos
    getStats() {
        let totalTodos = 0;
        let completedTodos = 0;
        const fileStats = {};

        for (const [fileName, data] of this.cachedTodos) {
            const active = data.todos.filter(t => !t.completed).length;
            const completed = data.todos.filter(t => t.completed).length;
            
            fileStats[fileName] = {
                active: active,
                completed: completed,
                total: active + completed,
                lastUpdated: data.lastUpdated
            };
            
            totalTodos += active;
            completedTodos += completed;
        }

        return {
            totalActive: totalTodos,
            totalCompleted: completedTodos,
            files: fileStats
        };
    }
}

// Konfiguration - ANPASSA DENNA SÖKVÄG!
const config = {
    vaultPath: 'C:\\Users\\svens\\Documents\\Obsidian\\Utomstans', // ← Ändra till din Obsidian vault
    todoFiles: ['TODO.md', 'Tasks.md'], // Filer att övervaka
    port: 8081 // Undviker konflikt med proxy.js som kör på 8787
};

console.log('🚀 Startar Obsidian Bridge...');
console.log('📁 Vault path:', config.vaultPath);
console.log('📄 Todo files:', config.todoFiles);

// Kontrollera att vault-sökvägen finns
if (!fs.existsSync(config.vaultPath)) {
    console.error(`❌ Obsidian vault hittades inte: ${config.vaultPath}`);
    console.log(`💡 Ändra 'vaultPath' i obsidianBridge.js till din Obsidian vault`);
    process.exit(1);
}

const bridge = new ObsidianBridge(config);
bridge.initializeWatchers();
bridge.startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Obsidian Bridge...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Obsidian Bridge...');
    process.exit(0);
});