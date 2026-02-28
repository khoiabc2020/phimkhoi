# Setup domain (khoiphim.io.vn / phimkhoi.io.vn)

## 1. DNS (làm tại nhà cung cấp tên miền)

Với **mỗi** tên miền bạn dùng (khoiphim.io.vn hoặc phimkhoi.io.vn), thêm 2 bản ghi **A** cho đúng tên miền đó:

| Loại | Tên (Host) | Giá trị (IP) |
|------|------------|--------------|
| A    | `@`        | `18.141.25.244` |
| A    | `www`      | `18.141.25.244` |

- **khoiphim.io.vn** đã cấu hình → chỉ cần truy cập http://khoiphim.io.vn  
- **phimkhoi.io.vn** bị NXDOMAIN → vào zonedns.vn, chọn hoặc thêm domain **phimkhoi.io.vn**, tạo 2 record A như trên (Host `@` và `www` → `18.141.25.244`).

Chờ 5–30 phút cho DNS cập nhật.

## 2. Nginx trên VPS (chạy từ máy Windows)

```bat
scripts\windows\setup_domain_vps.bat
```

Script sẽ: upload file `scripts/vps/nginx-phimkhoi.conf` lên VPS, copy vào `/etc/nginx/sites-available/phimkhoi` và reload nginx.

Sau đó truy cập: **http://khoiphim.io.vn**, **http://www.khoiphim.io.vn**, **http://phimkhoi.io.vn**, **http://www.phimkhoi.io.vn** (miễn là DNS đã trỏ đúng).

## 3. Bật HTTPS (SSL – chạy trên VPS)

SSH vào VPS rồi chạy:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d khoiphim.io.vn -d www.khoiphim.io.vn -d phimkhoi.io.vn -d www.phimkhoi.io.vn
```

Làm theo hướng dẫn (email, đồng ý điều khoản). Certbot sẽ tự cấu hình SSL và redirect HTTP → HTTPS.

Gia hạn tự động đã được certbot cấu hình (cron).

---

## Xử lý lỗi "Không thể truy cập" / DNS_PROBE_FINISHED_NXDOMAIN

Lỗi này nghĩa là DNS chưa phân giải được tên miền. Thử lần lượt:

1. **Đợi lan truyền DNS (quan trọng)**  
   Sau khi đổi nameserver tại Nhan Hoa sang ZoneDNS, có thể mất **vài giờ đến 24–48 giờ** để toàn cầu cập nhật. Bản ghi A trên ZoneDNS thường có hiệu lực nhanh (vài phút), nhưng nếu máy chủ DNS chưa đổi thì vẫn NXDOMAIN.

2. **Kiểm tra trên ZoneDNS**  
   - Đăng nhập **zonedns.vn** → chọn domain **khoiphim.io.vn**.  
   - Trong bảng A record phải có: Host `@` và Host `www`, Value `18.141.25.244`.  
   - Nếu chưa có thì tạo 2 bản ghi A như bảng ở mục 1.

3. **Kiểm tra trên Nhan Hoa**  
   - Vào Nhan Hoa → Chỉnh sửa DNS **khoiphim.io.vn**.  
   - Đảm bảo 4 nameserver là **ns1.zonedns.vn**, **ns2.zonedns.vn**, **ns3.zonedns.vn**, **ns4.zonedns.vn** (và IP tương ứng).  
   - Bấm **Cập nhật Domain** nếu vừa sửa.

4. **Xóa cache DNS trên máy** (Windows CMD quyền Admin):  
   `ipconfig /flushdns`  
   Rồi thử lại **http://khoiphim.io.vn** hoặc dùng mạng 4G để thử (tránh cache nhà mạng).

5. **Kiểm tra phân giải** (sau khi đợi vài giờ):  
   Trên CMD: `nslookup khoiphim.io.vn`  
   Nếu thấy địa chỉ `18.141.25.244` là DNS đã ổn; sau đó mở lại trang trong trình duyệt.
