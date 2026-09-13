/**
 * =============================================
 * checkout.js – NGƯỜI 4: Xử lý đặt hàng
 * =============================================
 */

async function initCheckout() {
  Auth.requireLogin();
  Auth.updateHeader();
  Cart.updateBadge();

  const items = Cart.getItems();
  if (items.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  const user = Auth.getCurrentUser();
  renderCheckoutSummary(items);
  prefillForm(user);
}

function renderCheckoutSummary(items) {
  const container = document.getElementById('checkoutItems');
  const subtotal = Cart.total();
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const total = subtotal + shipping;

  container.innerHTML = `
    <div class="checkout-book-list">
      ${items.map(i => `
        <div class="checkout-item">
          <div class="checkout-item-img">
            <img src="${i.cover}" alt="${i.title}"
              onerror="this.style.display='none';this.parentNode.innerHTML='📚'">
          </div>
          <div class="checkout-item-info">
            <div class="checkout-item-name">${i.title}</div>
            <div class="checkout-item-qty">x${i.quantity}</div>
          </div>
          <div class="checkout-item-price">${formatCurrency(i.price * i.quantity)}</div>
        </div>
      `).join('')}
    </div>
    <div class="checkout-totals">
      <div class="total-row"><span>Tạm tính</span><span>${formatCurrency(subtotal)}</span></div>
      <div class="total-row"><span>Phí ship</span>
        <span>${shipping === 0 ? '<em>Miễn phí</em>' : formatCurrency(shipping)}</span>
      </div>
      <div class="total-row grand"><span>Tổng cộng</span><strong>${formatCurrency(total)}</strong></div>
    </div>
  `;
}

function prefillForm(user) {
  if (!user) return;
  const nameEl = document.getElementById('shipName');
  const emailEl = document.getElementById('shipEmail');
  const phoneEl = document.getElementById('shipPhone');
  const addrEl = document.getElementById('shipAddress');
  if (nameEl) nameEl.value = user.name || '';
  if (emailEl) emailEl.value = user.email || '';
  if (phoneEl) phoneEl.value = user.phone || '';
  if (addrEl) addrEl.value = user.address || '';
}

async function handleCheckout(e) {
  e.preventDefault();
  const user = Auth.getCurrentUser();
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  const items = Cart.getItems();
  const subtotal = Cart.total();
  const shipping = subtotal >= 299000 ? 0 : 30000;

  const order = {
    userId: user.id,
    customerName: document.getElementById('shipName').value,
    customerEmail: document.getElementById('shipEmail').value,
    customerPhone: document.getElementById('shipPhone').value,
    address: document.getElementById('shipAddress').value,
    note: document.getElementById('shipNote').value,
    items: items.map(i => ({
      bookId: i.bookId,
      title: i.title,
      price: i.price,
      quantity: i.quantity
    })),
    total: subtotal + shipping,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await api.post('/orders', order);
    Cart.clear();
    window.location.href = 'orders.html?success=1';
  } catch (err) {
    showToast('Đặt hàng thất bại: ' + err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Đặt hàng ngay';
  }
}

/* =====================================================
   orders.js – NGƯỜI 4: Lịch sử đơn hàng
   ===================================================== */

async function initOrders() {
  Auth.requireLogin();
  Auth.updateHeader();
  Cart.updateBadge();

  // Thông báo đặt hàng thành công
  if (new URLSearchParams(window.location.search).get('success') === '1') {
    showToast('🎉 Đặt hàng thành công! Chúng tôi sẽ liên hệ sớm.');
  }

  const user = Auth.getCurrentUser();
  const container = document.getElementById('ordersContainer');
  container.innerHTML = `<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>`;

  try {
    const orders = await api.get(`/my-orders?userId=${user.id}`);
    renderOrders(orders);
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Không thể tải đơn hàng</div>`;
  }
}

function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders">
        <div class="empty-icon">📦</div>
        <h3>Bạn chưa có đơn hàng nào</h3>
        <a href="index.html" class="btn-primary">Mua sắm ngay</a>
      </div>
    `;
    return;
  }

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = sorted.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <div class="order-id">
          <i class="fas fa-receipt"></i>
          Đơn #${order.id}
        </div>
        <div class="order-date">${formatDate(order.createdAt)}</div>
        <span class="status-badge ${STATUS_CLASS[order.status]}">
          ${STATUS_LABELS[order.status] || order.status}
        </span>
      </div>
      <div class="order-card-body">
        <div class="order-items-preview">
          ${order.items.map(i => `
            <div class="order-item-row">
              <span>${i.title} × ${i.quantity}</span>
              <span>${formatCurrency(i.price * i.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="order-card-footer">
        <div class="order-address">
          <i class="fas fa-map-marker-alt"></i> ${order.address}
        </div>
        <div class="order-total">
          Tổng: <strong>${formatCurrency(order.total)}</strong>
        </div>
      </div>
    </div>
  `).join('');
}
