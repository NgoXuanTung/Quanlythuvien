/**
 * =============================================
 * auth.js – NGƯỜI 4: Auth Logic
 * Xử lý login, logout, register, session
 * =============================================
 */

const Auth = {
  // Lấy user đang đăng nhập từ localStorage
  getCurrentUser() {
    const data = localStorage.getItem('nhanam_user');
    return data ? JSON.parse(data) : null;
  },

  // Lưu user vào localStorage
  setUser(user) {
    localStorage.setItem('nhanam_user', JSON.stringify(user));
  },

  // Xoá session (logout)
  logout() {
    localStorage.removeItem('nhanam_user');
    window.location.href = 'login.html';
  },

  // Kiểm tra đã đăng nhập chưa
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // Bắt buộc đăng nhập (dùng trên trang cần auth)
  requireLogin() {
    if (!this.isLoggedIn()) {
      sessionStorage.setItem('redirect_after_login', window.location.href);
      window.location.href = 'login.html';
    }
  },

  // Cập nhật UI header theo trạng thái đăng nhập
  updateHeader() {
    const user = this.getCurrentUser();
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;

    if (user) {
      authLinks.innerHTML = `
        <span class="header-user">
          <i class="fas fa-user-circle"></i>
          <span>${user.name}</span>
        </span>
        <a href="orders.html" class="header-link">
          <i class="fas fa-receipt"></i> Đơn hàng
        </a>
        <button onclick="Auth.logout()" class="btn-logout">
          <i class="fas fa-sign-out-alt"></i> Đăng xuất
        </button>
      `;
    } else {
      authLinks.innerHTML = `
        <a href="login.html" class="header-link">
          <i class="fas fa-sign-in-alt"></i> Đăng nhập
        </a>
        <a href="register.html" class="btn-register-header">Đăng ký</a>
      `;
    }
  }
};

/* =====================================================
   LOGIN PAGE LOGIC
   ===================================================== */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
  errEl.textContent = '';

  try {
    const result = await api.post('/login', { email, password });
    Auth.setUser(result.user);

    // Redirect về trang trước hoặc trang chủ
    const redirect = sessionStorage.getItem('redirect_after_login') || 'index.html';
    sessionStorage.removeItem('redirect_after_login');
    window.location.href = redirect;
  } catch (err) {
    errEl.textContent = err.message;
    btn.disabled = false;
    btn.innerHTML = 'Đăng nhập';
  }
}

/* =====================================================
   REGISTER PAGE LOGIC
   ===================================================== */
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const phone = document.getElementById('regPhone').value.trim();
  const btn = document.getElementById('registerBtn');
  const errEl = document.getElementById('registerError');

  errEl.textContent = '';

  if (password !== confirm) {
    errEl.textContent = 'Mật khẩu xác nhận không khớp';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  try {
    const result = await api.post('/register', { name, email, password, phone });
    Auth.setUser(result.user);
    window.location.href = 'index.html';
  } catch (err) {
    errEl.textContent = err.message;
    btn.disabled = false;
    btn.innerHTML = 'Đăng ký ngay';
  }
}
