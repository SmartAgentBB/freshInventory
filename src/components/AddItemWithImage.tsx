import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  List,
  IconButton,
  TextInput,
  Divider,
} from 'react-native-paper';
import { ImageUpload } from './ImageUpload';
import { AIService, FoodItem } from '../services/AIService';
import { uploadImageToSupabase } from '../services/StorageService';
import { InventoryService } from '../services/InventoryService';
import { compressImage, cropImageToBoundingBox } from '../utils/imageUtils';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { supabaseClient } from '../services/supabaseClient';

interface AddItemWithImageProps {
  onComplete: () => void;
  userId: string;
  hideImageSelection?: boolean;
  initialImageUri?: string;
}

interface EditableItem extends FoodItem {
  isEditing?: boolean;
  originalName?: string;
}

// Map Korean categories to English
const categoryMap: { [key: string]: string } = {
  '과일': 'fruits',
  '채소': 'vegetables',
  '육류': 'meat',
  '유제품': 'dairy',
  '곡물': 'grains',
  '음료': 'beverages',
  '조미료': 'condiments',
  '냉동': 'frozen',
  '기타': 'other',
};

const mapKoreanCategory = (koreanCategory: string): string => {
  return categoryMap[koreanCategory] || 'other';
};

export const AddItemWithImage: React.FC<AddItemWithImageProps> = ({
  onComplete,
  userId,
  hideImageSelection = false,
  initialImageUri = '',
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string>(initialImageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<EditableItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  
  const aiService = new AIService();
  const inventoryService = new InventoryService(supabaseClient);

  const analyzeImage = async (imageUri: string) => {
    setSelectedImageUri(imageUri);
    
    // Start AI analysis
    setIsAnalyzing(true);
    setDetectedItems([]);
    
    try {
      // Compress image with higher quality for better detail
      const compressed = await compressImage(imageUri, {
        quality: 0.85,  // 높은 품질 유지
        maxWidth: 1920,  // 더 큰 원본 이미지 유지
        format: 'jpeg'
      });
      
      console.log('=== Image Analysis Start ===');
      console.log('Compressed image dimensions:', compressed.width, 'x', compressed.height);
      console.log('Compressed image URI:', compressed.uri);
      
      // Upload to Supabase
      const uploadResult = await uploadImageToSupabase(compressed.uri, userId);
      console.log('Upload result:', uploadResult);
      
      // Store the public URL for display
      if (uploadResult.success && uploadResult.publicUrl) {
        setSelectedImageUri(uploadResult.publicUrl);
      }
      
      // Analyze with AI - AI will receive the same image that we'll crop later
      const analysisResult = await aiService.analyzeImage(compressed.uri);
      
      if (analysisResult.success && analysisResult.items.length > 0) {
        // Generate thumbnails for each detected item
        const itemsWithThumbnails = await Promise.all(
          analysisResult.items.map(async (item) => {
            let thumbnail = null;
            if (item.boundingBox) {
              console.log('=== Processing item:', item.name, '===');
              console.log('BoundingBox data [ymin, xmin, ymax, xmax]:', JSON.stringify(item.boundingBox));
              console.log('Image URI:', compressed.uri);
              
              // Validate boundingBox format - should be array with 4 values
              if (Array.isArray(item.boundingBox) && item.boundingBox.length === 4) {
                // Generate higher quality thumbnail for both list and detail view
                thumbnail = await cropImageToBoundingBox(
                  compressed.uri,
                  item.boundingBox,
                  512, // 512x512 for better quality in detail view
                  { width: compressed.width, height: compressed.height } // Pass dimensions
                );
                console.log('Generated thumbnail URI:', thumbnail);
              } else {
                console.warn('Invalid boundingBox format (expected [ymin, xmin, ymax, xmax]):', item.boundingBox);
                thumbnail = compressed.uri;
              }
            } else {
              console.log('No bounding box for item:', item.name);
              // boundingBox가 없으면 전체 이미지를 썸네일로 사용
              thumbnail = compressed.uri;
            }
            return {
              ...item,
              thumbnail: thumbnail || compressed.uri, // 썸네일 생성 실패 시 원본 이미지 사용
              isEditing: false,
            };
          })
        );
        
        setDetectedItems(itemsWithThumbnails);
      } else if (analysisResult.items.length === 0) {
        setShowManualInput(true);
      } else {
        Alert.alert(
          '분석 실패',
          'AI 서비스를 사용할 수 없습니다. 수동으로 입력해주세요.'
        );
        setShowManualInput(true);
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      Alert.alert(
        '오류',
        '이미지 분석 중 오류가 발생했습니다.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditItem = (index: number) => {
    const updatedItems = [...detectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      isEditing: true,
    };
    setDetectedItems(updatedItems);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...detectedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setDetectedItems(updatedItems);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const updatedItems = [...detectedItems];
    const currentQuantity = updatedItems[index].quantity || 1;
    const newQuantity = Math.max(1, currentQuantity + delta);
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity,
    };
    setDetectedItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setDetectedItems(detectedItems.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (detectedItems.length === 0) {
      Alert.alert('알림', '저장할 항목이 없습니다.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Skip thumbnail upload for now - just use local URIs
      // This avoids timeout issues with multiple uploads
      const itemsWithUploadedThumbnails = detectedItems;
      
      // Save each item to inventory with uploaded thumbnail URLs
      const promises = itemsWithUploadedThumbnails.map(item => 
        inventoryService.addItem({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || '개',
          category: mapKoreanCategory(item.category || '기타') as any,
          userId: userId,
          thumbnail: item.thumbnail, // Save uploaded thumbnail URL
          remains: 1, // Start with 100% remaining
          memo: '', // Optional memo field
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any items failed to save
      const failedCount = results.filter(r => r === null).length;
      if (failedCount > 0) {
        Alert.alert(
          '일부 저장 실패',
          `${detectedItems.length - failedCount}개 항목이 저장되었습니다. ${failedCount}개 항목 저장에 실패했습니다.`
        );
      }
      
      // Navigate back to inventory screen
      onComplete();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetectedItem = (item: EditableItem, index: number) => {
    return (
      <Surface key={index} style={styles.itemCard} elevation={1}>
        {/* Delete button positioned absolutely at top-right */}
        <IconButton
          icon="close"
          size={18}
          iconColor={Colors.text.secondary}
          onPress={() => handleRemoveItem(index)}
          style={styles.deleteButton}
          mode="text"
          testID={`item-${index}-delete`}
        />
        
        <View style={styles.itemContainer}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
                testID={`item-${index}-thumbnail`}
              />
            ) : (
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.thumbnailPlaceholderText}>?</Text>
              </View>
            )}
          </View>
          
          {/* Content container with name and quantity */}
          <View style={styles.contentContainer}>
            {/* Name input - editable with outline */}
            <TextInput
              mode="outlined"
              value={item.name}
              onChangeText={(text) => handleUpdateItem(index, 'name', text)}
              style={styles.nameInput}
              dense
              outlineColor={Colors.divider}
              activeOutlineColor={Colors.primary.main}
              contentStyle={styles.nameInputContent}
              testID={`item-${index}-name-input`}
            />
            
            {/* Quantity row */}
            <View style={styles.quantityRow}>
              <Text variant="labelMedium" style={styles.quantityLabel}>
                수량:
              </Text>
              <View style={styles.quantityControls}>
                <IconButton
                  icon="minus"
                  size={18}
                  mode="contained"
                  containerColor={Colors.background.container}
                  iconColor={Colors.text.primary}
                  onPress={() => handleQuantityChange(index, -1)}
                  style={styles.quantityButton}
                  testID={`item-${index}-decrement`}
                />
                <Text variant="bodyLarge" style={styles.quantityText}>
                  {item.quantity || 1}
                </Text>
                <IconButton
                  icon="plus"
                  size={18}
                  mode="contained"
                  containerColor={Colors.background.container}
                  iconColor={Colors.text.primary}
                  onPress={() => handleQuantityChange(index, 1)}
                  style={styles.quantityButton}
                  testID={`item-${index}-increment`}
                />
              </View>
            </View>
          </View>
        </View>
      </Surface>
    );
  };

  // No longer need event listener since we use prop
  
  // Auto-analyze if initialImageUri is provided
  React.useEffect(() => {
    if (initialImageUri) {
      analyzeImage(initialImageUri);
    }
  }, [initialImageUri]);

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.content} elevation={0}>
        {!hideImageSelection && (
          <>
            <Text variant="headlineSmall" style={styles.title}>
              사진으로 재료 추가
            </Text>
            
            <ImageUpload
              onImageSelected={analyzeImage}
              selectedImageUri={selectedImageUri}
              onImageRemoved={() => {
                setSelectedImageUri('');
                setDetectedItems([]);
              }}
            />
          </>
        )}
        
        {/* Show image preview when hideImageSelection is true */}
        {hideImageSelection && selectedImageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          </View>
        )}
        
        {isAnalyzing && (
          <View style={styles.loadingContainer} testID="ai-analysis-loading">
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text variant="bodyLarge" style={styles.loadingText}>
              AI가 재료를 분석하고 있습니다...
            </Text>
          </View>
        )}
        
        {detectedItems.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              감지된 재료
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              아래 항목을 확인하고 수정할 수 있습니다
            </Text>
            
            <View testID="detected-items-list">
              {detectedItems.map((item, index) => renderDetectedItem(item, index))}
            </View>
            
            <Divider style={styles.divider} />
            
            <Button
              mode="contained"
              onPress={handleSaveAll}
              loading={isSaving}
              disabled={isSaving || isAnalyzing}
              style={styles.saveButton}
              testID="save-all-button"
            >
              모두 저장
            </Button>
          </View>
        )}
        
        {!isAnalyzing && detectedItems.length === 0 && selectedImageUri && (
          <View style={styles.noItemsContainer}>
            <Text variant="bodyLarge" style={styles.noItemsText}>
              식재료를 감지하지 못했습니다
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowManualInput(true)}
              style={styles.manualButton}
              testID="manual-input-button"
            >
              수동으로 입력
            </Button>
          </View>
        )}
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  content: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.default,
  },
  title: {
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    fontFamily: 'OpenSans-Bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontFamily: 'OpenSans-Regular',
  },
  resultsContainer: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: 'OpenSans-SemiBold',
  },
  helpText: {
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontFamily: 'OpenSans-Regular',
  },
  itemCard: {
    backgroundColor: Colors.background.surface,
    borderRadius: 12,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    position: 'relative',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: Spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingRight: Spacing.lg, // Space for delete button
  },
  nameInput: {
    backgroundColor: Colors.background.surface,
    marginBottom: Spacing.sm,
    height: 40,
  },
  nameInputContent: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    paddingVertical: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    minWidth: 45, // Ensure label doesn't wrap
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  quantityButton: {
    margin: 0,
    width: 28,
    height: 28,
  },
  quantityText: {
    minWidth: 30,
    textAlign: 'center',
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.text.primary,
    marginHorizontal: Spacing.xs,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    zIndex: 1,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.container,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    color: Colors.text.secondary,
    fontSize: 48, // 더 큰 썸네일에 맞게 크기 조정
    fontFamily: 'OpenSans-Regular',
  },
  divider: {
    marginVertical: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  noItemsContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noItemsText: {
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontFamily: 'OpenSans-Regular',
  },
  manualButton: {
    borderColor: Colors.primary.main,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  thumbnail: {
    width: 128,
    height: 128,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.background.surface, // 이미지 로드 전 배경
  },
});