# Intent Doc — CHẠY TRẠM APP (bản demo vibe-coding)

> **Insight chủ đạo:** App là **bộ điều phối + sổ điểm**, KHÔNG phải trọng tài. Điểm số sinh ra ngoài đời thực do admin chấm; app chỉ điều phối luồng trạm và ghi/tổng hợp điểm.

## 1. Bối cảnh & mục tiêu
Đây là bản demo app "CHẠY TRẠM" dùng để tập vibe-coding. Yêu cầu duy nhất: chạy **ổn định các chức năng cơ bản** của luồng chơi. Ba ràng buộc thực địa lái toàn bộ thiết kế: 1 điện thoại/đội, admin trực trạm để active & chấm, thử thách mang tính thể chất/thực địa.

## 2. Các vai
Chỉ có **2 vai** (không tách vai riêng cho người trực trạm):
- **Admin** — hệ thống có **nhiều tài khoản admin**. Admin kiêm luôn người trực trạm: active/start cho đội trả lời, nhận kết quả và chấm điểm.
- **Player** — **1 thiết bị đại diện cho mỗi đội**. Nhiều thành viên trong đội nhưng chỉ 1 người đại diện quét QR để trở thành 1 đội trong game.

## 3. Luồng lõi của Player
1. Quét **QR** (trang hiển thị QR để đội truy cập link game).
2. Nhận **slot đội** đã sinh sẵn; **tên đội do hệ thống auto-generate** (đội không tự đặt).
3. Giải **câu đố bí ẩn mở màn** (trắc nghiệm từ ngân hàng): sai → đổi câu khác; đúng → **nhận trạm đầu tiên**. Đây là cổng vào **chỉ 1 lần đầu**.
4. Tới trạm → làm **thử thách của trạm** → **admin chấm điểm** (dù hoàn thành hay không).
5. **Tự động chuyển sang trạm kế tiếp** (không bị gate bởi câu hỏi mới).
6. Lặp lại bước 4-5 cho tới khi **hết trạm để chơi**.
7. Vào **màn chờ** các đội khác → **xem kết quả** khi game kết thúc.

## 4. Cơ chế điều phối trạm (capacity) — luật chơi cốt lõi
- **Cap = số ghế/slot cố định của mỗi trạm**, đếm dồn và **không nhả**: đã hoặc đang chơi đều tính vào cap.
- Trạm đầy (số ghế đã dùng = cap) → **đóng vĩnh viễn**, không mở lại.
- Phân trạm cho đội: **random, ưu tiên trạm chưa đầy & đội chưa chơi**.
- **Mỗi đội chơi mỗi trạm tối đa 1 lần.** Gặp trạm đóng thì random sang trạm khác còn ghế & chưa chơi.
- Đội được phân trạm **ngay sau khi giải đúng câu đố mở màn**.
- **Không nhường chỗ:** phải trả lời/hoàn tất xong mới rời trạm; chưa có cơ chế bỏ qua trạm (để sau).
- **Nguyên tắc chọn cap:** đặt cap sao cho tổng ghế ÷ số đội ra số trạm trung bình đủ lớn, giữ chênh lệch giữa các đội không quá cao.
  - Ví dụ: 5 trạm / 15 đội, cap=5 → 25 ghế ÷ 15 ≈ 1.7 trạm/đội (thấp).
  - Cap=9 → 45 ghế ÷ 15 = **TB 3 trạm/đội** — cân bằng hơn mà vẫn giữ tính đua.
- **"Đua giành ghế" là luật chơi có chủ đích** — chính là thứ làm app khác với quiz thông thường.

## 5. Hai loại thử thách / câu hỏi
| | Câu đố bí ẩn mở màn | Thử thách tại trạm |
|---|---|---|
| Nguồn | Ngân hàng câu hỏi (trắc nghiệm) | Ngân hàng câu hỏi **HOẶC** admin tự tạo (đa dạng: thể chất, ném bóng, trò chơi...) |
| Chấm | **Hệ thống tự chấm** (đúng/sai) | **Admin chấm linh hoạt** |
| Số lần | Chỉ **1 lần đầu** (cổng vào) | Mỗi trạm 1 lần |
| Điểm | Đúng/sai (không tính điểm thi đấu) | **Số tự do** (vd 0-100) |

## 6. Trạm private
Trạm **ẩn** để admin **cộng điểm thưởng cho đội tùy ý**. Đội **không hề biết** có trạm này. Nằm **ngoài** luồng phân trạm random.

## 7. Chấm điểm & kết quả
- Thang điểm = **SỐ TỰ DO** (vd 0-100), không dùng thang cố định.
- Đội hết giờ chưa có kết quả → admin **toàn quyền quyết** (0 điểm hoặc tùy).
- **Admin nhập điểm THEO TRẠM:** chọn 1 trạm → hiện list đội (đang/đã ở trạm) → gõ điểm từng đội.
- **Trang kết quả:** điểm từng trạm + tổng điểm + xếp hạng.
- **Công bố kết quả có bước xác nhận** trước khi hiển thị.

## 8. Phạm vi (MoSCoW)
**Must**
- Trang hiển thị QR để đội quét vào game.
- Admin khai số đội → hệ thống sinh sẵn slot đội, auto-generate tên đội.
- Player quét QR → nhận slot đội.
- Câu đố bí ẩn mở màn (trắc nghiệm ngân hàng, tự chấm, sai→đổi câu, đúng→nhận trạm đầu).
- Cơ chế capacity: cap cố định/trạm, đếm dồn, đầy→đóng vĩnh viễn, random ưu tiên trạm chưa đầy & đội chưa chơi, mỗi đội/trạm tối đa 1 lần.
- Tự động chuyển trạm kế sau mỗi trạm.
- Admin chấm điểm theo trạm (điểm số tự do).
- Màn chờ khi đội hết trạm.
- Trang kết quả: điểm từng trạm + tổng + xếp hạng, có bước xác nhận công bố.

**Should**
- Trạm private (cộng điểm thưởng ẩn).
- Admin tự tạo thử thách riêng cho trạm (ngoài ngân hàng câu hỏi).

**Could**
- (chưa có mục nào được chốt trong memlog)

**Won't (lần này)**
- Dashboard theo dõi realtime.
- Nút tạm dừng / kết thúc game thủ công.
- Cơ chế nhường chỗ / bỏ qua trạm.
- Tách vai riêng cho người trực trạm (gộp vào Admin).
- Đội tự đặt tên.

## 9. Các điểm còn treo
- **Đội thấy gì khi trạm đóng cửa** — tính sau.
- **Cơ chế bỏ qua / nhường chỗ trạm** — để sau.
- **Chống gian lận thực địa** — để sau.
- **Chi tiết vai người trực trạm** — đã gộp vào Admin, chi tiết chưa chốt.
