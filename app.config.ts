import type { ExpoConfig, ConfigContext } from 'expo/config';

const APP_ENV = process.env.APP_ENV ?? 'development';
const isProduction = APP_ENV === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Strada',
  slug: 'strada',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'strada',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#080b10',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'es.strada.app',
    buildNumber: '1',
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Strada usa tu ubicación para mostrar clubes cercanos, rutas y quedadas en tu zona.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Strada puede usar tu ubicación durante rutas en grupo para mejorar la experiencia de navegación.',
      NSPhotoLibraryUsageDescription:
        'Strada necesita acceso a tus fotos para subir imágenes de tu vehículo.',
      NSCameraUsageDescription:
        'Strada puede usar la cámara para fotografiar tu vehículo.',
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    package: 'es.strada.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#080b10',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'CAMERA'],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Strada usa tu ubicación para clubes cercanos, rutas y quedadas.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Strada necesita acceso a tus fotos para subir imágenes de tu vehículo.',
        cameraPermission: 'Strada puede usar la cámara para fotografiar tu vehículo.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
      (isProduction
        ? 'https://eduuu26.github.io/strada/privacy-policy.html'
        : 'https://strada-app.github.io/docs/privacy-policy.html'),
    termsUrl:
      process.env.EXPO_PUBLIC_TERMS_URL ??
      (isProduction
        ? 'https://eduuu26.github.io/strada/terms-of-service.html'
        : 'https://strada-app.github.io/docs/terms-of-service.html'),
    legalNoticeUrl:
      process.env.EXPO_PUBLIC_LEGAL_NOTICE_URL ??
      (isProduction
        ? 'https://eduuu26.github.io/strada/aviso-legal.html'
        : 'https://strada-app.github.io/docs/aviso-legal.html'),
    cookiePolicyUrl:
      process.env.EXPO_PUBLIC_COOKIE_POLICY_URL ??
      (isProduction
        ? 'https://eduuu26.github.io/strada/cookie-policy.html'
        : 'https://strada-app.github.io/docs/cookie-policy.html'),
    subscriptionTermsUrl:
      process.env.EXPO_PUBLIC_SUBSCRIPTION_TERMS_URL ??
      (isProduction
        ? 'https://eduuu26.github.io/strada/subscription-terms.html'
        : 'https://strada-app.github.io/docs/subscription-terms.html'),
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ??
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        '17334f92-12cc-40e5-b668-9b06f2d0d0b3',
    },
    stradaEmailApi:
      process.env.EXPO_PUBLIC_STRADA_EMAIL_API ??
      (isProduction ? undefined : 'http://127.0.0.1:8788'),
    stradaApiUrl:
      process.env.EXPO_PUBLIC_STRADA_API_URL ??
      process.env.EXPO_PUBLIC_STRADA_EMAIL_API ??
      (isProduction ? undefined : 'http://127.0.0.1:8788'),
    backendProvider: process.env.EXPO_PUBLIC_BACKEND_PROVIDER ?? 'local',
  },
  owner: 'eduuu.26',
});
