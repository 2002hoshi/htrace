# Deferred Work

Các vấn đề phát hiện trong review nhưng KHÔNG thuộc phạm vi story hiện tại. Xử lý tập trung ở story sau.

- source_spec: `spec-admin-foundation-login-create-game.md`
  summary: `db.update` đọc-sửa-ghi cả file không khóa → hai request ghi gần như đồng thời có thể clobber nhau (mất dữ liệu).
  evidence: Pre-existing trong `src/db.js:51-56`, không do story này tạo ra. Rủi ro thấp với 1 admin nhưng là lỗi toàn vẹn dữ liệu thật; cần khóa ghi hoặc chuyển SQLite khi tải cao hơn.

- source_spec: `spec-admin-foundation-login-create-game.md`
  summary: Route `/api/*` không khớp trả về HTML `index.html` với status 404 thay vì JSON.
  evidence: Pre-existing catch-all `server.js:41-43`. Client gọi API mong JSON sẽ vỡ khi gõ sai path. Nên thêm error/JSON handler riêng cho `/api`.

- source_spec: `spec-admin-foundation-login-create-game.md`
  summary: `bannerUrl` được lưu không kiểm tra định dạng/scheme (có thể chứa `javascript:`...).
  evidence: `src/routes/admin.js` chỉ trim và lưu. Hiện chưa render nên vô hại, nhưng sẽ thành vector injection/redirect khi story sau hiển thị banner. Cần validate scheme (http/https) khi thêm phần render.
