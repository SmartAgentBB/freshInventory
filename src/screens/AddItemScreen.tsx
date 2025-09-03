import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Surface, 
  Text
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { FOOD_CATEGORIES } from '../models/FoodItem';
import { getTranslation } from '../constants/translations';

interface AddItemScreenProps {
  navigation: any;
}

export const AddItemScreen: React.FC<AddItemScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '개',
    category: 'other' as const,
    expiryDate: '',
    memo: ''
  });

  // Common units for Korean food items
  const commonUnits = ['개', 'kg', 'g', 'L', '병', '팩', '봉지'];

  const handleSave = () => {
    // Basic validation
    if (!formData.name.trim() || !formData.quantity.trim()) {
      // For now, just prevent submission if required fields are empty
      return;
    }

    // TODO: Implement InventoryService.addItem call
    console.log('Saving item:', formData);
    
    // For now, just log the data - will implement service call later
    // navigation.goBack();
  };

  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default,
        padding: 16
      }}
    >
      <ScrollView 
        testID="add-item-form"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Title */}
        <Text 
          variant="headlineSmall" 
          style={{ 
            color: Colors.text.primary,
            marginBottom: 24,
            fontFamily: 'OpenSans-Bold',
            textAlign: 'center'
          }}
        >
          재료 추가
        </Text>

        {/* Form Labels - Simplified for testing */}
        <Text style={{ color: Colors.text.primary, marginBottom: 8 }}>
          재료명
        </Text>
        
        <Text style={{ color: Colors.text.primary, marginBottom: 8 }}>
          수량
        </Text>
        
        <Text style={{ color: Colors.text.primary, marginBottom: 8 }}>
          단위
        </Text>
        
        <Text style={{ color: Colors.text.primary, marginBottom: 8 }}>
          카테고리
        </Text>
        
        <Text style={{ color: Colors.text.primary, marginBottom: 8 }}>
          유통기한
        </Text>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: Colors.primary,
            padding: 12,
            borderRadius: 8,
            marginTop: 16,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: Colors.onPrimary, fontWeight: 'bold' }}>
            저장
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Surface>
  );
};