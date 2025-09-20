import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { AuthService } from '../services/AuthService';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { MainNavigator } from './MainNavigator';
import { User, Session } from '@supabase/supabase-js';

const Stack = createStackNavigator();

export const AuthFlow: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const authService = new AuthService();

  useEffect(() => {
    let mounted = true;

    const checkAuthState = async () => {
      try {
        setLoading(true);

        // Check if user is currently authenticated
        const authenticated = await authService.isAuthenticated();
        
        if (mounted) {
          setIsAuthenticated(authenticated);
        }
      } catch (error) {
        console.error('Auth state check error:', error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen to auth state changes
    const { unsubscribe } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setIsAuthenticated(true);
          setLoading(false);
          break;
        case 'SIGNED_OUT':
          setIsAuthenticated(false);
          setLoading(false);
          break;
        default:
          // For other events, check authentication status
          try {
            const authenticated = await authService.isAuthenticated();
            setIsAuthenticated(authenticated);
            setLoading(false);
          } catch (error) {
            console.error('Auth state check error:', error);
            setIsAuthenticated(false);
            setLoading(false);
          }
          break;
      }
    });

    // Initial auth state check
    checkAuthState();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Loading screen
  if (loading) {
    return (
      <Surface 
        style={{ 
          flex: 1, 
          backgroundColor: Colors.background.default,
          justifyContent: 'center',
          alignItems: 'center'
        }}
        testID="auth-loading"
      >
        <View style={{ alignItems: 'center' }}>
          <Text 
            variant="headlineLarge"
            style={{
              color: Colors.text.primary,
              fontFamily: 'OpenSans-Bold',
              marginBottom: 24
            }}
          >
            냉파고
          </Text>
          
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
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center'
            }}
          >
            잠시만 기다려주세요...
          </Text>
        </View>
      </Surface>
    );
  }

  // Authentication stack for login/signup
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.background.default }
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Main app navigation for authenticated users
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
};