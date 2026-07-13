---
title: 'Tạo & hiển thị trang QR để đội quét vào game'
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

**Problem:** Chưa có cách để đội vào game. Cần một trang hiển thị mã QR (to, rõ, chiếu được) mã hóa link truy cập vào đúng 1 game; đội quét là mở được trang player của game đó.

**Approach:** Thêm dependency `qrcode`. Server sinh QR dạng SVG từ link tham gia `<<origin>>/player.html?game=<gameId>` (origin lấy từ request để quét qua LAN). Endpoint admin (cần token) trả link + SVG. Thêm trang riêng toàn màn hình `/qr.html?game=<gameId>` hiển thị tên game + QR lớn + link; mở từ nút "Hiện QR" trong danh sách game ở trang admin.

## Boundaries & Constraints

**Always:**
- QR mã hóa `<<origin>>/player.html?game=<gameId>`, origin dựng từ `req.protocol` + `req.get('host')` (để điện thoại cùng mạng LAN quét được, không hardcode localhost).
- Endpoint QR đặt sau `requireAdmin` (cần token Bearer). Trang `qr.html` lấy token từ localStorage (cùng origin).
- `gameId` được `encodeURIComponent` khi ghép vào link.
- Chỉ thêm đúng 1 dependency `qrcode`; ngoài ra vẫn express + crypto lõi. Text + comment tiếng Việt.

**Ask First:**
- Thêm dependency khác ngoài `qrcode`.
- Đổi định dạng link tham gia (đường dẫn/tham số).

**Never:**
- KHÔNG xây luồng player claim slot (story sau) — QR chỉ trỏ tới trang player hiện có.
- KHÔNG gọi dịch vụ QR bên ngoài (phải sinh nội bộ, chạy offline).
- KHÔNG tạo trạm/câu hỏi/chấm điểm.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lấy QR hợp lệ | `GET /api/admin/games/:gameId/qr` + token, game tồn tại | `200 {game:{id,name}, joinUrl, qrSvg}`; `qrSvg` chứa `<svg`; `joinUrl` kết thúc `/player.html?game=<gameId>` | N/A |
| Game không tồn tại | `:gameId` không khớp | `404 {error}` | N/A |
| Thiếu token | không/sai Bearer | `401 {error}` | N/A |
| Mở qr.html chưa đăng nhập | `qr.html?game=<id>`, không có token | Hiện thông báo cần đăng nhập ở trang admin | Không gọi API vô ích khi thiếu token |
| Mở qr.html thiếu tham số game | `qr.html` không có `?game=` | Hiện thông báo thiếu game | N/A |
| Sinh QR lỗi | thư viện ném lỗi | `500 {error}` | Bắt lỗi, không rớt server |

</frozen-after-approval>

## Code Map

- `package.json` -- thêm `qrcode` vào dependencies; chạy `npm install`.
- `src/qr.js` -- **MỚI**: `buildJoinUrl(origin, gameId)` (thuần, encode gameId) — tách để test.
- `src/routes/admin.js` -- thêm `GET /games/:gameId/qr` (async): 404 nếu không có game, sinh SVG bằng `qrcode`, trả `{game, joinUrl, qrSvg}`; 500 nếu sinh lỗi.
- `public/qr.html` -- **MỚI**: trang toàn màn hình hiển thị tên game + QR + link.
- `public/js/qr.js` -- **MỚI**: đọc `game` từ query, lấy token localStorage, gọi API, render QR/lỗi.
- `public/js/admin.js` -- thêm link/nút "Hiện QR" mỗi game, mở `/qr.html?game=<id>` (tab mới).
- `public/css/style.css` -- style trang QR (căn giữa, QR lớn) + nút hiện QR.
- `test/qr.test.js` -- **MỚI**: unit test `buildJoinUrl` (đúng path, encode gameId, không nhân đôi `/`).
- `README.md` -- thêm endpoint QR + trang `qr.html`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- Thêm `"qrcode": "^1.5.4"` vào `dependencies`, chạy `npm install`. -- thư viện sinh QR nội bộ.
- [x] `src/qr.js` -- `buildJoinUrl(origin, gameId)` trả `` `${origin}/player.html?game=${encodeURIComponent(gameId)}` ``. -- logic link tách riêng để test.
- [x] `src/routes/admin.js` -- Thêm `GET /games/:gameId/qr` (async, sau `requireAdmin`): tìm game → 404 nếu không có; dựng origin từ `req.protocol`+`req.get('host')`; `joinUrl = buildJoinUrl(...)`; `qrSvg = await QRCode.toString(joinUrl, {type:'svg', margin:1, width:512})`; trả `{game:{id,name}, joinUrl, qrSvg}`; bọc try/catch trả 500. -- API cung cấp QR.
- [x] `public/qr.html` + `public/js/qr.js` -- Trang: đọc `?game=`; thiếu game → báo lỗi; không có token localStorage → báo cần đăng nhập; ngược lại `GET .../qr`, chèn `qrSvg` vào khung, hiện tên game + `joinUrl`; xử lý 401/404/500. -- trang hiển thị QR.
- [x] `public/js/admin.js` -- Trong `renderGames`, thêm link "Hiện QR" (mở `/qr.html?game=<id>` tab mới) vào phần đầu mỗi game. -- lối vào trang QR.
- [x] `public/css/style.css` -- Style `.qr-page` (căn giữa, nền sáng, QR ~min(80vw,520px)), `.qr-link`, nút/anchor "Hiện QR". -- dễ chiếu & quét.
- [x] `test/qr.test.js` -- Test `buildJoinUrl`: ghép đúng `/player.html?game=`, encode ký tự đặc biệt, không sinh `//` thừa. -- khóa bất biến link.
- [x] `README.md` -- Thêm `GET /api/admin/games/:gameId/qr` vào bảng API và ghi chú trang `qr.html`. -- tài liệu khớp.

**Acceptance Criteria:**
- Given game tồn tại + token hợp lệ, when `GET /games/:id/qr`, then nhận `200` với `qrSvg` chứa `<svg` và `joinUrl` kết thúc `/player.html?game=<id>`.
- Given `:gameId` không tồn tại, when gọi endpoint, then `404`; given thiếu token, then `401`.
- Given mở `/qr.html?game=<id>` sau khi đã đăng nhập ở trang admin, when trang tải, then thấy tên game + 1 mã QR lớn + dòng link; given không có token, then thấy thông báo cần đăng nhập (không lỗi JS).
- Given quét QR bằng điện thoại cùng mạng, when giải mã, then ra đúng URL `http://<host-admin-đang-dùng>/player.html?game=<id>`.

## Verification

**Commands:**
- `node --test test/qr.test.js` -- expected: tất cả PASS.
- `npm start`; đăng nhập lấy `$TOKEN`; tạo game lấy `$GID`; `curl -s localhost:3000/api/admin/games/$GID/qr -H "Authorization: Bearer $TOKEN"` -- expected: JSON có `qrSvg` chứa `<svg`, `joinUrl` kết thúc `/player.html?game=$GID`.
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/admin/games/$GID/qr` -- expected: `401`.
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/admin/games/khong-co/qr -H "Authorization: Bearer $TOKEN"` -- expected: `404`.

**Manual checks:**
- Đăng nhập admin → bấm "Hiện QR" ở 1 game → tab mới `/qr.html?game=<id>` hiện tên game + QR lớn + link; quét thử bằng app QR điện thoại ra đúng link player.

## Suggested Review Order

**API sinh QR (nhân)**

- Điểm vào: handler async bọc toàn bộ trong try/catch (tránh treo khi throw đồng bộ), guard Host, sinh SVG.
  [`admin.js:166`](../../src/routes/admin.js#L166)

- Dựng link tham gia: strip "/" thừa + encode gameId (thuần, có test).
  [`qr.js:12`](../../src/qr.js#L12)

**Trang QR (frontend)**

- Luồng chính: đọc `?game=`, kiểm token/lỗi từng bước, guard dữ liệu trước khi render.
  [`qr.js:21`](../../public/js/qr.js#L21)

- Chèn SVG QR (an toàn: SVG chỉ chứa hình học, không phản chiếu input thô).
  [`qr.js:70`](../../public/js/qr.js#L70)

- Lối vào: link "Hiện QR" mỗi game, mở tab mới với gameId đã encode.
  [`admin.js:91`](../../public/js/admin.js#L91)

**Kiểm thử**

- Khóa bất biến link: path đúng, encode ký tự đặc biệt, không "/" thừa.
  [`qr.test.js:15`](../../test/qr.test.js#L15)
