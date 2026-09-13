/**
 * =============================================
 * config.js – Cấu hình API chung
 * Dùng chung cho cả User và Admin frontend
 * =============================================
 */

const API_BASE = 'http://localhost:3000';

// ── API Helper ──────────────────────────────
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

// ── Format tiền VNĐ ──────────────────────────
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ── Format ngày ──────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ── Toast notification ───────────────────────
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.className = 'toast', 3000);
}

// ── Status label ─────────────────────────────
const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ'
};

const STATUS_CLASS = {
  pending: 'status-pending',
  processing: 'status-processing',
  shipping: 'status-shipping',
  done: 'status-done',
  cancelled: 'status-cancelled'
};
