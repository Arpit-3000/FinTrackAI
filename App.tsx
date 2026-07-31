import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <RootNavigator />
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}
