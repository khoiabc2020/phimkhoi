import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phimkhoi.app',
  appName: 'PhimKhoi',
  webDir: 'public',
  server: {
    // Thay đổi URL này thành địa chỉ VPS của bạn
    url: 'http://18.141.25.244:3000',
    cleartext: true
  }
};

export default config;
