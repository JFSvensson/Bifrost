fetch('./data/links.json')
    .then(response => response.json())
    .then(links => {
        const linkElement = document.getElementById('links');

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.innerText = link.name;
            li.appendChild(a);
            linkElement.appendChild(li);
        });
    });