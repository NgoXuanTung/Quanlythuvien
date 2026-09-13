/**
 * =============================================
 * cart.js – NGƯỜI 1: Giỏ hàng
 * Dùng localStorage để lưu giỏ hàng
 * =============================================
 */

const Cart = {
  // Lấy giỏ hàng
  getItems() {
    const data = localStorage.getItem('nhanam_cart');
    return data ? JSON.parse(data) : [];
  },

  // Lưu giỏ hàng
  saveItems(items) {
    localStorage.setItem('nhanam_cart', JSON.stringify(items));
    this.updateBadge();
  },

  // Thêm sách vào giỏ
  add(book, qty = 1) {
    const items = this.getItems();
    const idx = items.findIndex(i => i.bookId === book.id);
    if (idx > -1) {
      items[idx].quantity += qty;
    } else {
      items.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        cover: book.cover,
        quantity: qty
      });
    }
    this.saveItems(items);
  },

  // Cập nhật số lượng
  updateQty(bookId, qty) {
    let items = this.getItems();
    if (qty <= 0) {
      items = items.filter(i => i.bookId !== bookId);
    } else {
      const idx = items.findIndex(i => i.bookId === bookId);
      if (idx > -1) items[idx].quantity = qty;
    }
    this.saveItems(items);
  },

  // Xoá khỏi giỏ
  remove(bookId) {
    const items = this.getItems().filter(i => i.bookId !== bookId);
    this.saveItems(items);
  },

  // Tổng số lượng
  count() {
    return this.getItems().reduce((s, i) => s + i.quantity, 0);
  },

  // Tổng tiền
  total() {
    return this.getItems().reduce((s, i) => s + i.price * i.quantity, 0);
  },

  // Xoá hết giỏ (sau khi đặt hàng)
  clear() {
    localStorage.removeItem('nhanam_cart');
    this.updateBadge();
  },

  // Cập nhật số lượng trên badge header
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = this.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

/* =====================================================
   CART PAGE RENDER
   ===================================================== */
function renderCartPage() {
  const items = Cart.getItems();
  const container = document.getElementById('cartContainer');
  const summaryEl = document.getElementById('cartSummary');

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Giỏ hàng của bạn đang trống</h3>
        <p>Hãy khám phá thêm những cuốn sách hay nhé!</p>
        <a href="index.html" class="btn-primary">Tiếp tục mua sắm</a>
      </div>
    `;
    if (summaryEl) summaryEl.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <div class="cart-items-list">
      ${items.map(item => `
        <div class="cart-row" id="row-${item.bookId}">
          <div class="cart-book-img">
            <img src="${item.cover || ''}" alt="${item.title}" onerror="this.style.display='none';this.parentNode.innerHTML='📚'">
          </div>
          <div class="cart-book-info">
            <h4><a href="detail.html?id=${item.bookId}">${item.title}</a></h4>
            <p class="cart-book-author">${item.author}</p>
            <p class="cart-book-price">${formatCurrency(item.price)}</p>
          </div>
          <div class="cart-qty-ctrl">
            <button onclick="changeQty(${item.bookId}, ${item.quantity - 1})">−</button>
            <input type="number" value="${item.quantity}" min="1"
              onchange="changeQty(${item.bookId}, parseInt(this.value))" />
            <button onclick="changeQty(${item.bookId}, ${item.quantity + 1})">+</button>
          </div>
          <div class="cart-subtotal">${formatCurrency(item.price * item.quantity)}</div>
          <button class="cart-remove-btn" onclick="removeFromCart(${item.bookId})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // Summary
  const subtotal = Cart.total();
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const total = subtotal + shipping;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="summary-card">
        <h3>Tóm Tắt Đơn Hàng</h3>
        <div class="summary-row"><span>Tạm tính</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="summary-row"><span>Phí ship</span>
          <span>${shipping === 0 ? '<span class="free-ship">Miễn phí</span>' : formatCurrency(shipping)}</span>
        </div>
        ${shipping > 0 ? `<p class="ship-notice">Mua thêm ${formatCurrency(299000 - subtotal)} để miễn phí ship</p>` : ''}
        <div class="summary-total"><span>Tổng cộng</span><strong>${formatCurrency(total)}</strong></div>
        <a href="checkout.html" class="btn-checkout-full">Tiến Hành Thanh Toán →</a>
        <a href="index.html" class="btn-continue-shop">← Tiếp tục mua sắm</a>
      </div>
    `;
  }
}

function changeQty(bookId, qty) {
  Cart.updateQty(bookId, qty);
  renderCartPage();
  Cart.updateBadge();
}

function removeFromCart(bookId) {
  Cart.remove(bookId);
  renderCartPage();
  Cart.updateBadge();
}
