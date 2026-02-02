const userList = document.getElementById('userList');
const refreshButton = document.getElementById('refreshButton');

async function fetchUsers() {
  userList.innerHTML = '<div class="loading">Loading users…</div>';
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();
    renderUsers(users);
  } catch (error) {
    console.error(error);
    userList.innerHTML = '<div class="empty">Unable to load users. Please try again.</div>';
  }
}

function renderUsers(users) {
  if (!users || users.length === 0) {
    userList.innerHTML = '<div class="empty">No users available.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  users.forEach((user) => {
    const card = document.createElement('article');
    card.className = 'card';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = (user.name || '?').slice(0, 1).toUpperCase();

    const details = document.createElement('div');
    details.className = 'user-details';

    const name = document.createElement('p');
    name.className = 'user-name';
    name.textContent = user.name;

    const meta = document.createElement('p');
    meta.className = 'user-meta';
    const lastSeen = user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Unknown';
    meta.textContent = `Last seen: ${lastSeen}`;

    const toggle = document.createElement('button');
    toggle.className = 'details-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'View details';
    toggle.addEventListener('click', () => {
      const isExpanded = card.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', String(isExpanded));
      toggle.textContent = isExpanded ? 'Hide details' : 'View details';
    });

    details.append(name, meta, toggle);

    const status = document.createElement('span');
    const statusClass = getStatusClass(user.status);
    status.className = `status ${statusClass}`;
    status.innerHTML = `<span class="status-dot"></span>${user.status || 'Unknown'}`;

    card.append(avatar, details, status);
    fragment.appendChild(card);
  });

  userList.innerHTML = '';
  userList.appendChild(fragment);
}

function getStatusClass(status = '') {
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'status-success';
  if (normalized === 'idle') return 'status-warning';
  return 'status-danger';
}

refreshButton.addEventListener('click', fetchUsers);

fetchUsers();
