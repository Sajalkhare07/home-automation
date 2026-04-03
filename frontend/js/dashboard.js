// js/dashboard.js
const API = 'http://localhost:5000/api';

// Auth guard — redirect to login if no token
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('user-name').textContent = `Hi, ${user.name || 'User'}`;

// Device type icons
const ICONS = {
  light:  '💡',
  fan:    '🌀',
  ac:     '❄️',
  socket: '🔌',
  other:  '📦',
};

// ── Auth header helper
const authHeaders = () => ({
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${token}`,
});

// ── Fetch and render all devices
async function loadDevices() {
  const grid = document.getElementById('device-grid');
  grid.innerHTML = '<div class="loading-state">Loading devices...</div>';

  try {
    const res  = await fetch(`${API}/devices`, { headers: authHeaders() });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    updateStats(data.devices);

    if (data.devices.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🏠</span>
          <h3>No devices yet</h3>
          <p>Click "+ Add Device" to get started</p>
        </div>`;
      return;
    }

    grid.innerHTML = data.devices.map(renderDeviceCard).join('');

  } catch (err) {
    grid.innerHTML = `<div class="empty-state">
      <span class="empty-icon">⚠️</span>
      <h3>Error loading devices</h3>
      <p>${err.message}</p>
    </div>`;
  }
}

// ── Render a single device card
function renderDeviceCard(device) {
  const isOn = device.status === 'on';
  return `
    <div class="device-card ${isOn ? 'is-on' : ''}" id="card-${device.id}">
      <span class="device-icon">${ICONS[device.type] || '📦'}</span>
      <div class="device-name">${device.name}</div>
      <div class="device-location">📍 ${device.location}</div>
      <div class="device-meta">
        <span class="device-pin">Pin ${device.pin}</span>
        <span class="status-badge ${isOn ? 'on' : 'off'}">${isOn ? 'ON' : 'OFF'}</span>
      </div>
      <div class="card-footer">
        <label class="toggle-switch">
          <input type="checkbox"
            ${isOn ? 'checked' : ''}
            onchange="toggleDevice(${device.id}, this.checked)"
          />
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-delete" onclick="deleteDevice(${device.id})" title="Remove device">🗑</button>
      </div>
    </div>`;
}

// ── Update stats bar
function updateStats(devices) {
  const on  = devices.filter(d => d.status === 'on').length;
  const off = devices.length - on;
  document.getElementById('total-devices').textContent   = devices.length;
  document.getElementById('online-devices').textContent  = on;
  document.getElementById('offline-devices').textContent = off;
}

// ── Toggle device ON/OFF
async function toggleDevice(id, isOn) {
  const action = isOn ? 'on' : 'off';

  try {
    const res  = await fetch(`${API}/devices/${id}/toggle`, {
      method:  'PATCH',
      headers: authHeaders(),
      body:    JSON.stringify({ action }),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    // Update card in-place without full reload
    const card   = document.getElementById(`card-${id}`);
    const badge  = card.querySelector('.status-badge');
    card.classList.toggle('is-on', isOn);
    badge.textContent = isOn ? 'ON' : 'OFF';
    badge.className   = `status-badge ${isOn ? 'on' : 'off'}`;

    // Refresh stats
    const res2   = await fetch(`${API}/devices`, { headers: authHeaders() });
    const data2  = await res2.json();
    if (data2.success) updateStats(data2.devices);

  } catch (err) {
    alert(`Failed to toggle device: ${err.message}`);
    loadDevices(); // revert UI
  }
}

// ── Delete device
async function deleteDevice(id) {
  if (!confirm('Remove this device?')) return;

  try {
    const res  = await fetch(`${API}/devices/${id}`, {
      method:  'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    loadDevices();
  } catch (err) {
    alert(`Failed to delete: ${err.message}`);
  }
}

// ── Add device modal
function openAddModal()  { document.getElementById('add-modal').classList.remove('hidden'); }
function closeAddModal() { document.getElementById('add-modal').classList.add('hidden'); }

// Close modal on overlay click
document.getElementById('add-modal').addEventListener('click', function(e) {
  if (e.target === this) closeAddModal();
});

async function handleAddDevice(e) {
  e.preventDefault();
  const err = document.getElementById('add-error');
  err.classList.add('hidden');

  const payload = {
    name:     document.getElementById('d-name').value,
    type:     document.getElementById('d-type').value,
    location: document.getElementById('d-location').value || 'Home',
    pin:      parseInt(document.getElementById('d-pin').value),
  };

  try {
    const res  = await fetch(`${API}/devices`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    closeAddModal();
    e.target.reset();
    loadDevices();

  } catch (error) {
    err.textContent = error.message;
    err.classList.remove('hidden');
  }
}

// ── Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ── Init
loadDevices();