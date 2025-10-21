import React, { useEffect, useState } from 'react';
import { PaperProvider, Surface, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/services/i18n';
import { mintLightTheme } from './src/theme/mintTheme';
import { Colors } from './src/constants/colors';
import { AuthFlow } from './src/navigation/AuthFlow';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'OpenSans-Regular': require('./assets/fonts/OpenSans-Regular.ttf'),
          'OpenSans-Bold': require('./assets/fonts/OpenSans-Bold.ttf'),
          'OpenSans-SemiBold': require('./assets/fonts/OpenSans-SemiBold.ttf'),
          'OpenSans-Light': require('./assets/fonts/OpenSans-Light.ttf'),
          ...MaterialCommunityIcons.font,
          ...MaterialIcons.font,
          ...Ionicons.font,
        });
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    loadFonts();
  }, []);

  // Handle deep linking for password reset
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { hostname, path } = Linking.parse(event.url);

      if (hostname === 'reset-password' || path === 'reset-password') {
        // Deep link will be handled by AuthFlow navigation
        // The URL contains the access token from Supabase
      }
    };

    // Handle initial URL when app is opened from deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep link events while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <PaperProvider theme={mintLightTheme}>
        <Surface 
          style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: Colors.background.default 
          }}
        >
          <ActivityIndicator 
            animating={true} 
            color={Colors.primary.main}
            size="large"
            style={{ marginBottom: 16 }}
          />
          <Text 
            variant="bodyLarge" 
            style={{ 
              color: Colors.text.secondary,
              fontFamily: 'OpenSans-Regular'
            }}
          >
            로딩 중...
          </Text>
        </Surface>
      </PaperProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={mintLightTheme}>
          <AuthFlow />
        </PaperProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}