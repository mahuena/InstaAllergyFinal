import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.instaAllergy',
  appName: 'instaAllergy',
  webDir: 'out',
  server: {
    url: 'https://insta-allergy-final.vercel.app/',
    cleartext: true
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
  },
};

export default config;
