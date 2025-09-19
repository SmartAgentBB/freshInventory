import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Checkbox,
  IconButton,
  Card,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { ShoppingService, ShoppingItem } from '../services/ShoppingService';
import { supabaseClient } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useIsFocused } from '@react-navigation/native';
import { format, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useShoppingCount } from '../contexts/ShoppingContext';

type TabType = 'shopping' | 'history';

// 장보기 탭 컴포넌트
const ShoppingListTab = () => {
  const [activeItems, setActiveItems] = useState<ShoppingItem[]>([]);
  const [completedItems, setCompletedItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingMemo, setEditingMemo] = useState('');
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { refreshCount } = useShoppingCount();

  const shoppingService = useMemo(() => {
    return new ShoppingService(supabaseClient);
  }, []);

  useEffect(() => {
    if (isFocused && user?.id) {
      loadShoppingList();
    }
  }, [isFocused, user?.id]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabaseClient
      .channel('shopping-list-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadShoppingList();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const loadShoppingList = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [active, completed] = await Promise.all([
        shoppingService.getActiveItems(user.id),
        shoppingService.getCompletedItems(user.id)
      ]);
      setActiveItems(active);
      setCompletedItems(completed);
      // 카운트 새로고침
      refreshCount();
    } catch (error) {
      console.error('Failed to load shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !user?.id) return;

    setAdding(true);
    const result = await shoppingService.addItem(user.id, newItemName.trim());

    if (result.success) {
      setNewItemName('');
      loadShoppingList();
    } else {
      Alert.alert('오류', result.error || '아이템 추가에 실패했습니다.');
    }
    setAdding(false);
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    // If trying to uncheck a completed item (make it active again)
    if (!item.todo) {
      // Check if the item already exists in active list
      const existingActiveItem = activeItems.find(
        activeItem => activeItem.name === item.name && activeItem.todo === true
      );

      if (existingActiveItem) {
        // Item already exists in active list, don't toggle and don't show error
        // Simply ignore the action silently
        return;
      }
    }

    const result = await shoppingService.toggleItem(item.id, !item.todo);
    if (result.success) {
      loadShoppingList();
    } else if (result.error?.includes('duplicate key')) {
      // If somehow the check above missed it, still handle the duplicate key error silently
      return;
    }
  };

  const handleStartEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingMemo(item.memo || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingMemo('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    const result = await shoppingService.updateItem(editingId, {
      name: editingName.trim(),
      memo: editingMemo.trim() || undefined
    });

    if (result.success) {
      setEditingId(null);
      setEditingName('');
      setEditingMemo('');
      loadShoppingList();
    } else {
      Alert.alert('오류', result.error || '수정에 실패했습니다.');
    }
  };

  const handleDeleteItem = async (item: ShoppingItem) => {
    console.log('Delete button clicked for item:', item.name, 'ID:', item.id);

    // 바로 삭제 처리
    const result = await shoppingService.deleteItem(item.id);
    if (result.success) {
      console.log('Item deleted successfully');
      await loadShoppingList();
    } else {
      console.error('Failed to delete item:', result.error);
      // 삭제 실패 시에만 에러 알림 표시
      if (Platform.OS === 'web') {
        alert('삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      } else {
        Alert.alert('오류', '삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return '오늘';
    } else if (isYesterday(date)) {
      return '어제';
    } else {
      return format(date, 'M월 d일 (EEE)', { locale: ko });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 쇼핑 목록 섹션 */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              쇼핑 목록
            </Text>
            <Text variant="bodySmall" style={styles.countText}>
              총 {activeItems.length}개
            </Text>
          </View>

          {/* 아이템 추가 입력창 */}
          <View style={styles.addItemContainer}>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="재료 이름을 입력하세요"
              placeholderTextColor="#9E9E9E"
              mode="outlined"
              style={styles.input}
              onSubmitEditing={handleAddItem}
              disabled={adding}
              dense
              contentStyle={styles.inputContent}
            />
            <Button
              mode={!newItemName.trim() ? "outlined" : "contained"}
              onPress={handleAddItem}
              loading={adding}
              disabled={adding || !newItemName.trim()}
              style={[
                styles.addButton,
                !newItemName.trim() && styles.addButtonDisabled
              ]}
              labelStyle={styles.addButtonLabel}
              contentStyle={styles.addButtonContent}
              compact
            >
              추가
            </Button>
          </View>

          <Divider style={styles.divider} />

          {/* 활성 아이템 목록 */}
          {activeItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                쇼핑 목록이 비어있습니다
              </Text>
            </View>
          ) : (
            activeItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={[
                    styles.checkboxWrapper,
                    !item.todo && styles.checkboxWrapperChecked
                  ]}
                  onPress={() => handleToggleItem(item)}
                  activeOpacity={0.7}
                >
                  {!item.todo && (
                    <Icon name="check" size={20} color="white" />
                  )}
                  {item.todo && (
                    <View style={styles.emptyCheckbox} />
                  )}
                </TouchableOpacity>
                {editingId === item.id ? (
                  <View style={styles.editingContent}>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      mode="flat"
                      dense
                      style={styles.editInput}
                      placeholder="재료 이름"
                      autoFocus
                    />
                    <TextInput
                      value={editingMemo}
                      onChangeText={setEditingMemo}
                      mode="flat"
                      dense
                      style={[styles.editInput, styles.memoInput]}
                      placeholder="메모 (선택)"
                    />
                    <View style={styles.editButtons}>
                      <IconButton
                        icon="check"
                        size={20}
                        iconColor={Colors.primary.main}
                        onPress={handleSaveEdit}
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor={Colors.text.secondary}
                        onPress={handleCancelEdit}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => handleStartEdit(item)}
                  >
                    <Text variant="bodyMedium" style={styles.itemName}>
                      {item.name}
                    </Text>
                    {item.memo && (
                      <Text variant="bodySmall" style={styles.itemMemo}>
                        {item.memo}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                {editingId !== item.id && (
                  <>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {formatDate(item.update_date)}
                    </Text>
                    <IconButton
                      icon="trash-can-outline"
                      size={20}
                      iconColor={Colors.text.secondary}
                      onPress={() => handleDeleteItem(item)}
                    />
                  </>
                )}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* 완료한 쇼핑 섹션 */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            완료한 쇼핑
          </Text>

          <Divider style={styles.divider} />

          {completedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                완료한 쇼핑이 없습니다
              </Text>
            </View>
          ) : (
            completedItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={[
                    styles.checkboxWrapper,
                    styles.checkboxWrapperChecked
                  ]}
                  onPress={() => handleToggleItem(item)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name="check"
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <View style={styles.itemContent}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.itemName, styles.completedItem]}
                  >
                    {item.name}
                  </Text>
                  {item.memo && (
                    <Text
                      variant="bodySmall"
                      style={[styles.itemMemo, styles.completedItem]}
                    >
                      {item.memo}
                    </Text>
                  )}
                </View>
                <Text variant="bodySmall" style={styles.dateText}>
                  {formatDate(item.update_date)}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// 지난 기록 탭 컴포넌트
const HistoryTab = () => {
  const [historyItems, setHistoryItems] = useState<ShoppingItem[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const shoppingService = useMemo(() => {
    return new ShoppingService(supabaseClient);
  }, []);

  useEffect(() => {
    if (isFocused && user?.id) {
      loadHistory();
    }
  }, [isFocused, user?.id, currentYear, currentMonth]);

  const loadHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const history = await shoppingService.getHistoryByMonth(
        user.id,
        currentYear,
        currentMonth
      );
      setHistoryItems(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 날짜별로 그룹화
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: ShoppingItem[] } = {};

    historyItems.forEach((item) => {
      const dateKey = format(new Date(item.update_date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [historyItems]);

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks = [];
    const today = format(new Date(), 'yyyy-MM-dd');

    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        days.push({
          date: currentDate.getDate(),
          dateString: dateStr,
          isCurrentMonth: currentDate.getMonth() === currentMonth,
          isToday: dateStr === today,
          isSunday: day === 0,
          isSaturday: day === 6,
          hasActivity: !!groupedHistory[dateStr],
          items: groupedHistory[dateStr] || []
        });
      }
      weeks.push(days);
    }

    return weeks;
  }, [currentYear, currentMonth, groupedHistory]);


  // 이번 달의 모든 히스토리 (날짜별로 정렬)
  const monthlyHistory = useMemo(() => {
    return Object.entries(groupedHistory)
      .filter(([dateStr]) => {
        const date = new Date(dateStr);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
      })
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, items]) => ({
        date: dateStr,
        items: items.filter((item, index, self) =>
          index === self.findIndex((i) => i.name === item.name)
        )
      }));
  }, [groupedHistory, currentYear, currentMonth]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.historyInfo}>
        <Text variant="bodySmall" style={styles.historyInfoText}>
          완료한 장보기 기록을 확인하세요.
        </Text>
      </View>

      {/* 달력 카드 */}
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          {/* 달력 헤더 */}
          <View style={styles.calendarHeader}>
            <IconButton
              icon="chevron-left"
              onPress={handlePrevMonth}
              size={24}
            />
            <Text variant="titleMedium" style={styles.monthTitle}>
              {currentYear}년 {currentMonth + 1}월
            </Text>
            <IconButton
              icon="chevron-right"
              onPress={handleNextMonth}
              size={24}
            />
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <Text
                key={day}
                variant="bodySmall"
                style={[
                  styles.weekDay,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* 달력 그리드 */}
          {calendarData.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    day.isToday && styles.todayCell,
                    day.hasActivity && styles.activityCell
                  ]}
                >
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      day.isToday && styles.todayText,
                      day.isSunday && day.isCurrentMonth && styles.sundayText,
                      day.isSaturday && day.isCurrentMonth && styles.saturdayText
                    ]}
                  >
                    {day.date}
                  </Text>
                  {day.hasActivity && (
                    <View style={styles.activityDot} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* 이번 달 전체 기록 */}
      {monthlyHistory.length === 0 ? (
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              이번 달에 완료한 장보기가 없습니다.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Surface style={styles.monthlyHeader} elevation={0}>
            <Text variant="titleMedium" style={styles.monthlyTitle}>
              {currentMonth + 1}월 장보기 기록
            </Text>
          </Surface>
          {monthlyHistory.map(({ date, items }) => {
            const formattedDate = format(new Date(date), 'M월 d일 (EEE)', { locale: ko });
            return (
              <Card key={date} style={styles.card} mode="outlined">
                <Card.Content>
                  <View style={styles.historyDateHeader}>
                    <Text variant="titleSmall" style={styles.historyDate}>
                      {formattedDate}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={styles.historyItems}>
                    {items.map((item) => item.name).join(', ')}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </>
      )}
    </ScrollView>
  );
};

// 메인 ShoppingScreen
export const ShoppingScreen = () => {
  const [activeTab, setActiveTab] = useState<TabType>('shopping');

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
    <View style={styles.mainContainer}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton tab="shopping" label="장보기" />
          <TabButton tab="history" label="지난 기록" />
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'shopping' ? <ShoppingListTab /> : <HistoryTab />}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  countText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
  },
  addItemContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.default,
    height: 36,
  },
  inputContent: {
    paddingVertical: 6,
    fontSize: 14,
  },
  addButton: {
    justifyContent: 'center',
    borderRadius: 24,
    minWidth: 80,
    height: 36,
  },
  addButtonDisabled: {
    borderColor: Colors.text.secondary,
  },
  addButtonLabel: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 14,
  },
  addButtonContent: {
    height: 36,
    paddingHorizontal: 16,
  },
  divider: {
    marginVertical: Spacing.sm,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minHeight: 44,
  },
  checkboxWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#9E9E9E',
  },
  checkboxWrapperChecked: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  itemContent: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  itemName: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Regular',
  },
  itemMemo: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  dateText: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
    marginRight: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
  historyDateHeader: {
    backgroundColor: Colors.background.level2,
    marginHorizontal: -Spacing.md,
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  historyDate: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-SemiBold',
  },
  historyItems: {
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Regular',
    lineHeight: 24,
  },
  editingContent: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  editInput: {
    backgroundColor: Colors.background.paper,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 4,
  },
  memoInput: {
    fontSize: 12,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  weekHeader: {
    flexDirection: 'row',
    marginTop: 4,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text.secondary,
    fontFamily: 'OpenSans-Medium',
    fontSize: 11,
  },
  weekRow: {
    flexDirection: 'row',
    marginVertical: 0,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 1,
    marginVertical: 0.5,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: Colors.primary.light + '20',
  },
  activityCell: {
    backgroundColor: Colors.background.level2,
  },
  dayText: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Regular',
    fontSize: 12,
  },
  otherMonthText: {
    color: Colors.text.disabled,
  },
  todayText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-SemiBold',
    fontWeight: '600',
  },
  sundayText: {
    color: '#FF5252',
  },
  saturdayText: {
    color: '#2196F3',
  },
  activityDot: {
    position: 'absolute',
    bottom: 1,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF5252',
  },
  monthlyHeader: {
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  monthlyTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Bold',
  },
});