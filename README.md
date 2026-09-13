# 📚 Nhã Nam Books — Web Bán Sách

Dự án web bán sách được xây dựng theo mô hình **4 người**, sử dụng **Vanilla JS** + **JSON Server**.

---

## 🗂️ Cấu trúc thư mục

```
bookstore-full/
│
├── backend/                    ← NGƯỜI 3: API Server
│   ├── db.json                 ← Database (books, categories, users, orders)
│   ├── server.js               ← Custom json-server + auth endpoints
│   └── package.json
│
├── user/                       ← NGƯỜI 1 + NGƯỜI 4: Frontend User
│   ├── index.html              ← Trang chủ (danh sách sách)
│   ├── detail.html             ← Chi tiết sách
│   ├── cart.html               ← Giỏ hàng
│   ├── checkout.html           ← Thanh toán
│   ├── orders.html             ← Lịch sử đơn hàng
│   ├── login.html              ← Đăng nhập
│   ├── register.html           ← Đăng ký
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js           ← Cấu hình API, helper functions
│       ├── auth.js             ← NGƯỜI 4: Login, Register, Session
│       ├── cart.js             ← NGƯỜI 1: Giỏ hàng (localStorage)
│       ├── main.js             ← NGƯỜI 1: Trang chủ
│       ├── detail.js           ← NGƯỜI 1: Chi tiết sách
│       └── checkout.js         ← NGƯỜI 4: Checkout + Orders history
│
└── admin/                      ← NGƯỜI 2: Frontend Admin
    ├── index.html              ← Admin Panel (Dashboard + tất cả CRUD)
    ├── css/
    │   └── admin.css
    └── js/
        ├── config.js           ← Cấu hình API cho admin
        └── admin.js            ← NGƯỜI 2: Toàn bộ logic CRUD
```

---

## ⚙️ Cài đặt & Chạy

### Bước 1 — Cài đặt Backend

```bash
cd backend
npm install
npm start
```

> Server chạy tại: **http://localhost:3000**

### Bước 2 — Mở Frontend

Mở trình duyệt, truy cập các file HTML trực tiếp:

| Trang | Đường dẫn |
|-------|-----------|
| Trang chủ | `user/index.html` |
| Admin | `admin/index.html` |

> **Lưu ý:** Cần mở file bằng **Live Server** (VS Code extension) hoặc HTTP server, KHÔNG mở trực tiếp bằng `file://` vì sẽ bị lỗi CORS khi gọi API.

#### Cách chạy bằng VS Code Live Server:
1. Cài extension **Live Server** trong VS Code
2. Chuột phải vào `user/index.html` → **Open with Live Server**
3. Tương tự cho `admin/index.html`

#### Hoặc dùng Python HTTP Server:
```bash
# Trong thư mục bookstore-full/
python -m http.server 8080
# Rồi mở: http://localhost:8080/user/index.html
```

---

## 🔐 Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| 👑 Admin | admin@nhanam.vn | admin123 |
| 👤 User | an@gmail.com | 123456 |
| 👤 User | binh@gmail.com | 123456 |

> **Đăng nhập Admin:** Truy cập `admin/index.html` → sẽ tự redirect về login nếu chưa đăng nhập

---

## 🌐 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/books` | Lấy danh sách sách |
| GET | `/books/:id` | Lấy chi tiết sách |
| POST | `/books` | Thêm sách mới |
| PUT | `/books/:id` | Cập nhật sách |
| DELETE | `/books/:id` | Xoá sách |
| GET | `/categories` | Lấy danh mục |
| POST | `/categories` | Thêm danh mục |
| PUT | `/categories/:id` | Cập nhật danh mục |
| DELETE | `/categories/:id` | Xoá danh mục |
| GET | `/users` | Lấy danh sách user |
| POST | `/users` | Thêm user |
| PUT | `/users/:id` | Cập nhật user |
| DELETE | `/users/:id` | Xoá user |
| GET | `/orders` | Lấy tất cả đơn hàng |
| POST | `/orders` | Tạo đơn hàng mới |
| PATCH | `/orders/:id` | Cập nhật trạng thái đơn |
| DELETE | `/orders/:id` | Xoá đơn hàng |
| POST | `/login` | Đăng nhập |
| POST | `/register` | Đăng ký |
| GET | `/my-orders?userId=X` | Lấy đơn hàng theo user |

---

## ✅ Chức năng đã hoàn thiện

### Client (Người 1 + Người 4)
- [x] Đăng ký tài khoản
- [x] Đăng nhập / Đăng xuất
- [x] Hiển thị danh sách sách (lọc, tìm kiếm, phân trang, sắp xếp)
- [x] Hiển thị chi tiết sách
- [x] Giỏ hàng (thêm, sửa, xoá, lưu localStorage)
- [x] Thanh toán (form giao hàng, tạo đơn qua API)
- [x] Lịch sử mua hàng

### Admin (Người 2)
- [x] Dashboard (thống kê, đơn hàng gần đây, sách bán chạy, biểu đồ)
- [x] Quản lý sách: Hiển thị, Thêm, Sửa, Xoá
- [x] Quản lý danh mục: Hiển thị, Thêm, Sửa, Xoá
- [x] Quản lý tài khoản: Hiển thị, Thêm, Sửa, Xoá, Khoá/Mở khoá
- [x] Quản lý đơn hàng: Hiển thị, Thêm, Xem chi tiết, Cập nhật trạng thái, Xoá

### Backend (Người 3)
- [x] json-server với db.json đầy đủ dữ liệu mẫu
- [x] Custom endpoint: `/login`, `/register`, `/my-orders`
- [x] CORS enabled
- [x] CRUD đầy đủ cho tất cả resources

---

## 👥 Phân công

| Người | Phụ trách |
|-------|-----------|
| Người 1 | `user/index.html`, `detail.html`, `cart.html`, `js/main.js`, `js/detail.js`, `js/cart.js` |
| Người 2 | `admin/index.html`, `admin/css/`, `admin/js/admin.js` |
| Người 3 | `backend/server.js`, `backend/db.json`, `backend/package.json` |
| Người 4 | `user/login.html`, `register.html`, `checkout.html`, `orders.html`, `js/auth.js`, `js/checkout.js` |

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** [json-server](https://github.com/typicode/json-server) v0.17
- **Icons:** Font Awesome 6.5
- **Fonts:** Google Fonts (Playfair Display + Be Vietnam Pro)
- **Storage:** localStorage (giỏ hàng + session)
