import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.templo.calendario',
  appName: 'Calendario Ritual del Templo',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#fdfbf7'
  }
};

export default config;
