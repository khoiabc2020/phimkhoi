import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phimkhoi.app',
  appName: 'PhimKhoi',
  webDir: 'public',
  server: {
    // Thay đổi URL này thành địa chỉ VPS của bạn (ví dụ: http://123.45.67.89:3000 hoặc https://phimkhoi.com)
    url: 'http://YOUR_VPS_IP_HERE',
    cleartext: true
  }
};

export default config;
