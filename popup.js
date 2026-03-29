const STORAGE_KEY = 'quickcopy_items';

let items = [];
let editingId = null;

const listContainer = document.getElementById('listContainer');
const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const itemInput = document.getElementById('itemInput');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const toast = document.getElementById('toast');

function loadItems() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    items = result[STORAGE_KEY] || [];
    renderList();
  });
}

function saveItems() {
  chrome.storage.local.set({ [STORAGE_KEY]: items });
}

function renderList() {
  if (items.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No items yet.<br>Click "+ Add Item" to get started.</div>';
    return;
  }

listContainer.innerHTML = items.map((item, index) => `
  <div class="item">
    <span class="item-value">${escapeHtml(item.value)}</span>
    <div class="item-actions">
      <button class="copy-btn" data-action="copy" data-index="${index}">Copy</button>
      <button class="caps-btn" data-action="caps" data-index="${index}">CAPS</button>
      <button class="edit-btn" data-action="edit" data-index="${index}">Edit</button>
      <button class="delete-btn" data-action="delete" data-index="${index}">Delete</button>
    </div>
  </div>
`).join('');

}

listContainer.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const index = button.dataset.index;
  const action = button.dataset.action;

  if (action === 'copy') copyItem(index);
  if (action === 'caps') copyCapsItem(index);
  if (action === 'edit') editItem(index);
  if (action === 'delete') deleteItem(index);
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function copyItem(index) {
  const value = items[index].value;
  navigator.clipboard.writeText(value).then(() => {
    showToast('Copied!');
  });
}

function copyCapsItem(index) {
  const value = items[index].value.toUpperCase();
  navigator.clipboard.writeText(value).then(() => {
    showToast('Copied as CAPS!');
  });
}

function editItem(index) {
  editingId = index;
  modalTitle.textContent = 'Edit Item';
  itemInput.value = items[index].value;
  modal.classList.add('show');
  itemInput.focus();
}

function deleteItem(index) {
  items.splice(index, 1);
  saveItems();
  renderList();
}

function showModal() {
  editingId = null;
  modalTitle.textContent = 'Add Item';
  itemInput.value = '';
  modal.classList.add('show');
  itemInput.focus();
}

function hideModal() {
  modal.classList.remove('show');
  editingId = null;
  itemInput.value = '';
}

function saveItem() {
  const value = itemInput.value.trim();
  if (!value) return;

  if (editingId !== null) {
    items[editingId].value = value;
  } else {
    items.push({ value, id: Date.now() });
  }

  saveItems();
  renderList();
  hideModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

addBtn.addEventListener('click', showModal);
cancelBtn.addEventListener('click', hideModal);
saveBtn.addEventListener('click', saveItem);

itemInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveItem();
  if (e.key === 'Escape') hideModal();
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) hideModal();
});

window.copyItem = copyItem;
window.copyCapsItem = copyCapsItem;
window.editItem = editItem;
window.deleteItem = deleteItem;

loadItems();
