export default ({ config }) => {
  console.log('📦 app.config.js loaded');
  console.log('🔧 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  
  return {
    ...config,
    extra: {
      ...config.extra,
      // Explicitly pass environment variables
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://fintrackai-eow9.onrender.com/api',
      eas: {
        projectId: "fd37f98c-0a29-4331-b14a-3dc97198ad33"
      }
    },
  };
};
