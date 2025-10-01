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
