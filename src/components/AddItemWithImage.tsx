import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Text as RNText,
  Keyboard,
  Dimensions,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  List,
  IconButton,
  TextInput,
  Divider,
  Menu,
  Chip,
  Checkbox,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ImageUpload } from './ImageUpload';
import { AIService, FoodItem } from '../services/AIService';
import { uploadImageToSupabase } from '../services/StorageService';
import { InventoryService } from '../services/InventoryService';
import { ShoppingService } from '../services/ShoppingService';
import { useShoppingCount } from '../contexts/ShoppingContext';
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

// Available units for food items will be determined inside the component

export const AddItemWithImage: React.FC<AddItemWithImageProps> = ({
  onComplete,
  userId,
  hideImageSelection = false,
  initialImageUri = '',
}) => {
  const { t, i18n } = useTranslation('addItem');
  const UNITS = i18n.language === 'en' ? ['pcs', 'packs'] : ['개', '팩'];
  const [selectedImageUri, setSelectedImageUri] = useState<string>(initialImageUri);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<EditableItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [unitMenuVisible, setUnitMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [shoppingListItems, setShoppingListItems] = useState<string[]>([]);
  const [showShoppingNotification, setShowShoppingNotification] = useState(false);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<{ [key: string]: boolean }>({});

  // Refs and state for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const inputContainerRefs = useRef<{ [key: number]: View | null }>({});
  const [scrollOffset, setScrollOffset] = useState(0);

  const aiService = new AIService();
  const shoppingService = new ShoppingService(supabaseClient);
  const { refreshCount } = useShoppingCount();
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY;
  const inventoryService = new InventoryService(supabaseClient, geminiApiKey);

  const analyzeImage = async (imageUri: string) => {
    setSelectedImageUri(imageUri);
    
    // Start AI analysis
    setIsAnalyzing(true);
    setDetectedItems([]);
    
    try {
      // Compress image - dual quality approach
      // 1. High quality version for cropping thumbnails
      const highQualityForCrop = await compressImage(imageUri, {
        quality: 0.8,   // Good quality for cropping
        maxWidth: 1920, // Keep high resolution for cropping
        format: 'jpeg'
      });

      // 2. Lower quality version for AI analysis (cost reduction)
      const aiAnalysisVersion = await compressImage(imageUri, {
        quality: 0.7,   // Lower quality for AI
        maxWidth: 640,  // Much smaller for API cost reduction
        format: 'jpeg'
      });

      const compressed = highQualityForCrop; // Use high quality for display
      
      // Store the compressed URI temporarily for display and cropping
      // We'll only upload the cropped thumbnails, not the full image
      setSelectedImageUri(compressed.uri);

      // Store the compressed URI for potential fallback use
      const fullImageUri = compressed.uri;

      // Analyze with AI - Use low resolution version for cost reduction
      const analysisResult = await aiService.analyzeImage(aiAnalysisVersion.uri);
      
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
                // Note: boundingBox is already in 0-1000 normalized coordinates
                // cropImageToBoundingBox will handle the conversion to pixels
                // Use high quality image for cropping to get better thumbnails
                thumbnail = await cropImageToBoundingBox(
                  compressed.uri,  // Use high quality image for cropping
                  item.boundingBox, // Use original boundingBox (0-1000 range)
                  480, // 480x480 - better quality for detail view
                  { width: compressed.width, height: compressed.height } // Pass high quality dimensions
                );
                console.log('Generated thumbnail URI:', thumbnail);
              } else {
                // Invalid boundingBox format, use full image
                thumbnail = compressed.uri;
              }
            } else {
              // No bounding box, use full image as thumbnail
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

        // Check if any detected items are in the shopping list
        const detectedNames = itemsWithThumbnails.map(item => item.name);
        const itemsInShoppingList = await shoppingService.checkItemsInShoppingList(userId, detectedNames);

        if (itemsInShoppingList.length > 0) {
          setShoppingListItems(itemsInShoppingList);
          setShowShoppingNotification(true);

          // Initialize all shopping items as checked by default
          const initialChecked: { [key: string]: boolean } = {};
          itemsInShoppingList.forEach(name => {
            initialChecked[name] = true;
          });
          setCheckedShoppingItems(initialChecked);
        }
      } else {
        Alert.alert(
          '분석 실패',
          'AI 서비스를 사용할 수 없습니다.'
        );
      }
    } catch (error: any) {
      console.error('Image analysis error:', error);

      // Check if it's an overload error (503)
      if (error?.message?.includes('overloaded') || error?.message?.includes('503')) {
        Alert.alert(
          'AI 서버 과부하',
          'AI 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
          [
            {
              text: '다시 시도',
              onPress: () => {
                // Retry after a short delay
                setTimeout(() => {
                  handleImageSelected(selectedImageUri);
                }, 2000);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          '분석 오류',
          '이미지 분석 중 오류가 발생했습니다.',
          [
            {
              text: '확인',
              style: 'default',
            },
          ]
        );
      }
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
      Alert.alert(t('messages.notification'), t('messages.noItems'));
      return;
    }

    setIsSaving(true);

    try {
      // Upload thumbnails to Supabase if they are blob URLs
      const itemsWithUploadedThumbnails = await Promise.all(
        detectedItems.map(async (item) => {
          // Check if thumbnail is a blob URL or local URI
          if (item.thumbnail && (item.thumbnail.startsWith('blob:') || item.thumbnail.startsWith('file:'))) {
            console.log('Uploading thumbnail for item:', item.name);
            const uploadResult = await uploadImageToSupabase(item.thumbnail, userId);

            if (uploadResult.success && uploadResult.publicUrl) {
              console.log('Thumbnail uploaded successfully:', uploadResult.publicUrl);
              return {
                ...item,
                thumbnail: uploadResult.publicUrl
              };
            } else {
              console.error('Failed to upload thumbnail for item:', item.name);
              // Upload full image as fallback if thumbnail upload fails
              console.log('Uploading full image as fallback for:', item.name);
              const fallbackUpload = await uploadImageToSupabase(selectedImageUri, userId);

              if (fallbackUpload.success && fallbackUpload.publicUrl) {
                return {
                  ...item,
                  thumbnail: fallbackUpload.publicUrl
                };
              } else {
                console.error('Failed to upload fallback image for item:', item.name);
                return {
                  ...item,
                  thumbnail: null
                };
              }
            }
          }
          // If it's already a Supabase URL, keep it as is
          return item;
        })
      );

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
      const savedItems = results.filter(r => r !== null);

      // Mark shopping list items as completed if they were saved successfully and checked
      if (shoppingListItems.length > 0 && savedItems.length > 0) {
        const savedNames = savedItems.map(item => item!.name);
        // Only complete items that are both saved AND checked
        const itemsToComplete = shoppingListItems.filter(name =>
          savedNames.includes(name) && checkedShoppingItems[name]
        );

        console.log('=== 장보기 완료 처리 디버깅 ===');
        console.log('Shopping list items:', JSON.stringify(shoppingListItems));
        console.log('Saved item names:', JSON.stringify(savedNames));
        console.log('Checked items:', JSON.stringify(checkedShoppingItems));
        console.log('Items to complete:', JSON.stringify(itemsToComplete));

        if (itemsToComplete.length > 0) {
          const { completedItems, success } = await shoppingService.markAsCompletedByNames(userId, itemsToComplete);
          console.log('Marking result - success:', success);
          console.log('Completed items:', JSON.stringify(completedItems));
          console.log('Expected to complete:', JSON.stringify(itemsToComplete));
          console.log('Actually completed:', JSON.stringify(completedItems));

          if (completedItems.length > 0) {
            // Refresh the shopping badge count
            await refreshCount();

            // Show success message with completed items
            const message = failedCount > 0
              ? t('messages.itemsSavedWithShopping', { count: savedItems.length, items: completedItems.join(', ') }) + '\n' + t('messages.itemsSavedWithErrors', { saved: 0, failed: failedCount }).split('.')[1]
              : t('messages.itemsSavedWithShopping', { count: savedItems.length, items: completedItems.join(', ') });

            Alert.alert(t('messages.saveComplete'), message);
          } else if (failedCount > 0) {
            Alert.alert(
              t('messages.partialSaveSuccess'),
              t('messages.itemsSavedWithErrors', { saved: savedItems.length, failed: failedCount })
            );
          } else {
            Alert.alert(t('messages.saveComplete'), t('messages.itemsSaved', { count: savedItems.length }));
          }
        } else if (failedCount > 0) {
          Alert.alert(
            t('messages.partialSaveSuccess'),
            t('messages.itemsSavedWithErrors', { saved: savedItems.length, failed: failedCount })
          );
        } else {
          Alert.alert(t('messages.saveComplete'), t('messages.itemsSaved', { count: savedItems.length }));
        }
      } else if (failedCount > 0) {
        Alert.alert(
          t('messages.partialSaveSuccess'),
          t('messages.itemsSavedWithErrors', { saved: savedItems.length, failed: failedCount })
        );
      } else {
        Alert.alert(t('messages.saveComplete'), t('messages.itemsSaved', { count: savedItems.length }));
      }

      // Navigate back to inventory screen
      onComplete();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert(t('messages.error'), t('messages.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetectedItem = (item: EditableItem, index: number) => {
    const isInShoppingList = shoppingListItems.includes(item.name);

    return (
      <View key={index} style={{ marginBottom: Spacing.xs }}>
        <Surface style={styles.itemCard} elevation={1}>
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

        <View
          ref={(ref) => (inputContainerRefs.current[index] = ref)}
          style={styles.itemContainer}
        >
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
              onFocus={() => {
                const keyboardListener = Keyboard.addListener('keyboardDidShow', (e) => {
                  inputContainerRefs.current[index]?.measureInWindow((x, y, width, height) => {
                    const keyboardHeight = e.endCoordinates.height;
                    const screenHeight = Dimensions.get('window').height;
                    const inputBottom = y + height;
                    const visibleScreen = screenHeight - keyboardHeight;

                    if (inputBottom > visibleScreen - 20) {
                      const scrollTo = scrollOffset + (inputBottom - visibleScreen + 100);
                      scrollViewRef.current?.scrollTo({ y: scrollTo, animated: true });
                    }
                  });
                  keyboardListener.remove();
                });
              }}
            />
            
            {/* Quantity and Unit section */}
            <View style={styles.quantitySection}>
              {/* Quantity row */}
              <View style={styles.quantityRow}>
                <Text variant="labelMedium" style={styles.quantityLabel}>
                  {t('quantity')}
                </Text>
                <View style={styles.quantityControls}>
                  <IconButton
                    icon="minus"
                    size={18}
                    mode="contained"
                    containerColor={Colors.background.default}
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
                    containerColor={Colors.background.default}
                    iconColor={Colors.text.primary}
                    onPress={() => handleQuantityChange(index, 1)}
                    style={styles.quantityButton}
                    testID={`item-${index}-increment`}
                  />
                </View>
              </View>

              {/* Unit row */}
              <View style={styles.unitRow}>
                <Text variant="labelMedium" style={styles.unitLabel}>
                  단위
                </Text>
                <Menu
                  visible={unitMenuVisible[index] || false}
                  onDismiss={() => {
                    const newMenuState = { ...unitMenuVisible };
                    newMenuState[index] = false;
                    setUnitMenuVisible(newMenuState);
                  }}
                  anchor={
                    <TouchableOpacity
                      onPress={() => {
                        const newMenuState = { ...unitMenuVisible };
                        newMenuState[index] = !newMenuState[index];
                        setUnitMenuVisible(newMenuState);
                      }}
                      style={styles.unitTouchable}
                      activeOpacity={0.7}
                    >
                      <View style={styles.unitButtonCustom}>
                        <RNText style={styles.unitButtonText}>
                          {item.unit || '개'}
                        </RNText>
                        <Icon
                          name="chevron-down"
                          size={16}
                          color={Colors.primary.main}
                          style={{ marginLeft: 4 }}
                        />
                      </View>
                    </TouchableOpacity>
                  }
                >
                  {UNITS.map((unit) => (
                    <Menu.Item
                      key={unit}
                      onPress={() => {
                        handleUpdateItem(index, 'unit', unit);
                        const newMenuState = { ...unitMenuVisible };
                        newMenuState[index] = false;
                        setUnitMenuVisible(newMenuState);
                      }}
                      title={unit}
                      style={{ height: 40 }}  // Adjusted height for smaller text
                      titleStyle={{
                        fontSize: 11,  // Reduced to ~80% of original 14px
                        lineHeight: 16,  // Adjusted line height
                        fontFamily: 'OpenSans-Regular'
                      }}
                    />
                  ))}
                </Menu>
              </View>
            </View>
          </View>
        </View>

        {/* Shopping list checkbox inside the card */}
        {isInShoppingList && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: Spacing.xs,
            borderTopWidth: 1,
            borderTopColor: Colors.border.light,
            paddingTop: Spacing.xs,
          }}>
            <IconButton
              icon="cart-outline"
              size={20}
              iconColor={checkedShoppingItems[item.name] ? Colors.primary.main : Colors.text.secondary}
              style={{ margin: 0, marginLeft: -8, marginRight: -4 }}
            />
            <Text
              variant="bodySmall"
              style={{
                flex: 1,
                color: checkedShoppingItems[item.name] ? Colors.primary.main : Colors.text.secondary,
                marginLeft: -4,
                fontFamily: 'OpenSans-Regular',
                fontSize: 12,
              }}
            >
              {t('completeShoppingButton')}
            </Text>
            <TouchableOpacity
              style={[
                styles.checkboxWrapper,
                checkedShoppingItems[item.name] && styles.checkboxWrapperChecked
              ]}
              onPress={() => {
                setCheckedShoppingItems({
                  ...checkedShoppingItems,
                  [item.name]: !checkedShoppingItems[item.name],
                });
              }}
              activeOpacity={0.7}
            >
              {checkedShoppingItems[item.name] && (
                <Icon
                  name="check"
                  size={18}
                  color="white"
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      </Surface>
    </View>
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
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <Surface style={styles.content} elevation={0}>
        {!hideImageSelection && (
          <>
            <Text variant="headlineSmall" style={styles.title}>
              {t('title')}
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
              {t('analyzing')}
            </Text>
          </View>
        )}
        
        {detectedItems.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('detected')}
            </Text>
            <Text variant="bodyMedium" style={styles.helpText}>
              {t('detectedHelp')}
            </Text>

            <View testID="detected-items-list">
              {detectedItems.map((item, index) => renderDetectedItem(item, index))}
            </View>

            <Divider style={{ marginVertical: Spacing.xs }} />

            {/* Shopping list notification text */}
            {shoppingListItems.length > 0 && (
              <View style={{
                marginBottom: Spacing.xs,
              }}>
                <Text variant="bodySmall" style={{ color: Colors.text.secondary, marginBottom: 2 }}>
                  {t('completeShoppingNotice')}
                </Text>
                <Text variant="bodySmall" style={{ color: Colors.text.secondary }}>
                  {t('completeShoppingDesc')}
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleSaveAll}
              loading={isSaving}
              disabled={isSaving || isAnalyzing}
              style={styles.saveButton}
              testID="save-all-button"
            >
              {t('saveAll')}
            </Button>
          </View>
        )}
        
        {!isAnalyzing && detectedItems.length === 0 && selectedImageUri && (
          <View style={styles.noItemsContainer}>
            <Text variant="bodyLarge" style={styles.noItemsText}>
              식재료를 감지하지 못했습니다
            </Text>
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
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginBottom: Spacing.md,
    padding: Spacing.md, // Reduced from Spacing.lg (24 -> 16)
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: Spacing.sm, // Reduced from Spacing.md (16 -> 8)
  },
  contentContainer: {
    flex: 1,
    paddingRight: Spacing.md, // Reduced padding for wider name input (16 instead of 24)
  },
  nameInput: {
    backgroundColor: Colors.background.paper,
    marginBottom: Spacing.md, // Increased spacing between name and quantity
    height: 40,
  },
  nameInputContent: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    paddingVertical: 4,
    color: Colors.primary.main,
  },
  quantitySection: {
    flexDirection: 'column',
    gap: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    minWidth: 40,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Reduced from 8 to 6 (75% of original)
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitLabel: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    minWidth: 40,
  },
  unitTouchable: {
    minWidth: 80,
  },
  unitButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 4,
    backgroundColor: Colors.background.paper,
    minHeight: 36,
  },
  unitButtonText: {
    fontFamily: 'OpenSans-Medium',
    color: Colors.primary.main,
    fontSize: 13,  // Slightly larger to prevent cutoff
    lineHeight: 18,  // Proper line height
    includeFontPadding: false,  // Android specific - removes extra padding
    textAlignVertical: 'center',
  },
  // Keep old styles for backwards compatibility
  unitButton: {
    minWidth: 80,
    height: 38,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.paper,
  },
  unitButtonContent: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 8,
    paddingVertical: 2,
    height: 36,
  },
  unitButtonLabel: {
    fontFamily: 'OpenSans-Medium',
    color: Colors.primary.main,
    fontSize: 11,
    lineHeight: 16,
  },
  quantityButton: {
    margin: 0,
    width: 28,
    height: 28,
  },
  quantityText: {
    minWidth: 24, // Reduced from 30 to 24
    textAlign: 'center',
    fontFamily: 'OpenSans-Medium',
    color: Colors.primary.main,
    marginHorizontal: 4, // Reduced from Spacing.xs (8) to 4
    fontSize: 14,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    zIndex: 1,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.default,
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
    backgroundColor: Colors.background.default, // 이미지 로드 전 배경
  },
  checkboxWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#9E9E9E',
  },
  checkboxWrapperChecked: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
});