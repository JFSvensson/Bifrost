function addTodo() {
    const todoText = document.getElementById('new-todo').value;
    if (todoText === '') return;

    const li = document.createElement('li');
    li.textContent = todoText;
    document.getElementById('todo-items').appendChild(li);

    document.getElementById('new-todo').value = '';

    saveTodos();
}

function saveTodos() {
    const todos = Array.from(document.querySelectorAll('#todo-items li'))
        .map(li => li.textContent);
    localStorage.setItem('bifrost-todos', JSON.stringify(todos));
}

function loadTodos() {
    const saved = localStorage.getItem('bifrost-todos');
    if (saved) {
        JSON.parse(saved).forEach(addTodoItem);
    }
}

function addTodoItem(todoText) {
    const li = document.createElement('li');
    li.textContent = todoText;
    document.getElementById('todo-items').appendChild(li);
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const links = document.querySelectorAll('#links a');
        const link = links[parseInt(e.key) - 1];
        if (link) window.open(link.href, '_blank');
    }
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(registrationError => {
                console.log('Service Worker registration failed:', registrationError);
            });
    });
}

// Load todos when page loads
window.addEventListener('load', loadTodos);
