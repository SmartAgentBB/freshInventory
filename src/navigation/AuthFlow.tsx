import React from 'react';
import { View } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator();

export const AuthFlow: React.FC = () => {
  const { user, loading } = useAuth();

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
            냉프로
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
  if (!user) {
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