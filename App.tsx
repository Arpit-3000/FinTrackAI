import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('SplashScreen.preventAutoHideAsync error:', error);
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    'InterTight': require('./src/assets/fonts/InterTight-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (fontsLoaded || fontError) {
          setAppIsReady(true);
          // Hide splash screen
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        setAppIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  if (!appIsReady) {
    return null;
  }

  // Show error if fonts failed to load
  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <RootNavigator />
          <StatusBar style="auto" />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
