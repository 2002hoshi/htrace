# CHẠY TRẠM APP

Bản demo web của game **chạy trạm** (station/checkpoint racing game). Admin tạo
game & trạm, điều phối đội qua QR; người chơi giải câu đố bí ẩn để nhận trạm, làm
thử thách tại trạm và được admin chấm điểm.

> Đây là bản demo để tập vibe-coding. Mục tiêu: chạy ổn định các chức năng cơ bản.
> Đặc tả tính năng đầy đủ: `_bmad-output/brainstorming/brainstorm-chay-tram-app-2026-07-09/brainstorm-intent.md`

## Công nghệ

- **Backend:** Node.js + Express
- **Lưu dữ liệu:** file JSON (`data/db.json`) — nhẹ, dễ đọc; sau nâng lên SQLite dễ dàng
- **Frontend:** HTML/CSS/JS thuần trong `public/`

## Chạy

```bash
npm install      # cài Express
npm start        # chạy server ở http://localhost:3000
# hoặc: npm run dev  (tự reload khi sửa server)
```

## Cấu trúc

```text
server.js            # khởi động Express, gắn route, phục vụ /public
src/
  db.js              # kho dữ liệu JSON (read/write/update)
  routes/
    admin.js         # API cho Admin (khung)
    player.js        # API cho Player (khung)
public/              # frontend tĩnh
  index.html         # trang chủ (chọn vai)
  admin.html         # trang Admin (khung)
  player.html        # trang Người chơi (khung)
  css/style.css
  js/main.js
data/db.json         # dữ liệu (tự tạo khi chạy lần đầu)
```

## Admin

Khi chạy lần đầu (DB chưa có admin), hệ thống tự tạo admin mặc định:

- **Email:** `admin@htrace`
- **Mật khẩu:** `admin123`

Đăng nhập tại `http://localhost:3000/admin.html`. Đổi mật khẩu: xóa `data/db.json`
để seed lại, hoặc dùng `POST /api/admin/admins` để thêm tài khoản admin khác.

## API chính

| Method & Path | Bảo vệ | Mô tả |
| --- | --- | --- |
| `GET /api/health` | không | kiểm tra server sống |
| `POST /api/admin/login` | không | đăng nhập → trả `token` |
| `POST /api/admin/logout` | token | hủy phiên |
| `GET /api/admin/me` | token | admin hiện tại |
| `POST /api/admin/admins` | token | thêm admin mới |
| `GET /api/admin/games` | token | danh sách game |
| `POST /api/admin/games` | token | tạo game (`name`, `teamCount`, `bannerUrl?`) |
| `GET /api/admin/games/:gameId/teams` | token | danh sách đội của game |
| `POST /api/admin/games/:gameId/teams` | token | sinh slot đội + tên tự động (1 lần/game) |
| `GET /api/admin/games/:gameId/qr` | token | link tham gia + mã QR (SVG) của game |
| `GET /api/player/status` | không | số game/trạm/đội |
| `POST /api/player/games/:gameId/join` | không | player nhận 1 slot đội trống (409 nếu hết) |
| `GET /api/player/games/:gameId/teams/:teamId` | không | lấy lại đội đã nhận (dùng khi reload) |

Trang `qr.html?game=<gameId>` (mở từ nút "Hiện QR" ở trang admin) hiển thị mã QR
lớn để chiếu/đưa đội quét. QR mã hóa link `player.html?game=<gameId>` theo đúng
host admin đang dùng, nên điện thoại cùng mạng LAN quét là vào được.

Trang `player.html?game=<gameId>` (đích của QR) tự nhận 1 slot đội trống và hiển
thị tên đội; danh tính đội lưu ở `localStorage` để reload không chiếm slot mới.

API bảo vệ yêu cầu header `Authorization: Bearer <token>`.
