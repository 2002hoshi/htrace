---
title: 'Sinh slot đội + auto-generate tên đội'
type: 'feature'
created: '2026-07-09'
status: 'done'
baseline_commit: 'NO_VCS'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/brainstorming/brainstorm-chay-tram-app-2026-07-09/brainstorm-intent.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-admin-foundation-login-create-game.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Game đã tạo nhưng chưa có đội để chơi. Theo luật, đội KHÔNG tự đặt tên: hệ thống phải sinh sẵn đúng `teamCount` slot đội với tên tự động. Đây là tiền đề để player quét QR nhận slot ở story sau.

**Approach:** Thêm API admin sinh slot đội cho 1 game dựa trên `game.teamCount`. Tên đội = tên vui (ngân hàng con vật) + số thứ tự 2 chữ số đảm bảo duy nhất, ví dụ `Đội Hổ Mang (01)`. Sinh 1 lần/game: nếu game đã có đội thì trả 409 (bảo vệ tiến trình/điểm). Trang admin: mỗi game hiện nút "Sinh slot đội" (khi chưa có) hoặc danh sách tên đội (khi đã sinh). Tiếp nối auth token + DB JSON sẵn có, không thêm dependency.

## Boundaries & Constraints

**Always:**
- Số đội sinh ra = đúng `game.teamCount`. Tên đội duy nhất trong 1 game (nhờ số thứ tự).
- Mỗi slot đội theo schema `teams`: `{id, gameId, name, currentStationId:null, visitedStationIds:[], status:'empty'}`. `status:'empty'` = slot chưa có ai quét QR nhận.
- Mọi API mới đặt sau `requireAdmin` (bắt buộc token Bearer).
- Chỉ dùng `express` + `crypto` lõi. Text + comment tiếng Việt, đồng bộ style hiện tại.

**Ask First:**
- Thêm cơ chế reset/xóa đội (ngoài phạm vi lần này).
- Đổi ý nghĩa/giá trị `status` của đội.

**Never:**
- KHÔNG cho đội tự đặt tên.
- KHÔNG cho player nhận/claim slot (story sau).
- KHÔNG sinh đè khi game đã có đội.
- KHÔNG tạo trạm, câu hỏi, chấm điểm.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sinh slot lần đầu | `POST /api/admin/games/:gameId/teams` + token, game tồn tại, chưa có đội | `201 {teams:[...]}` đúng `teamCount` phần tử, tên duy nhất | N/A |
| Sinh lại khi đã có đội | game đã có ≥1 đội | `409 {error}`, không tạo thêm | Giữ nguyên đội cũ |
| Game không tồn tại | `:gameId` không khớp game nào | `404 {error}` | N/A |
| Thiếu token | không/sai Bearer | `401 {error}` | N/A |
| Liệt kê đội | `GET /api/admin/games/:gameId/teams` + token | `200 {teams:[...]}` (mảng rỗng nếu chưa sinh) | N/A |
| teamCount vượt số tên bank | teamCount > số tên vui | Vẫn sinh đủ, tên lặp con vật nhưng số thứ tự khác nhau → vẫn duy nhất | N/A |

</frozen-after-approval>

## Code Map

- `src/db.js` -- schema `teams` đã có; dùng `read`/`update`. Không sửa.
- `src/teams.js` -- **MỚI**: `NAME_BANK` (tên vui) + `buildTeamSlots(gameId, count)` trả mảng slot đội.
- `src/routes/admin.js` -- thêm `POST /games/:gameId/teams` (sinh) và `GET /games/:gameId/teams` (liệt kê), đặt sau `requireAdmin`.
- `public/js/admin.js` -- render khu đội trong mỗi game: nút sinh (khi trống) hoặc danh sách tên; xử lý 409/404/401.
- `public/css/style.css` -- style khu đội + nút + chip tên đội.
- `test/teams.test.js` -- **MỚI**: unit test `buildTeamSlots` (đúng số lượng, tên duy nhất, đủ trường schema) chạy bằng `node --test`.
- `README.md` -- bổ sung 2 endpoint mới.

## Tasks & Acceptance

**Execution:**
- [x] `src/teams.js` -- Tạo module: `NAME_BANK` (~16 tên vui tiếng Việt) + `buildTeamSlots(gameId, count)` sinh `count` slot, tên `Đội <bank[i % bank.length]> (NN)` với `NN` = số thứ tự pad 2 chữ số, mỗi slot `{id:randomUUID, gameId, name, currentStationId:null, visitedStationIds:[], status:'empty'}`. -- logic sinh tách riêng để test.
- [x] `src/routes/admin.js` -- Thêm `POST /games/:gameId/teams`: 404 nếu game không tồn tại, 409 nếu đã có đội, ngược lại dùng `buildTeamSlots` push vào `data.teams` và trả `201 {teams}`. Thêm `GET /games/:gameId/teams` trả `{teams}` lọc theo `gameId`. -- API quản trị đội.
- [x] `public/js/admin.js` -- Sau khi render game, gọi `GET .../teams` cho từng game: có đội → hiện danh sách tên (chip); chưa có → nút "Sinh slot đội (N)". Click nút → `POST` rồi tải lại khu đội. Xử lý 401→logout, 409/404→hiện lỗi. -- UI dùng được qua trình duyệt.
- [x] `public/css/style.css` -- Style `.teams-area`, `.team-chip`, nút sinh (dùng biến màu sẵn có). -- gọn gàng.
- [x] `test/teams.test.js` -- Test: sinh N=đúng số lượng; mọi `name` duy nhất; mỗi slot có đủ trường + `status:'empty'`; N lớn hơn bank vẫn duy nhất. -- khóa các bất biến của I/O matrix.
- [x] `README.md` -- Thêm `POST/GET /api/admin/games/:gameId/teams` vào bảng API. -- tài liệu khớp thực tế.

**Acceptance Criteria:**
- Given game có `teamCount=15` chưa có đội, when `POST /games/:id/teams`, then tạo đúng 15 đội, tên đôi một khác nhau, mỗi đội `status='empty'` và `currentStationId=null`.
- Given game đã sinh đội, when gọi `POST` lần nữa, then nhận `409` và số đội không đổi.
- Given `:gameId` không tồn tại, when `POST`/`GET`, then nhận `404`.
- Given mở `/admin.html` đã đăng nhập, when 1 game chưa có đội, then thấy nút "Sinh slot đội (N)"; sau khi bấm thấy danh sách N tên đội và nút biến mất.

## Verification

**Commands:**
- `node --test test/teams.test.js` -- expected: tất cả test PASS.
- `npm start`; đăng nhập lấy `$TOKEN`; tạo game lấy `$GID`; `curl -s -X POST localhost:3000/api/admin/games/$GID/teams -H "Authorization: Bearer $TOKEN"` -- expected: `201`, mảng `teams` đúng `teamCount`.
- Lặp lại `POST` -- expected: `409`.
- `curl -s -X POST localhost:3000/api/admin/games/khong-co/teams -H "Authorization: Bearer $TOKEN"` -- expected: `404`.

**Manual checks:**
- Mở `http://localhost:3000/admin.html`: tạo game 5 đội → bấm "Sinh slot đội (5)" → thấy 5 chip tên `Đội ... (01..05)`; reload trang vẫn thấy danh sách, không còn nút sinh.

## Suggested Review Order

**Logic sinh đội (nhân)**

- Điểm vào: sinh mảng slot, push từng phần tử (không spread) để không vỡ ngăn xếp khi số đội lớn.
  [`teams.js:45`](../../src/teams.js#L45)

- Định dạng tên: tên vui + số thứ tự (pad tối thiểu 2 chữ số) đảm bảo duy nhất.
  [`teams.js:34`](../../src/teams.js#L34)

**API quản trị đội**

- Sinh slot: guard 404 (game) → 400 (teamCount hỏng) → 409 (đã sinh) → 201.
  [`admin.js:136`](../../src/routes/admin.js#L136)

- Liệt kê đội theo gameId, 404 nếu game không tồn tại.
  [`admin.js:127`](../../src/routes/admin.js#L127)

**Frontend**

- Vẽ khu đội: nút sinh khi trống / chip tên khi đã có; 409 thì đồng bộ lại từ GET.
  [`admin.js:117`](../../public/js/admin.js#L117)

- Nạp đội cho mỗi game sau khi render danh sách game (N+1, chấp nhận cho demo).
  [`admin.js:101`](../../public/js/admin.js#L101)

**Kiểm thử**

- Khóa bất biến: đúng số lượng, tên duy nhất kể cả khi vượt ngân hàng tên, đủ trường schema.
  [`teams.test.js:20`](../../test/teams.test.js#L20)
