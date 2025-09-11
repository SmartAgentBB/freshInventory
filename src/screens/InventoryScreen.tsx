import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text, ActivityIndicator, FAB, Searchbar, Chip } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { FoodItem } from '../models/FoodItem';
import { FoodItemCard } from '../components/FoodItemCard';
import { InventoryService } from '../services/InventoryService';
import { AddItemWithImage } from '../components/AddItemWithImage';
import { Spacing } from '../constants/spacing';
import * as ImagePicker from 'expo-image-picker';
import { supabaseClient } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { InventoryStackParamList } from '../navigation/InventoryStackNavigator';

type TabType = 'fresh' | 'frozen' | 'consumed';
type SortType = 'newest' | 'oldest' | 'urgent';
type NavigationProp = StackNavigationProp<InventoryStackParamList, 'InventoryList'>;

export const InventoryScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<TabType>('fresh');
  const [freshItems, setFreshItems] = useState<FoodItem[]>([]);
  const [frozenItems, setFrozenItems] = useState<FoodItem[]>([]);
  const [consumedItems, setConsumedItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWithImage, setShowAddWithImage] = useState(false);
  const [showImageButtons, setShowImageButtons] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortType, setSortType] = useState<SortType>('newest');
  
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
      const userId = user.id;
      
      const [freshData, frozenData, consumedData] = await Promise.all([
        inventoryService.getItemsByStatus(userId, 'fresh'),
        inventoryService.getItemsByStatus(userId, 'frozen'),
        inventoryService.getItemsByStatus(userId, 'consumed')
      ]);
      
      setFreshItems(freshData);
      setFrozenItems(frozenData);
      setConsumedItems(consumedData);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setFreshItems([]);
      setFrozenItems([]);
      setConsumedItems([]);
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
      case 'consumed':
        items = removeDuplicatesByName(consumedItems).slice(0, 10);
        break;
    }

    // Apply search filter
    if (searchQuery && activeTab === 'fresh') {
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
            const daysLeftA = a.expirationDate ? 
              Math.floor((new Date(a.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
            const daysLeftB = b.expirationDate ? 
              Math.floor((new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
            return daysLeftA - daysLeftB;
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
      case 'consumed':
        return '지난 기록이 없습니다';
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
        {/* Title */}
        <Text variant="headlineMedium" style={styles.title}>
          재고 목록
        </Text>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton tab="fresh" label="재고목록" />
          <TabButton tab="frozen" label="냉동보관" />
          <TabButton tab="consumed" label="지난기록" />
        </View>

        {/* Search Bar (Fresh tab only) */}
        {activeTab === 'fresh' && showSearch && (
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
                >
                  임박순
                </Chip>
              )}
            </View>
            <View style={styles.countContainer}>
              {activeTab === 'fresh' && !showSearch && (
                <TouchableOpacity 
                  onPress={() => setShowSearch(true)}
                  style={styles.searchButton}
                >
                  <Text>🔍</Text>
                </TouchableOpacity>
              )}
              <Text variant="bodySmall" style={styles.countText}>
                총 {getCurrentItems().length}개
              </Text>
            </View>
          </View>
        )}

        {/* Consumed tab info */}
        {activeTab === 'consumed' && (
          <View style={styles.consumedInfo}>
            <Text variant="bodyMedium" style={styles.consumedInfoText}>
              최근에 소비한 재료를 확인하세요.
            </Text>
            <Text variant="bodySmall" style={styles.countText}>
              총 {getCurrentItems().length}개
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
              getCurrentItems().map(item => (
                <View key={item.id} style={styles.itemWrapper}>
                  <FoodItemCard 
                    item={item}
                    showControls={activeTab === 'fresh' || activeTab === 'frozen'}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onPress={handleItemPress}
                  />

                  {/* Consumed tab shopping button */}
                  {activeTab === 'consumed' && (
                    <View style={styles.consumedActions}>
                      <TouchableOpacity
                        style={styles.addToShoppingButton}
                      >
                        <Text variant="labelMedium" style={styles.addToShoppingButtonText}>
                          장보기 목록에 추가
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button and Image Selection */}
      {!showAddWithImage && (
        <>
          {Platform.OS === 'web' ? (
            // Web version with file upload and direct add options
            <>
              {showImageButtons && (
                <View style={styles.imageButtonsContainer}>
                  <FAB
                    icon="file-image"
                    label="이미지 선택"
                    style={[styles.imageButton, { marginBottom: Spacing.sm }]}
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
                  <FAB
                    icon="text"
                    label="직접 입력"
                    style={styles.imageButton}
                    onPress={() => {
                      setShowImageButtons(false);
                      setShowAddWithImage(true);
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
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    textAlign: 'center',
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortChip: {
    marginRight: Spacing.xs,
    backgroundColor: Colors.background.paper,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
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
  },
  consumedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  consumedInfoText: {
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
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
  consumedActions: {
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