/**
 * =============================================
 * main.js – NGƯỜI 1: Trang chủ
 * Hiển thị danh sách sách, lọc, tìm kiếm
 * =============================================
 */

let allBooks = [];
let allCategories = [];
let currentCategory = 'all';
let currentSearch = '';
let currentPage = 1;
const PAGE_SIZE = 8;

// ── Khởi động trang chủ ─────────────────────
async function initHome() {
  Auth.updateHeader();
  Cart.updateBadge();

  try {
    [allBooks, allCategories] = await Promise.all([
      api.get('/books'),
      api.get('/categories')
    ]);
    renderCategories();
    renderBooks();
    renderFeaturedSlider();
  } catch (err) {
    document.getElementById('booksGrid').innerHTML =
      `<div class="error-msg"><i class="fas fa-exclamation-circle"></i> Không thể tải dữ liệu. Hãy đảm bảo server đang chạy!</div>`;
    console.error(err);
  }
}

// ── Render tabs danh mục ─────────────────────
function renderCategories() {
  const container = document.getElementById('categoryTabs');
  if (!container) return;
  container.innerHTML = `
    <button class="cat-tab active" data-cat="all" onclick="filterCat('all', this)">Tất cả</button>
    ${allCategories.map(c => `
      <button class="cat-tab" data-cat="${c.slug}" onclick="filterCat('${c.slug}', this)">${c.name}</button>
    `).join('')}
  `;
}

// ── Lọc theo danh mục ───────────────────────
function filterCat(slug, btn) {
  currentCategory = slug;
  currentPage = 1;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBooks();
}

// ── Tìm kiếm ────────────────────────────────
function doSearch() {
  currentSearch = document.getElementById('searchInput').value.toLowerCase().trim();
  currentPage = 1;
  renderBooks();
}

// ── Lấy sách đã lọc ─────────────────────────
function getFilteredBooks() {
  return allBooks.filter(b => {
    const matchCat = currentCategory === 'all' ||
      (allCategories.find(c => c.id === b.categoryId)?.slug === currentCategory);
    const matchSearch = !currentSearch ||
      b.title.toLowerCase().includes(currentSearch) ||
      b.author.toLowerCase().includes(currentSearch);
    return matchCat && matchSearch;
  });
}

// ── Render sách ─────────────────────────────
function renderBooks() {
  const grid = document.getElementById('booksGrid');
  const filtered = getFilteredBooks();
  const total = filtered.length;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageBooks = filtered.slice(start, start + PAGE_SIZE);

  if (pageBooks.length === 0) {
    grid.innerHTML = `<div class="no-result"><i class="fas fa-search"></i><p>Không tìm thấy sách phù hợp</p></div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const catMap = {};
  allCategories.forEach(c => catMap[c.id] = c.name);

  grid.innerHTML = pageBooks.map(book => `
    <div class="book-card" onclick="goToDetail(${book.id})">
      <div class="book-card-img">
        <img src="${book.cover}" alt="${book.title}" loading="lazy"
          onerror="this.style.display='none';this.parentNode.querySelector('.book-fallback').style.display='flex'">
        <div class="book-fallback" style="display:none">📚</div>
        ${book.isNew ? '<span class="badge-new">MỚI</span>' : ''}
        ${book.isSale ? '<span class="badge-sale">SALE</span>' : ''}
        <button class="quick-cart-btn" onclick="event.stopPropagation(); quickAddCart(${book.id})">
          <i class="fas fa-cart-plus"></i> Thêm vào giỏ
        </button>
      </div>
      <div class="book-card-body">
        <div class="book-cat-label">${catMap[book.categoryId] || ''}</div>
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <div class="book-price-row">
          <div>
            <div class="book-price">${formatCurrency(book.price)}</div>
            ${book.originalPrice > book.price
              ? `<div class="book-price-old">${formatCurrency(book.originalPrice)}</div>`
              : ''}
          </div>
          <div class="book-sold">${book.sold > 999 ? (book.sold/1000).toFixed(1)+'k' : book.sold} đã bán</div>
        </div>
      </div>
    </div>
  `).join('');

  renderPagination(total);
}

// ── Phân trang ───────────────────────────────
function renderPagination(total) {
  const container = document.getElementById('pagination');
  if (!container) return;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderBooks();
  document.getElementById('booksGrid').scrollIntoView({ behavior: 'smooth' });
}

// ── Featured slider ──────────────────────────
function renderFeaturedSlider() {
  const container = document.getElementById('featuredSlider');
  if (!container) return;
  const featured = allBooks.sort((a, b) => b.sold - a.sold).slice(0, 5);
  container.innerHTML = featured.map((book, i) => `
    <div class="slide ${i === 0 ? 'active' : ''}" onclick="goToDetail(${book.id})">
      <img src="${book.cover}" alt="${book.title}"
        onerror="this.style.display='none';this.parentNode.style.background='#f0ebe2'">
      <div class="slide-info">
        <h3>${book.title}</h3>
        <p>${book.author}</p>
        <span class="slide-price">${formatCurrency(book.price)}</span>
      </div>
    </div>
  `).join('');

  // Auto slide
  let idx = 0;
  setInterval(() => {
    const slides = container.querySelectorAll('.slide');
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 4000);
}

// ── Thêm nhanh vào giỏ ──────────────────────
function quickAddCart(bookId) {
  const book = allBooks.find(b => b.id === bookId);
  if (!book) return;
  Cart.add(book);
  showToast(`✓ Đã thêm "${book.title}" vào giỏ hàng`);
}

// ── Chuyển sang trang chi tiết ──────────────
function goToDetail(bookId) {
  window.location.href = `detail.html?id=${bookId}`;
}

// ── Sắp xếp ─────────────────────────────────
function sortBooks(type) {
  if (type === 'price-asc') allBooks.sort((a, b) => a.price - b.price);
  else if (type === 'price-desc') allBooks.sort((a, b) => b.price - a.price);
  else if (type === 'popular') allBooks.sort((a, b) => b.sold - a.sold);
  else if (type === 'new') allBooks.sort((a, b) => b.isNew - a.isNew);
  currentPage = 1;
  renderBooks();
}

window.addEventListener('DOMContentLoaded', initHome);
