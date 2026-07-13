---
title: 'Player quét QR → join game → nhận & hiển thị slot đội'
type: 'feature'
created: '2026-07-13'
status: 'done'
baseline_commit: '7af75fc1f90c7a2937b6a7211a08f87aa067136f'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/brainstorming/brainstorm-chay-tram-app-2026-07-09/brainstorm-intent.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Đội quét QR mở `/player.html?game=<gameId>` nhưng trang trơ, chưa nhận được đội. Cần: gán cho thiết bị 1 slot đội đã sinh sẵn và hiển thị tên đội (do admin auto-generate, đội không tự đặt).

**Approach:** Thêm API player công khai để "claim" 1 slot đội `status:'empty'` còn trống của game; hết slot thì báo đã đầy. Trang player đọc `?game=`, join, hiển thị tên đội. Danh tính đội giữ bằng `localStorage` theo `teamId` (key theo gameId) nên reload/quét lại không chiếm slot mới. Nối tiếp Node+Express + DB JSON sẵn có, không thêm dependency.

## Boundaries & Constraints

**Always:**
- Join = claim slot có sẵn (`status:'empty'` → `'joined'`), KHÔNG tạo đội mới; tôn trọng schema `teams`, chỉ đổi `status`.
- Claim phải nguyên tử: tìm + đổi status trong CÙNG một `db.update` (Node đơn luồng, phần sync của update không bị xen kẽ) để 2 thiết bị không nhận trùng 1 slot.
- Giữ `teamId` ở `localStorage` key `htrace_team_<gameId>`; có teamId hợp lệ thì hiển thị lại đúng đội đó, không join mới.
- API player công khai (không cần token admin). Text + comment tiếng Việt, đồng bộ style hiện tại.

**Ask First:**
- Cơ chế nhả/đổi slot đội, hoặc định danh thiết bị mạnh hơn localStorage.
- Đổi ý nghĩa/giá trị `status` ngoài `empty`→`joined`.

**Never:**
- KHÔNG cho đội tự đặt/sửa tên.
- KHÔNG làm câu đố mở màn, nhận trạm, chấm điểm (story sau).
- KHÔNG dùng token admin cho luồng player.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Join lần đầu còn slot | `POST /api/player/games/:gameId/join`, game tồn tại, còn slot `empty` | `200 {team:{id,name}}`; slot đó chuyển `status:'joined'` | N/A |
| Hết slot trống | tất cả đội của game đã `joined` | `409 {error, full:true}` | Không đổi dữ liệu |
| Game không tồn tại | `:gameId` không khớp | `404 {error}` | N/A |
| Lấy lại đội theo teamId | `GET /api/player/games/:gameId/teams/:teamId`, hợp lệ | `200 {team:{id,name,status}}` | N/A |
| teamId sai/không thuộc game | teamId không có hoặc khác gameId | `404 {error}` | Client xóa localStorage rồi join lại |
| Mở trang thiếu `?game=` | `player.html` không có game | Hiện thông báo thiếu mã game | Không gọi API vô ích |
| Có teamId đã lưu | localStorage `htrace_team_<gameId>` tồn tại | Hiển thị lại đúng tên đội, KHÔNG chiếm slot mới | teamId chết → xóa & join lại |

</frozen-after-approval>

## Code Map

- `src/db.js` -- `read`/`update`; schema `teams` đã có. Không sửa.
- `src/join.js` -- **MỚI**: `pickOpenSlot(teams, gameId)` trả slot `empty` đầu tiên của game hoặc `null` (thuần, để test).
- `src/routes/player.js` -- thêm `POST /games/:gameId/join` (claim nguyên tử qua `db.update`) và `GET /games/:gameId/teams/:teamId` (lấy đội). Giữ `/status`.
- `public/player.html` -- **rewrite**: các khu loading / đã-vào-đội / hết-slot / lỗi.
- `public/js/player.js` -- **MỚI**: đọc `?game=`, dùng localStorage teamId, join/rehydrate, render tên đội hoặc trang "hết slot".
- `public/css/style.css` -- style trang player (căn giữa, tên đội lớn, trạng thái chờ).
- `test/join.test.js` -- **MỚI**: unit test `pickOpenSlot` (chọn đúng slot empty đầu, bỏ qua game khác/đội joined, null khi hết).
- `README.md` -- thêm 2 endpoint player.

## Tasks & Acceptance

**Execution:**
- [x] `src/join.js` -- `pickOpenSlot(teams, gameId)` = `teams.find(t => t.gameId===gameId && t.status==='empty') || null`. -- logic chọn slot tách riêng để test.
- [x] `src/routes/player.js` -- `POST /games/:gameId/join`: trong `db.update` → không có game trả `{error:404}`; `pickOpenSlot` null trả `{error:409}`; ngược lại đặt `slot.status='joined'` và trả slot. Map ra `404` / `409 {full:true}` / `200 {team:{id,name}}`. `GET /games/:gameId/teams/:teamId`: tìm đội theo id + đúng gameId, 404 nếu không có, trả `{team:{id,name,status}}`. -- API join & rehydrate.
- [x] `public/player.html` + `public/js/player.js` -- Đọc `?game=` (thiếu → báo lỗi). Đọc `localStorage['htrace_team_'+gameId]`: có → `GET` đội (200 hiển thị tên; 404 → xóa key rồi join). Không có → `POST join` (200 → lưu teamId + hiển thị tên; 409 → trang "Xin lỗi, đã hết slot, hẹn bạn lần sau nhé"; 404 → báo không thấy game). Bắt lỗi mạng. -- trang player.
- [x] `public/css/style.css` -- Style `.player-page`, tên đội lớn, trạng thái chờ, khu "hết slot" (dùng biến màu sẵn có). -- dễ nhìn trên điện thoại.
- [x] `test/join.test.js` -- Test `pickOpenSlot`: chọn slot empty đầu tiên; bỏ qua đội `joined` và đội của game khác; trả null khi không còn empty. -- khóa bất biến claim.
- [x] `README.md` -- Thêm `POST /api/player/games/:gameId/join` và `GET /api/player/games/:gameId/teams/:teamId`. -- tài liệu khớp.

**Acceptance Criteria:**
- Given game có slot `empty`, when thiết bị mới mở `player.html?game=<id>`, then được gán 1 đội, thấy tên đội (dạng `Đội ... (NN)`), và slot đó thành `joined`.
- Given thiết bị đã join (teamId trong localStorage), when reload hoặc quét QR lại, then thấy lại ĐÚNG đội cũ, tổng số đội `joined` KHÔNG tăng.
- Given mọi slot của game đã `joined`, when thiết bị mới join, then nhận `409` và trang hiện thông báo hết slot; số đội `joined` không đổi.
- Given `:gameId` không tồn tại, when join/get, then `404`.
- Given 2 request join gần như đồng thời còn đúng 1 slot, when xử lý, then chỉ 1 request nhận được đội, request kia bị `409`.

## Verification

**Commands:**
- `node --test test/join.test.js` -- expected: tất cả PASS.
- `npm start`; đăng nhập admin, tạo game teamCount=2, sinh slot đội, lấy `$GID`; `curl -s -X POST localhost:3000/api/player/games/$GID/join` -- expected: `200` + `team.name`.
- Gọi `POST .../join` 3 lần -- expected: 2 lần `200` (tên khác nhau), lần 3 `409` với `full:true`.
- `curl -s localhost:3000/api/player/games/$GID/teams/<teamId>` -- expected: `200` + đúng tên; teamId bậy → `404`.

**Manual checks:**
- Mở `player.html?game=<id>` trên trình duyệt: thấy tên đội; reload → vẫn đúng đội đó (không tăng số joined). Mở ẩn danh nhiều lần tới khi hết slot → thấy trang "hết slot".

## Suggested Review Order

**Claim slot (nhân)**

- Điểm vào: claim nguyên tử trong 1 db.update; phân biệt chưa-mở / đã-đầy; bọc try/catch trả JSON 500.
  [`player.js:30`](../../src/routes/player.js#L30)

- Logic chọn slot trống (thuần, có test).
  [`join.js:11`](../../src/join.js#L11)

- Rehydrate đội theo teamId (đúng game), 404 nếu không có.
  [`player.js:60`](../../src/routes/player.js#L60)

**Trang player**

- Luồng chính: rehydrate chỉ join lại khi 404, lỗi khác giữ teamId (không chiếm slot thứ 2).
  [`player.js:97`](../../public/js/player.js#L97)

- Join: lưu teamId, xử lý notReady / full / 404 / lỗi.
  [`player.js:75`](../../public/js/player.js#L75)

- Bọc localStorage an toàn (chế độ ẩn danh không làm treo trang).
  [`player.js:36`](../../public/js/player.js#L36)

**Kiểm thử**

- Khóa bất biến claim: chọn slot empty đầu, bỏ game khác/đội joined, null khi hết.
  [`join.test.js:26`](../../test/join.test.js#L26)
