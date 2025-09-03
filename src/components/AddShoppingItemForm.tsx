import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ShoppingItem } from '../models/ShoppingItem';
import { Colors } from '../constants/colors';

interface AddShoppingItemFormProps {
  onAdd?: (item: { name: string; memo: string }) => void;
  existingItems?: ShoppingItem[];
}

export const AddShoppingItemForm: React.FC<AddShoppingItemFormProps> = ({ 
  onAdd,
  existingItems = []
}) => {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if item already exists in todo list
  const isDuplicate = (itemName: string): boolean => {
    const trimmedName = itemName.trim().toLowerCase();
    return existingItems.some(item => 
      item.name.toLowerCase() === trimmedName && item.todo === true
    );
  };

  // Validate form
  const validateForm = (): boolean => {
    setError('');
    
    // Check if name is empty
    if (!name.trim()) {
      setError('항목 이름을 입력해주세요');
      return false;
    }
    
    // Check for duplicates (only in todo items)
    if (isDuplicate(name)) {
      setError('이미 목록에 있는 항목입니다');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const itemData = {
        name: name.trim(),
        memo: memo.trim()
      };
      
      // Call onAdd callback if provided
      if (onAdd) {
        await onAdd(itemData);
      }
      
      // Clear form on success
      setName('');
      setMemo('');
      setError('');
    } catch (err) {
      setError('항목 추가 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      style={{ 
        margin: 16,
        backgroundColor: Colors.background.surface
      }}
    >
      <Card.Content style={{ padding: 20 }}>
        {/* Form Title */}
        <Text 
          variant="titleLarge" 
          style={{ 
            color: Colors.text.primary,
            fontFamily: 'OpenSans-Bold',
            marginBottom: 16,
            textAlign: 'center'
          }}
        >
          새 쇼핑 항목 추가
        </Text>

        {/* Item Name Input */}
        <View style={{ marginBottom: 12 }}>
          <Text 
            variant="bodySmall" 
            style={{ 
              color: Colors.text.secondary, 
              marginBottom: 4,
              fontFamily: 'OpenSans-Regular'
            }}
          >
            쇼핑 항목 이름
          </Text>
          <RNTextInput
            placeholder="쇼핑 항목 이름"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(''); // Clear error when user types
            }}
            style={{
              borderWidth: 1,
              borderColor: error && error !== '이미 목록에 있는 항목입니다' ? Colors.error : Colors.outline,
              borderRadius: 8,
              padding: 12,
              backgroundColor: Colors.background.surface,
              color: Colors.text.primary,
              fontFamily: 'OpenSans-Regular'
            }}
          />
        </View>

        {/* Memo Input */}
        <View style={{ marginBottom: 16 }}>
          <Text 
            variant="bodySmall" 
            style={{ 
              color: Colors.text.secondary, 
              marginBottom: 4,
              fontFamily: 'OpenSans-Regular'
            }}
          >
            메모 (선택사항)
          </Text>
          <RNTextInput
            placeholder="메모 (선택사항)"
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: Colors.outline,
              borderRadius: 8,
              padding: 12,
              backgroundColor: Colors.background.surface,
              color: Colors.text.primary,
              fontFamily: 'OpenSans-Regular',
              textAlignVertical: 'top',
              minHeight: 80
            }}
          />
        </View>

        {/* Error Message */}
        {error && (
          <Text 
            variant="bodySmall"
            style={{ 
              color: Colors.error,
              fontFamily: 'OpenSans-Regular',
              marginBottom: 12,
              textAlign: 'center'
            }}
          >
            {error}
          </Text>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? Colors.outline : Colors.primary.main,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1
          }}
        >
          <Text
            variant="bodyLarge"
            style={{
              color: Colors.onPrimary,
              fontFamily: 'OpenSans-SemiBold'
            }}
          >
            {loading ? '추가 중...' : '추가하기'}
          </Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
};