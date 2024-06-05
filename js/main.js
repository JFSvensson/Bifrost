
function addTodo() {
    const todoText = document.getElementById('new-todo').value;
    if (todoText === '') return;

    const li = document.createElement('li');
    li.textContent = todoText;
    document.getElementById('todo-items').appendChild(li);

    document.getElementById('new-todo').value = '';
}
