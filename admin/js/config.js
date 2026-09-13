/**
 * =============================================
 * config.js – Cấu hình API cho Admin Panel
 * NGƯỜI 2 + NGƯỜI 3
 * =============================================
 */
const API_BASE = 'http://localhost:3000';

const api = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`GET ${endpoint} thất bại: ${res.status}`);
    return res.json();
  },
  async post(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Có lỗi xảy ra');
    return json;
  },
  async put(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${endpoint} thất bại`);
    return res.json();
  },
  async patch(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PATCH ${endpoint} thất bại`);
    return res.json();
  },
  async delete(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${endpoint} thất bại`);
    return true;
  }
};

function formatCurrency(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN');
}

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ'
};
const STATUS_CLASS = {
  pending: 'badge-pending',
  processing: 'badge-processing',
  shipping: 'badge-shipping',
  done: 'badge-done',
  cancelled: 'badge-cancelled'
};

// Admin auth check
function checkAdminAuth() {
  const user = JSON.parse(localStorage.getItem('nhanam_user') || 'null');
  if (!user || user.role !== 'admin') {
    window.location.href = '../user/login.html';
  }
  return user;
}

function adminLogout() {
  localStorage.removeItem('nhanam_user');
  window.location.href = '../user/login.html';
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('adminToast');
  if (!t) return;
  t.textContent = msg;
  t.className = `admin-toast show ${type}`;
  setTimeout(() => t.className = 'admin-toast', 3000);
}
