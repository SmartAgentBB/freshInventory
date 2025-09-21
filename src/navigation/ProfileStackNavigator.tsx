import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Colors } from '../constants/colors';

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  const { t } = useTranslation('profile');

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
          title: t('title'),
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};