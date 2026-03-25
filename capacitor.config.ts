import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phimkhoi.app',
  appName: 'PhimKhoi',
  webDir: 'public',
  backgroundColor: '#0a0a0a',
  server: {
    url: 'https://khoiphim.org/?v=3',
    cleartext: true
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true
  },
  appendUserAgent: 'PhimKhoiApp/2.0'
};

export default config;
