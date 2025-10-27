import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, FAB, Chip, IconButton, Surface, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
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
type RouteProps = RouteProp<InventoryStackParamList, 'InventoryList'>;

export const InventoryScreen: React.FC = () => {
  const { t } = useTranslation('inventory');
  const { user } = useAuth();
  const { refreshCount } = useShoppingCount();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
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
  const [freshSortType, setFreshSortType] = useState<SortType>('newest');
  const [frozenSortType, setFrozenSortType] = useState<SortType>('newest');
  const [shoppingListItems, setShoppingListItems] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 알림에서 네비게이션된 경우 임박순 정렬 설정
  useEffect(() => {
    if (route.params?.initialSortBy === 'expiry') {
      setFreshSortType('urgent');
      setFrozenSortType('urgent');
    }
  }, [route.params]);
  
  const loadData = async (isRefreshing = false) => {
    console.log('LoadData called with isRefreshing:', isRefreshing);
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
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

    if (isRefreshing) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Pull to refresh triggered');
    loadData(true);
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
      const currentSortType = activeTab === 'fresh' ? freshSortType : frozenSortType;
      switch (currentSortType) {
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate expiry dates
            const addedDateA = new Date(a.addedDate);
            addedDateA.setHours(0, 0, 0, 0);
            const expiryDateA = new Date(addedDateA);
            expiryDateA.setDate(expiryDateA.getDate() + (a.storageDays || 7));

            const addedDateB = new Date(b.addedDate);
            addedDateB.setHours(0, 0, 0, 0);
            const expiryDateB = new Date(addedDateB);
            expiryDateB.setDate(expiryDateB.getDate() + (b.storageDays || 7));

            // Calculate days remaining (negative if expired)
            const daysRemainingA = Math.floor((expiryDateA.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const daysRemainingB = Math.floor((expiryDateB.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // First priority: Expired items (more negative = longer expired = comes first)
            if (daysRemainingA < 0 && daysRemainingB < 0) {
              // Both expired: sort by how long they've been expired (more expired first)
              return daysRemainingA - daysRemainingB;
            }

            // One expired, one not: expired comes first
            if (daysRemainingA < 0) return -1;
            if (daysRemainingB < 0) return 1;

            // Both not expired: sort by remaining percentage
            const daysElapsedA = Math.floor((today.getTime() - addedDateA.getTime()) / (1000 * 60 * 60 * 24));
            const daysElapsedB = Math.floor((today.getTime() - addedDateB.getTime()) / (1000 * 60 * 60 * 24));
            const percentRemainingA = ((a.storageDays || 7) - daysElapsedA) / (a.storageDays || 7) * 100;
            const percentRemainingB = ((b.storageDays || 7) - daysElapsedB) / (b.storageDays || 7) * 100;

            // Lower percentage = more urgent = comes first
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
        return t('empty.freshGuide');
      case 'frozen':
        return t('empty.frozenGuide');
      case 'history':
        return t('empty.history');
      default:
        return t('empty.default');
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
          <TabButton tab="fresh" label={t('tabs.fresh')} />
          <TabButton tab="frozen" label={t('tabs.frozen')} />
          <TabButton tab="history" label={t('tabs.history')} />
        </View>

        {/* Search Bar (Fresh and Frozen tabs) */}
        {(activeTab === 'fresh' || activeTab === 'frozen') && showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('search.placeholder')}
                placeholderTextColor="#9E9E9E"
                mode="outlined"
                style={styles.searchInput}
                dense
                contentStyle={styles.searchInputContent}
                left={<TextInput.Icon icon="magnify" color={Colors.text.secondary} />}
                right={searchQuery ? (
                  <TextInput.Icon
                    icon="backspace-outline"
                    color={Colors.text.secondary}
                    onPress={() => setSearchQuery('')}
                  />
                ) : null}
              />
              <IconButton
                icon="close"
                size={20}
                iconColor={Colors.text.secondary}
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                style={styles.searchCloseButton}
              />
            </View>
          </View>
        )}

        {/* Sort and Count Bar */}
        {(activeTab === 'fresh' || activeTab === 'frozen') && (
          <View style={styles.sortContainer}>
            <View style={styles.sortButtons}>
              <Chip
                mode={(activeTab === 'fresh' ? freshSortType : frozenSortType) === 'newest' ? 'flat' : 'outlined'}
                onPress={() => activeTab === 'fresh' ? setFreshSortType('newest') : setFrozenSortType('newest')}
                style={[
                  styles.sortChip,
                  (activeTab === 'fresh' ? freshSortType : frozenSortType) === 'newest' && styles.activeSortChip
                ]}
                textStyle={[
                  styles.sortChipText,
                  (activeTab === 'fresh' ? freshSortType : frozenSortType) === 'newest' && styles.activeSortChipText
                ]}
                compact
              >
                {t('sort.newest')}
              </Chip>
              <Chip
                mode={(activeTab === 'fresh' ? freshSortType : frozenSortType) === 'oldest' ? 'flat' : 'outlined'}
                onPress={() => activeTab === 'fresh' ? setFreshSortType('oldest') : setFrozenSortType('oldest')}
                style={[
                  styles.sortChip,
                  (activeTab === 'fresh' ? freshSortType : frozenSortType) === 'oldest' && styles.activeSortChip
                ]}
                textStyle={[
                  styles.sortChipText,
                  (activeTab === 'fresh' ? freshSortType : frozenSortType) === 'oldest' && styles.activeSortChipText
                ]}
                compact
              >
                {t('sort.oldest')}
              </Chip>
              {activeTab === 'fresh' && (
                <Chip
                  mode={freshSortType === 'urgent' ? 'flat' : 'outlined'}
                  onPress={() => setFreshSortType('urgent')}
                  style={[
                    styles.sortChip,
                    freshSortType === 'urgent' && styles.activeSortChip
                  ]}
                  textStyle={[
                    styles.sortChipText,
                    freshSortType === 'urgent' && styles.activeSortChipText
                  ]}
                  compact
                >
                  {t('sort.urgent')}
                </Chip>
              )}
            </View>
            <View style={styles.countContainer}>
              <Text variant="bodySmall" style={styles.countText}>
                {t('count', { count: getCurrentItems().length })}
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
          <View style={styles.historyInfoContainer}>
            <View style={styles.historyInfo}>
              <View style={styles.historyInfoTextContainer}>
                <Text style={styles.historyInfoText}>
                  {t('history.info')}
                </Text>
                <Text style={styles.historySubText}>
                  {t('history.subInfo')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Content Section with ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.main]} // Android
            tintColor={Colors.primary.main} // iOS
            title="당겨서 새로고침" // iOS
            titleColor={Colors.text.secondary} // iOS
          />
        }
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
                {activeTab === 'fresh' ? (
                  <>
                    <Text variant="bodyLarge" style={styles.emptyMainText}>
                      {t('empty.fresh')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubText}>
                      {t('empty.freshGuide')}
                    </Text>
                  </>
                ) : activeTab === 'frozen' ? (
                  <>
                    <Text variant="bodyLarge" style={styles.emptyMainText}>
                      {t('empty.frozen')}
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubText}>
                      {t('empty.frozenGuide').replace(t('empty.frozen') + '.', '').trim()}
                    </Text>
                  </>
                ) : (
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    {getEmptyMessage()}
                  </Text>
                )}
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
                    label={t('camera.button')}
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
                    label={t('camera.gallery')}
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
          {/* Header - Same height as ItemDetailScreen */}
          <View style={styles.headerSurface}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => {
                setShowAddWithImage(false);
                setShowImageButtons(false);
                setSelectedImageUri('');
              }}
              style={styles.backButton}
            />
            <Text variant="labelLarge" style={styles.headerTitle}>
              {t('addItem:saveTitle')}
            </Text>
            <View style={{ width: 48 }} />
          </View>

          {/* Content */}
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
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
    fontWeight: '700',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background.default,
    height: 36,
  },
  searchInputContent: {
    paddingVertical: 6,
    fontSize: 14,
  },
  searchCloseButton: {
    margin: 0,
    marginLeft: Spacing.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 44,
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
    height: 32,
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
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontFamily: 'OpenSans-SemiBold',
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
  historyInfoContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 60,
    justifyContent: 'center',
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyInfoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  historyInfoTextContainer: {
    flex: 1,
  },
  historyInfoText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 2,
    fontSize: 13,
    lineHeight: 16,
  },
  historySubText: {
    color: Colors.text.secondary,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'OpenSans-Regular',
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
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyMainText: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
  },
  emptySubText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    marginTop: Spacing.sm,
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
    backgroundColor: Colors.background.default,
    zIndex: 1000,
  },
  headerSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 44,  // Status bar height
    paddingBottom: 0,  // No bottom padding
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: 0,  // Full width for border
  },
  backButton: {
    marginLeft: Spacing.sm,  // Add some spacing from edge
    marginRight: 0,
    marginTop: Spacing.sm,  // Adjust vertical position
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    fontSize: 16,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  imageButtonsContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 112,
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