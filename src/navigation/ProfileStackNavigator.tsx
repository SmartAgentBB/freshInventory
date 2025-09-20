import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background.paper,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border.light,
        },
        headerTitleStyle: {
          fontFamily: 'OpenSans-Bold',
          fontSize: 18,
          color: Colors.text.primary,
        },
        headerTintColor: Colors.primary,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: '마이 페이지',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};