/**
 * =============================================
 * admin.js – NGƯỜI 2: Admin Frontend Logic
 * Quản lý: Sách, Danh mục, Tài khoản, Đơn hàng
 * =============================================
 */

/* ── State ─────────────────────────────────── */
let adminUser = null;
let allBooks = [], allCategories = [], allUsers = [], allOrders = [];
let editingId = null; // ID đang chỉnh sửa
let deleteCallback = null;
let currentSection = 'dashboard';

/* ═══════════════════════════════════════════
   KHỞI TẠO
   ═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  adminUser = checkAdminAuth();
  document.getElementById('adminName').textContent = adminUser.name;

  // Hiển thị ngày giờ
  updateClock();
  setInterval(updateClock, 1000);

  await loadAllData();
  renderDashboard();
  showSection('dashboard');
});

function updateClock() {
  const el = document.getElementById('adminClock');
  if (el) el.textContent = new Date().toLocaleString('vi-VN');
}

async function loadAllData() {
  try {
    [allBooks, allCategories, allUsers, allOrders] = await Promise.all([
      api.get('/books'),
      api.get('/categories'),
      api.get('/users'),
      api.get('/orders')
    ]);
  } catch (err) {
    showToast('Không thể kết nối server! Hãy chạy: cd backend && npm start', 'error');
  }
}

/* ═══════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════ */
function showSection(name) {
  currentSection = name;
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const sec = document.getElementById(`sec-${name}`);
  if (sec) sec.classList.add('active');

  const link = document.querySelector(`[data-section="${name}"]`);
  if (link) link.classList.add('active');

  const titles = {
    dashboard: '📊 Dashboard',
    books: '📚 Quản lý sách',
    categories: '🏷️ Quản lý danh mục',
    accounts: '👥 Quản lý tài khoản',
    orders: '📦 Quản lý đơn hàng'
  };
  document.getElementById('pageTitle').textContent = titles[name] || name;

  // Render section
  if (name === 'books') renderBooks();
  else if (name === 'categories') renderCategories();
  else if (name === 'accounts') renderAccounts();
  else if (name === 'orders') renderOrders();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

/* ═══════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════ */
function renderDashboard() {
  document.getElementById('statBooks').textContent = allBooks.length;
  document.getElementById('statUsers').textContent = allUsers.filter(u => u.role !== 'admin').length;
  document.getElementById('statOrders').textContent = allOrders.length;
  document.getElementById('statCats').textContent = allCategories.length;

  const revenue = allOrders
    .filter(o => o.status === 'done')
    .reduce((s, o) => s + o.total, 0);
  document.getElementById('statRevenue').textContent = formatCurrency(revenue);

  const pending = allOrders.filter(o => o.status === 'pending').length;
  document.getElementById('statPending').textContent = pending;

  renderRecentOrders();
  renderTopBooks();
  renderOrderChart();
}

function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;
  const recent = [...allOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  tbody.innerHTML = recent.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.customerName}</td>
      <td>
        <div style="font-size:.78rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${o.items.map(i => `${i.title} ×${i.quantity}`).join(', ')}
        </div>
      </td>
      <td><strong style="color:var(--rust)">${formatCurrency(o.total)}</strong></td>
      <td>${formatDate(o.createdAt)}</td>
      <td><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABELS[o.status]}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:#999">Chưa có đơn hàng</td></tr>';
}

function renderTopBooks() {
  const container = document.getElementById('topBooksContainer');
  if (!container) return;
  const top = [...allBooks].sort((a, b) => b.sold - a.sold).slice(0, 5);
  container.innerHTML = top.map((b, i) => {
    const cat = allCategories.find(c => c.id === b.categoryId);
    return `
      <div class="top-book-row">
        <div class="top-rank rank-${i+1}">${i+1}</div>
        <div class="top-book-cover">📚</div>
        <div class="top-book-info">
          <div class="top-book-name">${b.title}</div>
          <div class="top-book-meta">${b.author} · ${cat?.name || ''}</div>
        </div>
        <div class="top-book-sold">
          <strong>${b.sold.toLocaleString()}</strong>
          <span>đã bán</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderOrderChart() {
  const container = document.getElementById('orderStatusChart');
  if (!container) return;
  const counts = {};
  Object.keys(STATUS_LABELS).forEach(k => counts[k] = 0);
  allOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
  const total = allOrders.length || 1;
  const colors = {
    pending: '#f97316', processing: '#3b82f6', shipping: '#10b981',
    done: '#16a34a', cancelled: '#ef4444'
  };
  container.innerHTML = Object.entries(counts).map(([key, cnt]) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${STATUS_LABELS[key]}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${(cnt/total*100).toFixed(0)}%;background:${colors[key]}"></div>
      </div>
      <div class="chart-bar-val">${cnt}</div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════
   BOOKS – NGƯỜI 2 + NGƯỜI 3
   ═══════════════════════════════════════════ */
function renderBooks(filterText = '') {
  const tbody = document.getElementById('booksTableBody');
  if (!tbody) return;
  const q = (filterText || document.getElementById('bookSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('bookCatFilter')?.value || 'all';

  const filtered = allBooks.filter(b => {
    const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchCat = catFilter === 'all' || b.categoryId == catFilter;
    return matchQ && matchCat;
  });

  tbody.innerHTML = filtered.map(book => {
    const cat = allCategories.find(c => c.id === book.categoryId);
    const discount = book.originalPrice > book.price
      ? Math.round((1 - book.price / book.originalPrice) * 100) : 0;
    return `
      <tr>
        <td style="color:#999;font-size:.8rem">#${book.id}</td>
        <td>
          <div class="book-thumb-cell">
            <img src="${book.cover}" alt="${book.title}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div style="display:none;width:44px;height:58px;align-items:center;justify-content:center;font-size:1.4rem;background:var(--gray-100);border-radius:4px">📚</div>
          </div>
        </td>
        <td>
          <div style="font-weight:600;font-size:.88rem;max-width:200px">${book.title}</div>
          <div style="font-size:.75rem;color:#999;margin-top:2px">${book.author}</div>
        </td>
        <td>
          <span style="background:var(--amber-light);color:var(--amber-dark);padding:3px 8px;border-radius:50px;font-size:.75rem;font-weight:600">
            ${cat?.name || '—'}
          </span>
        </td>
        <td>
          <div style="font-weight:700;color:var(--rust)">${formatCurrency(book.price)}</div>
          ${discount > 0 ? `<div style="font-size:.73rem;color:#999;text-decoration:line-through">${formatCurrency(book.originalPrice)}</div>` : ''}
          ${discount > 0 ? `<div style="font-size:.7rem;background:#fef2f2;color:var(--rust);padding:1px 6px;border-radius:4px;display:inline-block">-${discount}%</div>` : ''}
        </td>
        <td>
          <span style="color:${book.stock < 10 ? 'var(--rust)' : 'var(--forest)'};font-weight:600">${book.stock}</span>
          <div style="font-size:.72rem;color:#999">${book.sold.toLocaleString()} đã bán</div>
        </td>
        <td>
          ${book.isNew ? '<span class="mini-badge badge-new">Mới</span>' : ''}
          ${book.isSale ? '<span class="mini-badge badge-sale">Sale</span>' : ''}
        </td>
        <td>
          <div class="action-group">
            <button class="btn-action btn-edit" onclick="openBookModal(${book.id})" title="Sửa">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-action btn-del" onclick="confirmDelete('sách', ${book.id}, deleteBook)" title="Xoá">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="8" style="text-align:center;padding:40px;color:#999">Không tìm thấy sách</td></tr>`;
}

// Populate category filter dropdown
function populateBookCatFilter() {
  const sel = document.getElementById('bookCatFilter');
  if (!sel) return;
  sel.innerHTML = `<option value="all">Tất cả danh mục</option>`
    + allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function openBookModal(bookId = null) {
  editingId = bookId;
  const modal = document.getElementById('bookModal');
  const title = document.getElementById('bookModalTitle');
  const form = document.getElementById('bookForm');

  // Populate category select
  document.getElementById('bkCategoryId').innerHTML =
    allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  if (bookId) {
    const b = allBooks.find(b => b.id === bookId);
    title.textContent = '✏️ Chỉnh sửa sách';
    document.getElementById('bkTitle').value = b.title;
    document.getElementById('bkAuthor').value = b.author;
    document.getElementById('bkCategoryId').value = b.categoryId;
    document.getElementById('bkPrice').value = b.price;
    document.getElementById('bkOriginalPrice').value = b.originalPrice;
    document.getElementById('bkStock').value = b.stock;
    document.getElementById('bkCover').value = b.cover || '';
    document.getElementById('bkDescription').value = b.description || '';
    document.getElementById('bkIsNew').checked = b.isNew;
    document.getElementById('bkIsSale').checked = b.isSale;
  } else {
    title.textContent = '➕ Thêm sách mới';
    form.reset();
  }

  openModal('bookModal');
}

async function saveBook() {
  const data = {
    title: document.getElementById('bkTitle').value.trim(),
    author: document.getElementById('bkAuthor').value.trim(),
    categoryId: parseInt(document.getElementById('bkCategoryId').value),
    price: parseInt(document.getElementById('bkPrice').value),
    originalPrice: parseInt(document.getElementById('bkOriginalPrice').value) || parseInt(document.getElementById('bkPrice').value),
    stock: parseInt(document.getElementById('bkStock').value),
    cover: document.getElementById('bkCover').value.trim(),
    description: document.getElementById('bkDescription').value.trim(),
    isNew: document.getElementById('bkIsNew').checked,
    isSale: document.getElementById('bkIsSale').checked,
    sold: editingId ? (allBooks.find(b => b.id === editingId)?.sold || 0) : 0
  };

  if (!data.title || !data.author || !data.price) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
    return;
  }

  const btn = document.getElementById('saveBookBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

  try {
    if (editingId) {
      const updated = await api.put(`/books/${editingId}`, { ...data, id: editingId });
      allBooks = allBooks.map(b => b.id === editingId ? updated : b);
      showToast('✓ Cập nhật sách thành công!');
    } else {
      const newBook = await api.post('/books', data);
      allBooks.push(newBook);
      showToast('✓ Thêm sách mới thành công!');
    }
    closeModal('bookModal');
    renderBooks();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Lưu sách';
  }
}

async function deleteBook(id) {
  try {
    await api.delete(`/books/${id}`);
    allBooks = allBooks.filter(b => b.id !== id);
    showToast('✓ Đã xoá sách');
    renderBooks();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   CATEGORIES – NGƯỜI 3
   ═══════════════════════════════════════════ */
function renderCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  tbody.innerHTML = allCategories.map(cat => {
    const bookCount = allBooks.filter(b => b.categoryId === cat.id).length;
    return `
      <tr>
        <td style="color:#999;font-size:.8rem">#${cat.id}</td>
        <td>
          <strong>${cat.name}</strong>
        </td>
        <td>
          <code style="background:var(--gray-100);padding:3px 8px;border-radius:4px;font-size:.78rem">${cat.slug}</code>
        </td>
        <td style="color:var(--gray-600);font-size:.85rem;max-width:200px">${cat.description || '—'}</td>
        <td>
          <span style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:50px;font-size:.78rem;font-weight:600">
            ${bookCount} sách
          </span>
        </td>
        <td>
          <div class="action-group">
            <button class="btn-action btn-edit" onclick="openCategoryModal(${cat.id})">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-action btn-del" onclick="confirmDelete('danh mục', ${cat.id}, deleteCategory)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">Chưa có danh mục</td></tr>`;
}

function openCategoryModal(catId = null) {
  editingId = catId;
  const title = document.getElementById('catModalTitle');

  if (catId) {
    const cat = allCategories.find(c => c.id === catId);
    title.textContent = '✏️ Chỉnh sửa danh mục';
    document.getElementById('catName').value = cat.name;
    document.getElementById('catSlug').value = cat.slug;
    document.getElementById('catDesc').value = cat.description || '';
  } else {
    title.textContent = '➕ Thêm danh mục mới';
    document.getElementById('catForm').reset();
  }
  openModal('catModal');
}

// Auto-generate slug
document.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.getElementById('catName');
  if (nameEl) {
    nameEl.addEventListener('input', function () {
      if (!editingId) {
        document.getElementById('catSlug').value = slugify(this.value);
      }
    });
  }
});

function slugify(str) {
  const map = { 'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a','ă':'a','ắ':'a','ặ':'a','ằ':'a','ẳ':'a','ẵ':'a','ấ':'a','ầ':'a','ẩ':'a','ẫ':'a','ậ':'a','è':'e','é':'e','ê':'e','ế':'e','ề':'e','ể':'e','ễ':'e','ệ':'e','ì':'i','í':'i','ò':'o','ó':'o','ô':'o','ố':'o','ồ':'o','ổ':'o','ỗ':'o','ộ':'o','ơ':'o','ớ':'o','ờ':'o','ở':'o','ỡ':'o','ợ':'o','ù':'u','ú':'u','ư':'u','ứ':'u','ừ':'u','ử':'u','ữ':'u','ự':'u','ỳ':'y','ý':'y','đ':'d','ỷ':'y','ỹ':'y','ỵ':'y' };
  return str.toLowerCase().split('').map(c => map[c] || c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function saveCategory() {
  const data = {
    name: document.getElementById('catName').value.trim(),
    slug: document.getElementById('catSlug').value.trim(),
    description: document.getElementById('catDesc').value.trim()
  };

  if (!data.name || !data.slug) {
    showToast('Vui lòng điền tên và slug', 'error');
    return;
  }

  const btn = document.getElementById('saveCatBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lưu...';

  try {
    if (editingId) {
      const updated = await api.put(`/categories/${editingId}`, { ...data, id: editingId });
      allCategories = allCategories.map(c => c.id === editingId ? updated : c);
      showToast('✓ Cập nhật danh mục thành công!');
    } else {
      const newCat = await api.post('/categories', data);
      allCategories.push(newCat);
      showToast('✓ Thêm danh mục thành công!');
    }
    closeModal('catModal');
    renderCategories();
    populateBookCatFilter();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu';
  }
}

async function deleteCategory(id) {
  const usedCount = allBooks.filter(b => b.categoryId === id).length;
  if (usedCount > 0) {
    showToast(`Không thể xoá! Danh mục đang chứa ${usedCount} sách.`, 'error');
    return;
  }
  try {
    await api.delete(`/categories/${id}`);
    allCategories = allCategories.filter(c => c.id !== id);
    showToast('✓ Đã xoá danh mục');
    renderCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   ACCOUNTS – NGƯỜI 2 + NGƯỜI 3
   ═══════════════════════════════════════════ */
function renderAccounts(filterText = '') {
  const tbody = document.getElementById('accountsTableBody');
  if (!tbody) return;
  const q = (filterText || document.getElementById('userSearchInput')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';

  const filtered = allUsers.filter(u => {
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchQ && matchRole;
  });

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td style="color:#999;font-size:.8rem">#${u.id}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:${u.role==='admin'?'var(--amber)':'var(--forest)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0">
            ${u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:.88rem">${u.name}</div>
            <div style="font-size:.75rem;color:#999">${formatDate(u.createdAt)}</div>
          </div>
        </div>
      </td>
      <td style="font-size:.85rem">${u.email}</td>
      <td style="font-size:.85rem;color:#666">${u.phone || '—'}</td>
      <td>
        <span class="status-badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">
          ${u.role === 'admin' ? '👑 Admin' : '👤 User'}
        </span>
      </td>
      <td>
        <span class="status-badge ${u.isActive ? 'badge-active' : 'badge-inactive'}">
          ${u.isActive ? '✓ Hoạt động' : '✗ Đã khoá'}
        </span>
      </td>
      <td>
        <div class="action-group">
          <button class="btn-action btn-edit" onclick="openAccountModal(${u.id})" title="Sửa">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-action ${u.isActive ? 'btn-warn' : 'btn-ok'}"
            onclick="toggleUserStatus(${u.id})" title="${u.isActive ? 'Khoá' : 'Mở khoá'}">
            <i class="fas fa-${u.isActive ? 'ban' : 'unlock'}"></i>
          </button>
          <button class="btn-action btn-del" onclick="confirmDelete('tài khoản', ${u.id}, deleteAccount)"
            ${u.id === adminUser.id ? 'disabled title="Không thể xoá chính mình"' : ''}>
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" style="text-align:center;padding:40px;color:#999">Không tìm thấy</td></tr>`;
}

function openAccountModal(userId = null) {
  editingId = userId;
  const title = document.getElementById('accModalTitle');

  if (userId) {
    const u = allUsers.find(u => u.id === userId);
    title.textContent = '✏️ Chỉnh sửa tài khoản';
    document.getElementById('accName').value = u.name;
    document.getElementById('accEmail').value = u.email;
    document.getElementById('accPhone').value = u.phone || '';
    document.getElementById('accAddress').value = u.address || '';
    document.getElementById('accRole').value = u.role;
    document.getElementById('accPassword').value = '';
    document.getElementById('accPassword').placeholder = 'Để trống = không đổi mật khẩu';
  } else {
    title.textContent = '➕ Thêm tài khoản mới';
    document.getElementById('accForm').reset();
    document.getElementById('accPassword').placeholder = 'Mật khẩu (tối thiểu 6 ký tự)';
    document.getElementById('accRole').value = 'user';
  }
  openModal('accModal');
}

async function saveAccount() {
  const name = document.getElementById('accName').value.trim();
  const email = document.getElementById('accEmail').value.trim();
  const phone = document.getElementById('accPhone').value.trim();
  const address = document.getElementById('accAddress').value.trim();
  const role = document.getElementById('accRole').value;
  const password = document.getElementById('accPassword').value;

  if (!name || !email) {
    showToast('Vui lòng điền tên và email', 'error');
    return;
  }

  const data = { name, email, phone, address, role };
  if (!editingId && !password) {
    showToast('Vui lòng nhập mật khẩu cho tài khoản mới', 'error'); return;
  }
  if (password) {
    if (password.length < 6) { showToast('Mật khẩu phải ≥ 6 ký tự', 'error'); return; }
    data.password = password;
  }

  const btn = document.getElementById('saveAccBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lưu...';

  try {
    if (editingId) {
      const existing = allUsers.find(u => u.id === editingId);
      const updated = await api.put(`/users/${editingId}`, {
        ...existing, ...data,
        password: data.password || existing.password
      });
      allUsers = allUsers.map(u => u.id === editingId ? updated : u);
      showToast('✓ Cập nhật tài khoản thành công!');
    } else {
      // Kiểm tra email trùng
      const dupEmail = allUsers.find(u => u.email === email);
      if (dupEmail) { showToast('Email đã tồn tại!', 'error'); btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Lưu'; return; }
      const newUser = await api.post('/users', {
        ...data, isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      });
      allUsers.push(newUser);
      showToast('✓ Thêm tài khoản thành công!');
    }
    closeModal('accModal');
    renderAccounts();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu';
  }
}

async function toggleUserStatus(id) {
  const u = allUsers.find(u => u.id === id);
  if (!u) return;
  if (id === adminUser.id) { showToast('Không thể khoá tài khoản của chính mình', 'error'); return; }

  try {
    const updated = await api.patch(`/users/${id}`, { isActive: !u.isActive });
    allUsers = allUsers.map(x => x.id === id ? updated : x);
    showToast(`✓ ${updated.isActive ? 'Đã mở khoá' : 'Đã khoá'} tài khoản ${u.name}`);
    renderAccounts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteAccount(id) {
  if (id === adminUser.id) { showToast('Không thể xoá chính mình', 'error'); return; }
  try {
    await api.delete(`/users/${id}`);
    allUsers = allUsers.filter(u => u.id !== id);
    showToast('✓ Đã xoá tài khoản');
    renderAccounts();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   ORDERS – NGƯỜI 4
   ═══════════════════════════════════════════ */
function renderOrders(filterStatus = '') {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  const status = filterStatus || document.getElementById('orderStatusFilter')?.value || 'all';
  const q = document.getElementById('orderSearchInput')?.value?.toLowerCase() || '';

  const filtered = allOrders.filter(o => {
    const matchStatus = status === 'all' || o.status === status;
    const matchQ = !q || o.customerName.toLowerCase().includes(q) ||
      String(o.id).includes(q) || o.customerPhone?.includes(q);
    return matchStatus && matchQ;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong style="font-size:.9rem">#${o.id}</strong></td>
      <td>
        <div style="font-weight:600;font-size:.87rem">${o.customerName}</div>
        <div style="font-size:.75rem;color:#999">${o.customerPhone || ''}</div>
        <div style="font-size:.75rem;color:#999;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.address}</div>
      </td>
      <td>
        <div style="font-size:.8rem;max-width:180px">
          ${o.items.map(i => `<div>📖 ${i.title} <strong>×${i.quantity}</strong></div>`).join('')}
        </div>
      </td>
      <td><strong style="color:var(--rust)">${formatCurrency(o.total)}</strong></td>
      <td style="font-size:.78rem;color:#666">${formatDateTime(o.createdAt)}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)"
          style="border-color:${getStatusColor(o.status)}">
          ${Object.entries(STATUS_LABELS).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`
          ).join('')}
        </select>
      </td>
      <td>
        <div class="action-group">
          <button class="btn-action btn-info" onclick="viewOrderDetail(${o.id})" title="Xem chi tiết">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-action btn-del" onclick="confirmDelete('đơn hàng', ${o.id}, deleteOrder)" title="Xoá">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7" style="text-align:center;padding:40px;color:#999">Không có đơn hàng</td></tr>`;
}

function getStatusColor(s) {
  const c = { pending:'#f97316', processing:'#3b82f6', shipping:'#10b981', done:'#16a34a', cancelled:'#ef4444' };
  return c[s] || '#999';
}

async function updateOrderStatus(id, newStatus) {
  try {
    const updated = await api.patch(`/orders/${id}`, { status: newStatus });
    allOrders = allOrders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    showToast(`✓ Cập nhật trạng thái → ${STATUS_LABELS[newStatus]}`);
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function viewOrderDetail(id) {
  const o = allOrders.find(o => o.id === id);
  if (!o) return;

  document.getElementById('orderDetailTitle').textContent = `Chi tiết đơn hàng #${o.id}`;
  document.getElementById('orderDetailBody').innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-block">
        <h4><i class="fas fa-user"></i> Thông tin khách hàng</h4>
        <table class="detail-info-table">
          <tr><td>Họ tên</td><td><strong>${o.customerName}</strong></td></tr>
          <tr><td>Email</td><td>${o.customerEmail}</td></tr>
          <tr><td>SĐT</td><td>${o.customerPhone}</td></tr>
          <tr><td>Địa chỉ</td><td>${o.address}</td></tr>
          ${o.note ? `<tr><td>Ghi chú</td><td><em>${o.note}</em></td></tr>` : ''}
        </table>
      </div>
      <div class="order-detail-block">
        <h4><i class="fas fa-info-circle"></i> Thông tin đơn hàng</h4>
        <table class="detail-info-table">
          <tr><td>Mã đơn</td><td><strong>#${o.id}</strong></td></tr>
          <tr><td>Ngày đặt</td><td>${formatDateTime(o.createdAt)}</td></tr>
          <tr><td>Trạng thái</td><td><span class="status-badge ${STATUS_CLASS[o.status]}">${STATUS_LABELS[o.status]}</span></td></tr>
          <tr><td>Tổng tiền</td><td><strong style="color:var(--rust);font-size:1.1rem">${formatCurrency(o.total)}</strong></td></tr>
        </table>
      </div>
    </div>
    <div class="order-detail-block" style="margin-top:16px">
      <h4><i class="fas fa-books"></i> Danh sách sách</h4>
      <table class="admin-table" style="margin-top:10px">
        <thead><tr><th>Tên sách</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
        <tbody>
          ${o.items.map(i => `
            <tr>
              <td><strong>${i.title}</strong></td>
              <td>${formatCurrency(i.price)}</td>
              <td style="text-align:center">${i.quantity}</td>
              <td><strong style="color:var(--rust)">${formatCurrency(i.price * i.quantity)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  openModal('orderDetailModal');
}

function openAddOrderModal() {
  editingId = null;
  document.getElementById('addOrderModalTitle').textContent = '➕ Thêm đơn hàng mới';
  document.getElementById('addOrderForm').reset();
  document.getElementById('orderItemsContainer').innerHTML = '';
  addOrderItem(); // thêm 1 dòng sản phẩm mặc định
  openModal('addOrderModal');
}

function addOrderItem() {
  const container = document.getElementById('orderItemsContainer');
  const idx = container.children.length;
  const div = document.createElement('div');
  div.className = 'order-item-row-form';
  div.innerHTML = `
    <select class="order-item-book" onchange="updateOrderItemPrice(this)">
      <option value="">— Chọn sách —</option>
      ${allBooks.map(b => `<option value="${b.id}" data-price="${b.price}">${b.title} (${formatCurrency(b.price)})</option>`).join('')}
    </select>
    <input type="number" class="order-item-qty" value="1" min="1" placeholder="SL" style="width:70px" oninput="calcOrderTotal()" />
    <button type="button" class="btn-action btn-del" onclick="this.parentNode.remove();calcOrderTotal()">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(div);
}

function updateOrderItemPrice(sel) { calcOrderTotal(); }

function calcOrderTotal() {
  let total = 0;
  document.querySelectorAll('.order-item-row-form').forEach(row => {
    const sel = row.querySelector('.order-item-book');
    const qty = parseInt(row.querySelector('.order-item-qty').value) || 0;
    const price = parseInt(sel.selectedOptions[0]?.dataset.price) || 0;
    total += price * qty;
  });
  const el = document.getElementById('addOrderTotal');
  if (el) el.textContent = formatCurrency(total);
}

async function saveNewOrder() {
  const customerName = document.getElementById('aoName').value.trim();
  const customerEmail = document.getElementById('aoEmail').value.trim();
  const customerPhone = document.getElementById('aoPhone').value.trim();
  const address = document.getElementById('aoAddress').value.trim();
  const note = document.getElementById('aoNote').value.trim();
  const status = document.getElementById('aoStatus').value;

  if (!customerName || !address) { showToast('Vui lòng điền tên và địa chỉ', 'error'); return; }

  const items = [];
  let total = 0;
  let valid = true;
  document.querySelectorAll('.order-item-row-form').forEach(row => {
    const sel = row.querySelector('.order-item-book');
    const qty = parseInt(row.querySelector('.order-item-qty').value) || 0;
    const bookId = parseInt(sel.value);
    if (!bookId || qty < 1) { valid = false; return; }
    const book = allBooks.find(b => b.id === bookId);
    items.push({ bookId, title: book.title, price: book.price, quantity: qty });
    total += book.price * qty;
  });

  if (!valid || items.length === 0) { showToast('Vui lòng thêm ít nhất 1 sản phẩm hợp lệ', 'error'); return; }

  const btn = document.getElementById('saveOrderBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lưu...';

  try {
    const newOrder = await api.post('/orders', {
      userId: null, customerName, customerEmail, customerPhone,
      address, note, items, total, status,
      createdAt: new Date().toISOString()
    });
    allOrders.push(newOrder);
    showToast('✓ Thêm đơn hàng thành công!');
    closeModal('addOrderModal');
    renderOrders();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu đơn hàng';
  }
}

async function deleteOrder(id) {
  try {
    await api.delete(`/orders/${id}`);
    allOrders = allOrders.filter(o => o.id !== id);
    showToast('✓ Đã xoá đơn hàng');
    renderOrders();
    renderDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ═══════════════════════════════════════════
   MODAL HELPERS
   ═══════════════════════════════════════════ */
function openModal(id) {
  document.getElementById('modalBackdrop').classList.add('open');
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById(id)?.classList.remove('open');
  // Close all modals
  document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('open'));
}

/* ═══════════════════════════════════════════
   CONFIRM DELETE DIALOG
   ═══════════════════════════════════════════ */
function confirmDelete(type, id, callback) {
  deleteCallback = () => { callback(id); closeConfirm(); };
  document.getElementById('confirmMsg').textContent = `Bạn có chắc muốn xoá ${type} #${id}? Hành động này không thể hoàn tác.`;
  document.getElementById('confirmDialog').classList.add('open');
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeConfirm() {
  document.getElementById('confirmDialog').classList.remove('open');
  document.getElementById('modalBackdrop').classList.remove('open');
  deleteCallback = null;
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    if (deleteCallback) deleteCallback();
  });
  populateBookCatFilter();
});
