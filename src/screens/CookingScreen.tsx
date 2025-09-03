import React from 'react';
import { View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { getTranslation } from '../constants/translations';

export const CookingScreen = () => {
  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default,
        padding: 16
      }}
      testID="cooking-screen"
    >
      <Text 
        variant="headlineSmall" 
        style={{ 
          color: Colors.text.primary,
          marginBottom: 16,
          fontFamily: 'OpenSans-Bold'
        }}
      >
        요리 추천
      </Text>
      
      <Text 
        variant="bodyMedium"
        style={{ 
          color: Colors.text.secondary,
          fontFamily: 'OpenSans-Regular'
        }}
      >
        추천 요리가 없습니다
      </Text>
    </Surface>
  );
};