/* first.js — To-Do App with localStorage, filters, edit, complete */

(() => {
  const $input = document.getElementById('todo-input');
  const $addBtn = document.getElementById('add-btn');
  const $list = document.getElementById('todo-list');
  const $count = document.getElementById('count');
  const $clearCompleted = document.getElementById('clear-completed');
  const $empty = document.getElementById('empty');
  const $filters = Array.from(document.querySelectorAll('.filter'));

  const STORAGE_KEY = 'todo.items.v1';
  const FILTER_KEY = 'todo.filter.v1';

  let items = readItems();
  let currentFilter = localStorage.getItem(FILTER_KEY) || 'all';

  // --- Utils ---
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  function readItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function setFilter(name) {
    currentFilter = name;
    localStorage.setItem(FILTER_KEY, name);
    $filters.forEach(btn => {
      const active = btn.dataset.filter === name;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    render();
  }

  // --- Item ops ---
  function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    items.push({ id: uid(), text: trimmed, completed: false });
    save();
    render();
  }
  function toggleItem(id) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    it.completed = !it.completed;
    save();
    render();
  }
  function deleteItem(id) {
    items = items.filter(i => i.id !== id);
    save();
    render();
  }
  function updateItem(id, newText) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    const t = newText.trim();
    if (!t) { // empty after edit → delete
      deleteItem(id);
      return;
    }
    it.text = t;
    save();
    render();
  }
  function clearCompleted() {
    items = items.filter(i => !i.completed);
    save();
    render();
  }

  // --- Render ---
  function render() {
    // Filter
    let filtered = items;
    if (currentFilter === 'active') filtered = items.filter(i => !i.completed);
    if (currentFilter === 'completed') filtered = items.filter(i => i.completed);

    // Count
    const activeCount = items.filter(i => !i.completed).length;
    $count.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'}`;

    // Empty state
    $empty.hidden = filtered.length !== 0;

    // List DOM
    $list.innerHTML = '';
    const frag = document.createDocumentFragment();
    filtered.forEach(({ id, text, completed }) => {
      const li = document.createElement('li');
      li.className = 'item';
      li.dataset.id = id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.checked = completed;
      checkbox.setAttribute('aria-label', 'Mark complete');
      checkbox.addEventListener('change', () => toggleItem(id));

      const label = document.createElement('div');
      label.className = 'label' + (completed ? ' completed' : '');
      label.textContent = text;
      label.title = 'Double-click to edit';
      // Inline edit on double-click
      label.addEventListener('dblclick', () => beginEdit(li, id, text));

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => beginEdit(li, id, text));

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteItem(id));

      actions.append(editBtn, delBtn);
      li.append(checkbox, label, actions);
      frag.appendChild(li);
    });
    $list.appendChild(frag);
  }

  function beginEdit(li, id, oldText) {
    // Replace label with input
    const label = li.querySelector('.label');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldText;
    input.className = 'input';
    input.style.padding = '8px 10px';
    input.style.fontSize = '14px';

    const finish = (commit) => {
      if (commit) updateItem(id, input.value);
      else render();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));

    label.replaceWith(input);
    input.focus();
    // Move cursor to end
    const val = input.value; input.value = ''; input.value = val;
  }

  // --- Events ---
  $addBtn.addEventListener('click', () => {
    addItem($input.value);
    $input.value = '';
    $input.focus();
  });
  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addItem($input.value);
      $input.value = '';
    }
  });
  $clearCompleted.addEventListener('click', clearCompleted);
  $filters.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));

  // --- Init ---
  setFilter(currentFilter); // also triggers render
})();
