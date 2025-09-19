import React, { useEffect, useState } from 'react';
import { PaperProvider, Surface, Text, ActivityIndicator } from 'react-native-paper';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
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
    <PaperProvider theme={mintLightTheme}>
      <AuthFlow />
    </PaperProvider>
  );
}