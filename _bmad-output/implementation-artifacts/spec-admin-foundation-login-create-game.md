---
title: 'Admin foundation — đăng nhập + tạo Game'
type: 'feature'
created: '2026-07-09'
status: 'done'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/brainstorming/brainstorm-chay-tram-app-2026-07-09/brainstorm-intent.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** App CHẠY TRẠM chưa có nền tảng quản trị: chưa có cách để admin đăng nhập, cũng chưa có cách tạo Game — thực thể gốc mà mọi thứ khác (trạm, đội, câu hỏi, điểm) đều tham chiếu tới. Không có bước này thì không xây tiếp được.

**Approach:** Thêm cơ chế xác thực admin đơn giản dựa trên token (seed sẵn 1 admin mặc định khi DB rỗng, cho phép admin đã đăng nhập tạo thêm admin), và API tạo/liệt kê Game được bảo vệ bởi token. Trang admin có form đăng nhập rồi tới form tạo game + danh sách game. Giữ nguyên kiến trúc hiện có (Express + DB file JSON), không thêm thư viện.

## Boundaries & Constraints

**Always:**
- Mật khẩu KHÔNG bao giờ lưu dạng plaintext — băm bằng `crypto.scrypt` của Node (lưu `salt:hash`).
- Mọi API admin (trừ `POST /login`) phải qua middleware kiểm tra token `Authorization: Bearer <token>`.
- Tôn trọng schema `db.js` sẵn có: `admins {id,email,passwordHash}`, `games {id,name,bannerUrl,teamCount,createdAt}`.
- Chỉ dùng dependency đã có (`express`) + module lõi Node (`crypto`). Không thêm package.
- Toàn bộ text hiển thị + comment bằng tiếng Việt, đồng bộ style code hiện tại.

**Ask First:**
- Thay đổi cơ chế lưu token sang persistent/cookie/session.
- Thêm bất kỳ dependency npm nào.

**Never:**
- KHÔNG sinh slot đội / auto-generate tên đội lần này (để story sau).
- KHÔNG tạo trạm, câu hỏi, chấm điểm.
- KHÔNG làm trang đăng ký công khai — chỉ admin đã đăng nhập mới thêm được admin.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login đúng | `POST /api/admin/login {email,password}` khớp | `200 {token, admin:{id,email}}` | N/A |
| Login sai | email/mật khẩu sai | `401 {error}` | Không tiết lộ field nào sai |
| Login thiếu field | thiếu email hoặc password | `400 {error}` | N/A |
| Gọi API bảo vệ, không token | không có/hết hạn/sai token | `401 {error}` | N/A |
| Tạo game hợp lệ | `POST /api/admin/games {name, teamCount, bannerUrl?}` + token | `201 {game}`, game được lưu vào db | N/A |
| Tạo game thiếu tên | `name` rỗng/thiếu | `400 {error}` | N/A |
| Tạo game teamCount sai | teamCount không phải số nguyên ≥ 1 | `400 {error}` | Chuẩn hóa/loại giá trị xấu |
| Thêm admin trùng email | email đã tồn tại | `409 {error}` | N/A |
| Seed admin mặc định | DB không có admin nào lúc khởi động | tạo 1 admin `admin@htrace` | Bỏ qua nếu đã có admin |

</frozen-after-approval>

## Code Map

- `src/db.js` -- kho JSON read/write/update; schema đã có `admins`, `games`. Không sửa.
- `src/auth.js` -- **MỚI**: băm/verify mật khẩu (scrypt), token store in-memory, middleware `requireAdmin`, hàm `seedDefaultAdmin`.
- `src/routes/admin.js` -- thêm `POST /login`, `POST /admins` (bảo vệ), `POST /games` (bảo vệ); bảo vệ `GET /games` sẵn có.
- `server.js` -- gọi `seedDefaultAdmin()` khi khởi động.
- `public/admin.html` -- thay khung tĩnh bằng UI: form login → khu quản trị (form tạo game + danh sách game).
- `public/js/admin.js` -- **MỚI**: logic gọi API, lưu token localStorage, render danh sách game.
- `public/css/style.css` -- thêm style form/nút/danh sách nếu cần (tối thiểu).
- `README.md` -- cập nhật endpoint + thông tin admin mặc định.

## Tasks & Acceptance

**Execution:**
- [x] `src/auth.js` -- Tạo module: `hashPassword`/`verifyPassword` bằng `crypto.scrypt` (format `salt:hashHex`), `createToken(adminId)`/`resolveToken` với Map in-memory, middleware `requireAdmin` đọc header `Authorization: Bearer`, `seedDefaultAdmin()` tạo `admin@htrace` / `admin123` khi chưa có admin nào. -- nền xác thực dùng lại cho mọi route admin.
- [x] `src/routes/admin.js` -- Thêm `POST /login` (verify → trả token), `POST /admins` + `POST /games` (đặt sau `requireAdmin`), bọc `GET /games` bằng `requireAdmin`. Validate input theo I/O matrix. -- API nền tảng quản trị.
- [x] `server.js` -- import auth và gọi `seedDefaultAdmin()` trước `app.listen`. -- đảm bảo luôn có 1 admin để đăng nhập.
- [x] `public/admin.html` + `public/js/admin.js` -- UI: nếu chưa có token → form đăng nhập; có token → form tạo game (tên, số đội, banner tùy chọn) + danh sách game + nút đăng xuất. Hiện lỗi API rõ ràng. -- để admin dùng được qua trình duyệt.
- [x] `public/css/style.css` -- Bổ sung style tối thiểu cho form/input/nút/list (dùng biến màu sẵn có). -- giao diện gọn gàng.
- [x] `README.md` -- Cập nhật danh sách endpoint và ghi chú admin mặc định + cách đổi. -- tài liệu khớp thực tế.

**Acceptance Criteria:**
- Given DB rỗng, when khởi động server, then có đúng 1 admin `admin@htrace` trong `data/db.json` với `passwordHash` đã băm (không plaintext).
- Given khởi động lại server khi đã có admin, when seed chạy, then KHÔNG tạo thêm admin trùng.
- Given đã đăng nhập lấy token, when `POST /api/admin/games` với tên hợp lệ, then game xuất hiện trong `GET /api/admin/games` và trong `data/db.json`.
- Given không gửi token, when gọi bất kỳ API admin nào trừ `/login`, then nhận `401`.
- Given mở `/admin.html` chưa đăng nhập, when tải trang, then thấy form đăng nhập; sau khi đăng nhập đúng thấy khu tạo game + danh sách.

## Verification

**Commands:**
- `npm start` rồi `curl -s -X POST localhost:3000/api/admin/login -H 'Content-Type: application/json' -d '{"email":"admin@htrace","password":"admin123"}'` -- expected: JSON có `token`.
- `TOKEN=<token>; curl -s -X POST localhost:3000/api/admin/games -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"name":"Game Test","teamCount":10}'` -- expected: `201` + object game có `id`.
- `curl -s localhost:3000/api/admin/games` -- expected: `401` (thiếu token).

**Manual checks:**
- Mở `http://localhost:3000/admin.html`: đăng nhập bằng admin mặc định → tạo 1 game → thấy nó trong danh sách; reload trang vẫn còn đăng nhập (token localStorage); nút đăng xuất đưa về form login.

## Suggested Review Order

**Xác thực (backend)**

- Điểm vào: băm scrypt + hash "mồi" chống dò email qua thời gian phản hồi.
  [`auth.js:25`](../../src/auth.js#L25)

- Middleware chặn mọi route admin thiếu/sai Bearer token.
  [`auth.js:66`](../../src/auth.js#L66)

- Login luôn chạy verify (dùng hash mồi khi không có admin) để timing đồng đều.
  [`admin.js:32`](../../src/routes/admin.js#L32)

- Seed admin mặc định khi DB rỗng, gọi lúc khởi động.
  [`auth.js:79`](../../src/auth.js#L79)
  [`server.js:47`](../../server.js#L47)

**API & validate input**

- Ranh giới bảo vệ: mọi route dưới dòng này bắt buộc đăng nhập.
  [`admin.js:43`](../../src/routes/admin.js#L43)

- Tạo game: type-guard chặt (loại array/boolean cho teamCount) → 400 thay vì 500.
  [`admin.js:92`](../../src/routes/admin.js#L92)

**Frontend**

- Gọi API bọc try/catch lỗi mạng, gắn token từ localStorage.
  [`admin.js:29`](../../public/js/admin.js#L29)

- Khởi tạo: kiểm tra token còn hiệu lực → hiện đúng màn login/quản trị.
  [`admin.js:100`](../../public/js/admin.js#L100)

- Markup 2 view + noscript; login hiển thị mặc định để degrade an toàn.
  [`admin.html:20`](../../public/admin.html#L20)
