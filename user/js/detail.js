/**
 * =============================================
 * detail.js – NGƯỜI 1: Trang chi tiết sách
 * =============================================
 */

let currentBook = null;

async function initDetail() {
  Auth.updateHeader();
  Cart.updateBadge();

  const params = new URLSearchParams(window.location.search);
  const bookId = parseInt(params.get('id'));

  if (!bookId) { window.location.href = 'index.html'; return; }

  try {
    const [book, categories] = await Promise.all([
      api.get(`/books/${bookId}`),
      api.get('/categories')
    ]);
    currentBook = book;
    const cat = categories.find(c => c.id === book.categoryId);
    renderDetail(book, cat);
    loadRelatedBooks(book, categories);
  } catch (err) {
    document.getElementById('detailContainer').innerHTML =
      `<div class="error-msg">Không tìm thấy sách này</div>`;
  }
}

function renderDetail(book, cat) {
  document.title = `${book.title} — Nhã Nam Books`;

  const container = document.getElementById('detailContainer');
  const discount = book.originalPrice > book.price
    ? Math.round((1 - book.price / book.originalPrice) * 100) : 0;

  container.innerHTML = `
    <div class="breadcrumb">
      <a href="index.html">Trang chủ</a> /
      <a href="index.html?cat=${cat?.slug}">${cat?.name || 'Sách'}</a> /
      <span>${book.title}</span>
    </div>

    <div class="detail-layout">
      <div class="detail-img-col">
        <div class="detail-img-wrap">
          <img src="${book.cover}" alt="${book.title}" id="mainImg"
            onerror="this.style.display='none';document.getElementById('imgFallback').style.display='flex'">
          <div class="img-fallback" id="imgFallback" style="display:none">📚</div>
          ${discount > 0 ? `<div class="detail-discount-badge">-${discount}%</div>` : ''}
        </div>
        <div class="detail-badges">
          ${book.isNew ? '<span class="badge-new">MỚI</span>' : ''}
          ${book.isSale ? '<span class="badge-sale">SALE</span>' : ''}
        </div>
      </div>

      <div class="detail-info-col">
        <div class="detail-cat">${cat?.name || ''}</div>
        <h1 class="detail-title">${book.title}</h1>
        <p class="detail-author">Tác giả: <strong>${book.author}</strong></p>

        <div class="detail-price-block">
          <div class="detail-price">${formatCurrency(book.price)}</div>
          ${book.originalPrice > book.price
            ? `<div class="detail-price-old">${formatCurrency(book.originalPrice)}</div>` : ''}
          ${discount > 0 ? `<div class="detail-save">Tiết kiệm ${formatCurrency(book.originalPrice - book.price)}</div>` : ''}
        </div>

        <div class="detail-meta">
          <div class="meta-item"><i class="fas fa-box"></i> Còn ${book.stock} cuốn</div>
          <div class="meta-item"><i class="fas fa-shopping-bag"></i> ${book.sold} đã bán</div>
          <div class="meta-item"><i class="fas fa-truck"></i> Miễn ship đơn ≥ 299k</div>
        </div>

        <div class="detail-qty-row">
          <label>Số lượng:</label>
          <div class="qty-ctrl">
            <button onclick="changeDetailQty(-1)">−</button>
            <input type="number" id="detailQty" value="1" min="1" max="${book.stock}" />
            <button onclick="changeDetailQty(1)">+</button>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn-add-to-cart-detail" onclick="addDetailToCart()">
            <i class="fas fa-cart-plus"></i> Thêm vào giỏ hàng
          </button>
          <button class="btn-buy-now" onclick="buyNow()">
            Mua ngay →
          </button>
        </div>

        <div class="detail-desc">
          <h3>Mô tả sách</h3>
          <p>${book.description}</p>
        </div>
      </div>
    </div>
  `;
}

function changeDetailQty(delta) {
  const input = document.getElementById('detailQty');
  const newVal = Math.max(1, Math.min(currentBook?.stock || 99, parseInt(input.value) + delta));
  input.value = newVal;
}

function addDetailToCart() {
  if (!currentBook) return;
  const qty = parseInt(document.getElementById('detailQty').value) || 1;
  Cart.add(currentBook, qty);
  showToast(`✓ Đã thêm ${qty} cuốn "${currentBook.title}" vào giỏ`);
  Cart.updateBadge();
}

function buyNow() {
  addDetailToCart();
  window.location.href = 'cart.html';
}

async function loadRelatedBooks(book, categories) {
  try {
    const allBooks = await api.get(`/books?categoryId=${book.categoryId}`);
    const related = allBooks.filter(b => b.id !== book.id).slice(0, 4);
    const container = document.getElementById('relatedBooks');
    if (!container || related.length === 0) return;

    const cat = categories.find(c => c.id === book.categoryId);
    container.innerHTML = `
      <h2 class="section-title">Sách Tương Tự</h2>
      <div class="related-grid">
        ${related.map(b => `
          <div class="book-card" onclick="window.location.href='detail.html?id=${b.id}'">
            <div class="book-card-img">
              <img src="${b.cover}" alt="${b.title}"
                onerror="this.style.display='none';this.parentNode.querySelector('.book-fallback').style.display='flex'">
              <div class="book-fallback" style="display:none">📚</div>
            </div>
            <div class="book-card-body">
              <div class="book-cat-label">${cat?.name || ''}</div>
              <h3 class="book-title">${b.title}</h3>
              <p class="book-author">${b.author}</p>
              <div class="book-price">${formatCurrency(b.price)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) { /* ignore */ }
}

window.addEventListener('DOMContentLoaded', initDetail);
