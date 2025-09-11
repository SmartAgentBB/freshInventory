import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, Platform, Alert, TouchableOpacity } from 'react-native';
import { 
  Surface, 
  Text, 
  IconButton, 
  Button, 
  Portal, 
  Dialog,
  Paragraph,
  useTheme
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FoodItem } from '../models/FoodItem';
import { InventoryService } from '../services/InventoryService';
import { StorageInfoService } from '../services/StorageInfoService';
import { supabaseClient } from '../services/supabaseClient';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const { width: screenWidth } = Dimensions.get('window');

export const ItemDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const [item, setItem] = useState<FoodItem | null>(null);
  const [currentRemains, setCurrentRemains] = useState(100);
  const [storageInfoModalVisible, setStorageInfoModalVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inventoryService = useRef(new InventoryService(
    supabaseClient, 
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;
  
  const storageInfoService = useRef(new StorageInfoService(
    supabaseClient,
    process.env.EXPO_PUBLIC_GEMINI_API_KEY
  )).current;

  useEffect(() => {
    const params = route.params as { item?: FoodItem };
    if (params?.item) {
      setItem(params.item);
      setCurrentRemains(Math.round((params.item.remains || 1) * 100));
      loadStorageInfo(params.item.name);
    }
  }, [route.params]);

  const loadStorageInfo = async (itemName: string) => {
    try {
      const info = await storageInfoService.getStorageInfo(itemName);
      setStorageInfo(info);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSliderChange = (value: number) => {
    // 기존 남은양보다 작게만 조절 가능 (0 ~ 기존값 범위)
    const originalRemains = Math.round((item?.remains || 1) * 100);
    if (value >= 0 && value <= originalRemains) {
      setCurrentRemains(Math.round(value));
    }
  };

  const handleUpdateRemains = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      await inventoryService.updateItem(item.id, {
        remains: currentRemains / 100
      });
      
      // Navigate back with updated item
      navigation.goBack();
    } catch (error) {
      console.error('Error updating remains:', error);
      Alert.alert('오류', '남은 양 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!item) return;
    
    const confirmMessage = Platform.OS === 'web' 
      ? window.confirm(`"${item.name}"을(를) 소비 처리하시겠습니까?`)
      : true;

    if (Platform.OS !== 'web') {
      Alert.alert(
        '소비 확인',
        `"${item.name}"을(를) 소비 처리하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '소비', 
            onPress: async () => {
              await processConsume();
            }
          }
        ]
      );
    } else if (confirmMessage) {
      await processConsume();
    }
  };

  const processConsume = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      // Update item status to consumed and set remains to 0
      await inventoryService.updateItem(item.id, {
        status: 'consumed',
        remains: 0
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error consuming item:', error);
      Alert.alert('오류', '소비 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeze = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      await inventoryService.updateItem(item.id, {
        status: 'frozen',
        frozenDate: new Date()
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error freezing item:', error);
      Alert.alert('오류', '냉동 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispose = async () => {
    if (!item) return;
    
    const confirmMessage = Platform.OS === 'web' 
      ? window.confirm(`"${item.name}"을(를) 폐기 처리하시겠습니까?`)
      : true;

    if (Platform.OS !== 'web') {
      Alert.alert(
        '폐기 확인',
        `"${item.name}"을(를) 폐기 처리하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '폐기', 
            onPress: async () => {
              await processDispose();
            },
            style: 'destructive'
          }
        ]
      );
    } else if (confirmMessage) {
      await processDispose();
    }
  };

  const processDispose = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      await inventoryService.updateItem(item.id, {
        status: 'disposed',
        remains: 0
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error disposing item:', error);
      Alert.alert('오류', '폐기 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return (
      <Surface style={styles.container}>
        <Text>항목을 불러오는 중...</Text>
      </Surface>
    );
  }

  // Calculate D-day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let expiryDate: Date;
  if (item.storageDays && item.addedDate) {
    expiryDate = new Date(item.addedDate);
    expiryDate.setDate(expiryDate.getDate() + item.storageDays);
  } else {
    expiryDate = new Date(item.expiryDate);
  }
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dDayText = daysUntilExpiry < 0 
    ? `D+${Math.abs(daysUntilExpiry)}일`
    : daysUntilExpiry === 0 
    ? 'D-Day' 
    : `D-${daysUntilExpiry}일`;

  // Calculate frozen days if item is frozen
  let frozenDays = 0;
  let frozenDateFormatted = '';
  const isFrozen = item.status === 'frozen';
  if (isFrozen && item.frozenDate) {
    const frozenDate = new Date(item.frozenDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, 'MM/dd', { locale: ko });
  } else if (isFrozen && !item.frozenDate) {
    // If frozen but no frozen date, use added date as frozen date
    const frozenDate = new Date(item.addedDate);
    frozenDate.setHours(0, 0, 0, 0);
    // Add 1 to include today (day 0 for today)
    frozenDays = Math.floor((today.getTime() - frozenDate.getTime()) / (1000 * 60 * 60 * 24));
    frozenDateFormatted = format(frozenDate, 'MM/dd', { locale: ko });
  }

  return (
    <Surface style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBack}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {item.name}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Thumbnail Image */}
        <Surface style={styles.imageCard} elevation={1}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Text style={styles.placeholderText}>
                {item.name.charAt(0)}
              </Text>
            </View>
          )}
        </Surface>

        {/* Info Table Card */}
        <Surface style={styles.infoCard} elevation={1}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  등록일
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  {isFrozen ? '냉동중❄️' : '소비기한'}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="labelMedium" style={styles.headerText}>
                  수량
                </Text>
              </View>
            </View>
            
            {/* Table Data */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellSmall]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {format(item.addedDate, 'MM/dd', { locale: ko })}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLarge, styles.tableCellBorder]}>
                <View style={styles.expiryCell}>
                  {isFrozen ? (
                    <>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {frozenDateFormatted}부터
                      </Text>
                      <View style={styles.dDayContainer}>
                        <Text variant="bodyLarge" style={styles.dataText}>
                          {frozenDays}일
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text variant="bodySmall" style={styles.expiryDateText}>
                        {format(expiryDate, 'MM/dd', { locale: ko })}까지
                      </Text>
                      <View style={styles.dDayContainer}>
                        <Text variant="bodyLarge" style={styles.dataText}>
                          {dDayText}
                        </Text>
                        <IconButton
                          icon="help-circle-outline"
                          size={16}
                          onPress={() => setStorageInfoModalVisible(true)}
                          style={styles.helpIconSmall}
                          iconColor={Colors.text.secondary}
                        />
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View style={[styles.tableCell, styles.tableCellSmall, styles.tableCellBorder]}>
                <Text variant="bodyLarge" style={styles.dataText}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Remains Card */}
        <Surface style={styles.remainsCard} elevation={1}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              남은 양
            </Text>
            <Button
              mode="contained"
              onPress={handleUpdateRemains}
              loading={isLoading}
              disabled={isLoading || currentRemains >= Math.round((item.remains || 1) * 100)}
              style={styles.updateButton}
              compact
            >
              업데이트
            </Button>
          </View>
          <View style={styles.remainsContent}>
            <View style={styles.sliderRow}>
              <IconButton
                icon="minus"
                mode="contained"
                containerColor={Colors.primary.main}
                iconColor="white"
                size={20}
                onPress={() => {
                  const newValue = Math.max(0, currentRemains - 5);
                  handleSliderChange(newValue);
                }}
                disabled={currentRemains <= 0}
              />
              <View style={styles.percentageContainer}>
                <Text variant="titleLarge" style={styles.percentText}>
                  {currentRemains}%
                </Text>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${currentRemains}%` }
                    ]} 
                  />
                </View>
              </View>
              <IconButton
                icon="plus"
                mode="contained"
                containerColor={Colors.primary.main}
                iconColor="white"
                size={20}
                onPress={() => {
                  const originalRemains = Math.round((item.remains || 1) * 100);
                  const newValue = Math.min(originalRemains, currentRemains + 5);
                  handleSliderChange(newValue);
                }}
                disabled={currentRemains >= Math.round((item.remains || 1) * 100)}
              />
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionCard, styles.freezeCard]}
            onPress={handleFreeze}
            disabled={isLoading || isFrozen}
            activeOpacity={isFrozen ? 0.3 : 0.7}
          >
            <Surface style={[styles.actionCardContent, styles.freezeCardContent, isFrozen && styles.disabledCard]} elevation={2}>
              <IconButton
                icon="snowflake"
                size={28}
                iconColor={isFrozen ? "#CCCCCC" : "#2196F3"}
                style={styles.actionIcon}
              />
              <Text variant="labelMedium" style={[styles.actionText, { color: isFrozen ? "#CCCCCC" : "#2196F3" }]}>
                {isFrozen ? "냉동중" : "냉동"}
              </Text>
            </Surface>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, styles.disposeCard]}
            onPress={handleDispose}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Surface style={[styles.actionCardContent, styles.disposeCardContent]} elevation={2}>
              <IconButton
                icon="trash-can-outline"
                size={28}
                iconColor="#757575"
                style={styles.actionIcon}
              />
              <Text variant="labelMedium" style={[styles.actionText, { color: '#757575' }]}>
                폐기
              </Text>
            </Surface>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Storage Info Modal */}
      <Portal>
        <Dialog 
          visible={storageInfoModalVisible} 
          onDismiss={() => setStorageInfoModalVisible(false)}
        >
          <Dialog.Title>보관 정보</Dialog.Title>
          <Dialog.Content>
            {storageInfo ? (
              <>
                <Paragraph>
                  <Text style={{ fontWeight: 'bold' }}>권장 소비기간: </Text>
                  {storageInfo.storage_desc || `${storageInfo.storage_days}일`}
                </Paragraph>
                <Paragraph style={{ marginTop: 8 }}>
                  <Text style={{ fontWeight: 'bold' }}>보관 방법: </Text>
                  {storageInfo.storage_method || '냉장 보관하세요'}
                </Paragraph>
              </>
            ) : (
              <Paragraph>보관 정보를 불러오는 중...</Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStorageInfoModalVisible(false)}>확인</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  infoCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.background.level2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  tableCell: {
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellSmall: {
    flex: 3,
  },
  tableCellLarge: {
    flex: 4,
  },
  tableCellBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border.light,
  },
  headerText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
    textAlign: 'center',
  },
  dataText: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
  },
  expiryDateText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
    fontSize: 13,
  },
  expiryCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dDayInTable: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
  },
  helpIconSmall: {
    margin: 0,
    marginLeft: -4,
  },
  remainsCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,  // Reduced from Spacing.lg to reduce card height by 30%
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,  // Reduced spacing to make card more compact
  },
  cardTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  remainsContent: {
    width: '100%',
  },
  updateButton: {
    minWidth: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background.paper,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  content: {
    padding: Spacing.lg,
  },
  imageCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.level3,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 1,
  },
  placeholderText: {
    fontSize: 64,
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-SemiBold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  percentageContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  percentText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    marginBottom: Spacing.xs,  // Reduced spacing to compress height
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.background.level3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary.main,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
  },
  actionCardContent: {
    backgroundColor: Colors.primary.light,
    borderRadius: 16,
    paddingVertical: Spacing.md,  // Reduced from Spacing.lg to 70% height
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    margin: 0,
    marginBottom: 2,  // Reduced spacing
  },
  actionText: {
    fontFamily: 'OpenSans-SemiBold',
  },
  freezeCard: {
    flex: 1,
  },
  disposeCard: {
    flex: 1,
  },
  freezeCardContent: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
  },
  disposeCardContent: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    shadowColor: '#FF9800',
  },
  disabledCard: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    shadowOpacity: 0.05,
    opacity: 0.6,
  },
});