# Load test (k6) – đo chịu tải có kiểm soát

Mục tiêu: **stress/load test hợp pháp** để đo RPS/latency/error rate và tìm bottleneck.  
Không dùng để gây gián đoạn dịch vụ. Chỉ chạy khi bạn **có quyền** và nên ưu tiên **staging** hoặc giờ thấp điểm.

## Cách 1: Chạy k6 + Grafana/InfluxDB bằng Docker (khuyên dùng)

### 1) Start dashboard

```bash
cd loadtest
docker compose up -d influxdb grafana
```

- Grafana: mở `http://localhost:3001` (user/pass mặc định: `admin` / `admin`)
- InfluxDB: chạy nội bộ `http://localhost:8086` (db `k6`)

### 2) Chạy smoke test (nhẹ)

```bash
cd loadtest
docker compose run --rm k6 run /scripts/smoke.js
```

### 3) Chạy ramp test (tăng tải từ từ)

```bash
cd loadtest
docker compose run --rm -e BASE_URL="https://www.khoiphim.io.vn" k6 run /scripts/ramp.js
```

Có thể override đường dẫn GET bằng biến `PATHS` (CSV):

```bash
docker compose run --rm ^
  -e BASE_URL="https://www.khoiphim.io.vn" ^
  -e PATHS="/,/tim-kiem,/api/mobile/home" ^
  k6 run /scripts/ramp.js
```

## Cách 2: Chạy k6 native (không cần Docker)

Nếu bạn đã cài k6 trên máy:

```bash
set BASE_URL=https://www.khoiphim.io.vn
k6 run loadtest/k6/ramp.js
```

## Dashboard (Grafana)

Compose có sẵn datasource InfluxDB, bạn chỉ cần import dashboard k6 (tuỳ chọn):
- Tìm trong Grafana: **Dashboards → New → Import** và import “k6 InfluxDB” template.

## Lưu ý an toàn

- Nếu Cloudflare/WAF trả 403/429, đó là “bảo vệ” bình thường; hãy test **origin/staging** hoặc whitelist IP test theo nhu cầu.
- Luôn bắt đầu từ **smoke** rồi tăng dần, theo dõi CPU/RAM/PM2 logs/Mongo connections.

