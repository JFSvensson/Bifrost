fetch('./data/links.json')
    .then(response => response.json())
    .then(links => {
        const linkElement = document.getElementById('links');

        const h2 = document.createElement('h2');
        h2.innerText = 'Viktiga Länkar';
        linkElement.appendChild(h2);

        const ul = document.createElement('links-list');
        ul.id = 'links-list';
        linkElement.appendChild(ul);
        
        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.url;
            a.target = "_blank";
            a.innerText = link.name;
            li.appendChild(a);
            ul.appendChild(li);
        });
    });