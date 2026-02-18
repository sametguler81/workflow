import * as React from 'react';
import { StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { Navigation } from './navigation';
import { OfflineBanner } from './components/OfflineBanner';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Navigation />
      <OfflineBanner />
    </View>
  );
}

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <OfflineProvider>
            <AppContent />
          </OfflineProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
