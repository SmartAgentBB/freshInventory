import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text, ActivityIndicator, FAB, Searchbar, Chip, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { FoodItem } from '../models/FoodItem';
import { FoodItemCard } from '../components/FoodItemCard';
import { HistoryCard } from '../components/HistoryCard';
import { InventoryService } from '../services/InventoryService';
import { ShoppingService } from '../services/ShoppingService';
import { AddItemWithImage } from '../components/AddItemWithImage';
import { Spacing } from '../constants/spacing';
import * as ImagePicker from 'expo-image-picker';
import { supabaseClient } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useShoppingCount } from '../contexts/ShoppingContext';
import { InventoryStackParamList } from '../navigation/InventoryStackNavigator';

type TabType = 'fresh' | 'frozen' | 'history';
type SortType = 'newest' | 'oldest' | 'urgent';
type NavigationProp = StackNavigationProp<InventoryStackParamList, 'InventoryList'>;

export const InventoryScreen: React.FC = () => {
  const { user } = useAuth();
  const { refreshCount } = useShoppingCount();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('fresh');
  const [freshItems, setFreshItems] = useState<FoodItem[]>([]);
  const [frozenItems, setFrozenItems] = useState<FoodItem[]>([]);
  const [historyItems, setHistoryItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWithImage, setShowAddWithImage] = useState(false);
  const [showImageButtons, setShowImageButtons] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortType, setSortType] = useState<SortType>('newest');
  const [shoppingListItems, setShoppingListItems] = useState<string[]>([]);
  
  const loadData = async () => {
    setLoading(true);
    
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      // Gemini API key can be configured here or from environment variables
      const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const inventoryService = new InventoryService(supabaseClient, GEMINI_API_KEY);
      const shoppingService = new ShoppingService(supabaseClient);
      const userId = user.id;

      const [freshData, frozenData, historyData, shoppingItems] = await Promise.all([
        inventoryService.getItemsByStatus(userId, 'fresh'),
        inventoryService.getItemsByStatus(userId, 'frozen'),
        inventoryService.getHistoryItems(userId),
        shoppingService.getActiveItems(userId)
      ]);

      setFreshItems(freshData);
      setFrozenItems(frozenData);
      setHistoryItems(historyData);
      // Store shopping list item names for quick lookup
      setShoppingListItems(shoppingItems.map(item => item.name.toLowerCase()));
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setFreshItems([]);
      setFrozenItems([]);
      setHistoryItems([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // 화면이 포커스될 때마다 데이터 다시 로드 (상세화면에서 돌아올 때)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user])
  );

  const handleStatusChange = async (itemId: string, newStatus: FoodItem['status']) => {
    try {
      // Gemini API key can be configured here or from environment variables
      const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const inventoryService = new InventoryService(supabaseClient, GEMINI_API_KEY);
      await inventoryService.updateItem(itemId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    console.log('handleDelete called with itemId:', itemId);
    try {
      // Gemini API key can be configured here or from environment variables
      const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      const inventoryService = new InventoryService(supabaseClient, GEMINI_API_KEY);
      console.log('Calling inventoryService.deleteItem...');
      const success = await inventoryService.deleteItem(itemId);
      console.log('Delete result:', success);
      if (success) {
        console.log('Delete successful, reloading data...');
        await loadData();
      } else {
        console.error('Delete failed - success is false');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleItemPress = (item: FoodItem) => {
    navigation.navigate('ItemDetail', { item });
  };

  const handleAddToShopping = async (item: FoodItem, isAdded: boolean) => {
    if (!user?.id) return;

    const shoppingService = new ShoppingService(supabaseClient);

    try {
      if (isAdded) {
        // Add to shopping list
        const result = await shoppingService.addItem(user.id, item.name, '재구매');
        if (result.success) {
          // Update local state
          setShoppingListItems(prev => [...prev, item.name.toLowerCase()]);
          // Update shopping count badge
          await refreshCount();
        } else {
          console.error('Failed to add to shopping list:', result.error);
        }
      } else {
        // Remove from shopping list (need to find the item first)
        const shoppingItems = await shoppingService.getActiveItems(user.id);
        const shoppingItem = shoppingItems.find(si => si.name.toLowerCase() === item.name.toLowerCase());

        if (shoppingItem) {
          const result = await shoppingService.deleteItem(shoppingItem.id);
          if (result.success) {
            // Update local state
            setShoppingListItems(prev => prev.filter(name => name !== item.name.toLowerCase()));
            // Update shopping count badge
            await refreshCount();
          } else {
            console.error('Failed to remove from shopping list:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating shopping list:', error);
    }
  };

  const removeDuplicatesByName = (items: FoodItem[]): FoodItem[] => {
    const uniqueItems = new Map<string, FoodItem>();
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    sortedItems.forEach(item => {
      if (!uniqueItems.has(item.name)) {
        uniqueItems.set(item.name, item);
      }
    });
    return Array.from(uniqueItems.values());
  };

  const getCurrentItems = (): FoodItem[] => {
    let items: FoodItem[] = [];
    
    switch (activeTab) {
      case 'fresh':
        items = freshItems;
        break;
      case 'frozen':
        items = frozenItems;
        break;
      case 'history':
        items = historyItems; // Already limited to 10 unique items from service
        break;
    }

    // Apply search filter
    if (searchQuery && (activeTab === 'fresh' || activeTab === 'frozen')) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (activeTab === 'fresh' || activeTab === 'frozen') {
      switch (sortType) {
        case 'newest':
          items = [...items].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'oldest':
          items = [...items].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          break;
        case 'urgent':
          items = [...items].sort((a, b) => {
            // Calculate remaining percentage for item A
            const today = new Date();
            const addedDateA = new Date(a.addedDate);
            const daysElapsedA = Math.floor((today.getTime() - addedDateA.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemainingA = (a.storageDays || 7) - daysElapsedA;
            const percentRemainingA = (daysRemainingA / (a.storageDays || 7)) * 100;

            // Calculate remaining percentage for item B
            const addedDateB = new Date(b.addedDate);
            const daysElapsedB = Math.floor((today.getTime() - addedDateB.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemainingB = (b.storageDays || 7) - daysElapsedB;
            const percentRemainingB = (daysRemainingB / (b.storageDays || 7)) * 100;

            // Sort by percentage remaining (lower percentage = more urgent = should come first)
            return percentRemainingA - percentRemainingB;
          });
          break;
      }
    }

    return items;
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'fresh':
        return '재고가 없습니다';
      case 'frozen':
        return '냉동 보관 중인 재료가 없습니다';
      case 'history':
        return '소비 완료된 재료가 없습니다';
      default:
        return '항목이 없습니다';
    }
  };

  const TabButton: React.FC<{ tab: TabType; label: string }> = ({ tab, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
    >
      <Text
        variant="labelLarge"
        style={[
          styles.tabButtonText,
          activeTab === tab && styles.activeTabButtonText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton tab="fresh" label="재고목록" />
          <TabButton tab="frozen" label="냉동보관" />
          <TabButton tab="history" label="소비완료" />
        </View>

        {/* Search Bar (Fresh and Frozen tabs) */}
        {(activeTab === 'fresh' || activeTab === 'frozen') && showSearch && (
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="재료명을 입력하세요..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              onIconPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              icon="close"
            />
          </View>
        )}

        {/* Sort and Count Bar */}
        {(activeTab === 'fresh' || activeTab === 'frozen') && (
          <View style={styles.sortContainer}>
            <View style={styles.sortButtons}>
              <Chip
                mode={sortType === 'newest' ? 'flat' : 'outlined'}
                onPress={() => setSortType('newest')}
                style={[
                  styles.sortChip,
                  sortType === 'newest' && styles.activeSortChip
                ]}
                textStyle={[
                  styles.sortChipText,
                  sortType === 'newest' && styles.activeSortChipText
                ]}
                compact
              >
                최신순
              </Chip>
              <Chip
                mode={sortType === 'oldest' ? 'flat' : 'outlined'}
                onPress={() => setSortType('oldest')}
                style={[
                  styles.sortChip,
                  sortType === 'oldest' && styles.activeSortChip
                ]}
                textStyle={[
                  styles.sortChipText,
                  sortType === 'oldest' && styles.activeSortChipText
                ]}
                compact
              >
                오래된순
              </Chip>
              {activeTab === 'fresh' && (
                <Chip
                  mode={sortType === 'urgent' ? 'flat' : 'outlined'}
                  onPress={() => setSortType('urgent')}
                  style={[
                    styles.sortChip,
                    sortType === 'urgent' && styles.activeSortChip
                  ]}
                  textStyle={[
                    styles.sortChipText,
                    sortType === 'urgent' && styles.activeSortChipText
                  ]}
                  compact
                >
                  임박순
                </Chip>
              )}
            </View>
            <View style={styles.countContainer}>
              <Text variant="bodySmall" style={styles.countText}>
                총 {getCurrentItems().length}개
              </Text>
              {(activeTab === 'fresh' || activeTab === 'frozen') && (
                <IconButton
                  icon="magnify"
                  size={20}
                  onPress={() => setShowSearch(!showSearch)}
                />
              )}
            </View>
          </View>
        )}

        {/* History tab info */}
        {activeTab === 'history' && (
          <View style={styles.historyInfo}>
            <Text variant="bodySmall" style={styles.historyInfoText}>
              최근에 소비한 재료를 확인하세요.
            </Text>
            <Text variant="bodySmall" style={styles.historySubText}>
              재구매가 필요한 재료를 장보기 목록에 쉽게 추가하세요.
            </Text>
          </View>
        )}
      </View>

      {/* Content Section with ScrollView */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              animating={true} 
              color={Colors.primary.main}
              size="large"
            />
          </View>
        ) : (
          <View style={styles.itemsList}>
            {getCurrentItems().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {getEmptyMessage()}
                </Text>
              </View>
            ) : (
              getCurrentItems().map(item =>
                activeTab === 'history' ? (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    // onPress removed - no detail view for history items
                    onAddToShopping={handleAddToShopping}
                    isInShoppingList={shoppingListItems.includes(item.name.toLowerCase())}
                  />
                ) : (
                  <FoodItemCard
                    key={item.id}
                    item={item}
                    showControls={activeTab === 'fresh' || activeTab === 'frozen'}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onPress={handleItemPress}
                  />
                )
              )
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button and Image Selection */}
      {!showAddWithImage && (
        <>
          {Platform.OS === 'web' ? (
            // Web version with file upload only
            <>
              {showImageButtons && (
                <View style={styles.imageButtonsContainer}>
                  <FAB
                    icon="file-image"
                    label="이미지 선택"
                    style={styles.imageButton}
                    onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                        allowsEditing: false,
                      });

                      if (!result.canceled && result.assets[0]) {
                        setShowImageButtons(false);
                        setSelectedImageUri(result.assets[0].uri);
                        setShowAddWithImage(true);
                      }
                    }}
                    color="white"
                    size="small"
                  />
                </View>
              )}

              <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setShowImageButtons(!showImageButtons)}
                color="white"
              />
            </>
          ) : (
            // Camera/Gallery options for mobile
            <>
              {showImageButtons && (
                <View style={styles.imageButtonsContainer}>
                  <FAB
                    icon="camera"
                    label="카메라"
                    style={[styles.imageButton, { marginBottom: Spacing.sm }]}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status === 'granted') {
                        const result = await ImagePicker.launchCameraAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          quality: 0.8,
                          allowsEditing: false,
                        });
                        
                        if (!result.canceled && result.assets[0]) {
                          setShowImageButtons(false);
                          setSelectedImageUri(result.assets[0].uri);
                          setShowAddWithImage(true);
                        }
                      }
                    }}
                    color="white"
                    size="small"
                  />
                  <FAB
                    icon="image"
                    label="갤러리"
                    style={styles.imageButton}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status === 'granted') {
                        const result = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ImagePicker.MediaTypeOptions.Images,
                          quality: 0.8,
                          allowsEditing: false,
                        });
                        
                        if (!result.canceled && result.assets[0]) {
                          setShowImageButtons(false);
                          setSelectedImageUri(result.assets[0].uri);
                          setShowAddWithImage(true);
                        }
                      }
                    }}
                    color="white"
                    size="small"
                  />
                </View>
              )}
              
              <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setShowImageButtons(!showImageButtons)}
                color="white"
              />
            </>
          )}
        </>
      )}
      
      {/* Add Item Modal */}
      {showAddWithImage && (
        <View style={styles.addItemContainer}>
          <AddItemWithImage
            userId={user?.id || ''}
            onComplete={() => {
              setShowAddWithImage(false);
              setSelectedImageUri('');
              loadData();
            }}
            hideImageSelection={true}
            initialImageUri={selectedImageUri}
          />
          <FAB
            icon="close"
            style={styles.closeFab}
            onPress={() => {
              setShowAddWithImage(false);
              setShowImageButtons(false);
            }}
            color={Colors.status.error}
            small
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.surface,
  },
  headerSection: {
    backgroundColor: Colors.background.paper,
    paddingTop: 44,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  activeTabButton: {
    borderBottomColor: Colors.primary.main,
    borderBottomWidth: 3,
  },
  tabButtonText: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Medium',
  },
  activeTabButtonText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: Colors.background.level2,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    height: 40,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  sortChip: {
    marginRight: Spacing.xs,
    backgroundColor: Colors.background.paper,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    height: 28,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeSortChip: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sortChipText: {
    color: Colors.text.primary,
    fontSize: 10,
    lineHeight: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  activeSortChipText: {
    color: Colors.text.onPrimary,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchButton: {
    padding: Spacing.xs,
  },
  countText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  historyInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  historyInfoText: {
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  historySubText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.md,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  itemsList: {
    flex: 1,
  },
  itemWrapper: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  historyActions: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addToShoppingButton: {
    backgroundColor: Colors.status.info,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToShoppingButtonText: {
    color: Colors.text.onPrimary,
    fontFamily: 'OpenSans-SemiBold',
  },
  fab: {
    position: 'absolute',
    margin: Spacing.lg,
    right: 0,
    bottom: 20,
    backgroundColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  closeFab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    top: 0,
    backgroundColor: Colors.background.paper,
  },
  addItemContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.surface,
    zIndex: 1000,
  },
  imageButtonsContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 80,
    alignItems: 'flex-end',
  },
  imageButton: {
    backgroundColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
});