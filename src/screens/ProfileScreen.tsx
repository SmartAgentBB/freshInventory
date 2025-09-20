import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { Surface, Text, List, Button, Divider, Switch } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/AuthService';
import { supabaseClient } from '../services/supabaseClient';
import { notificationService } from '../services/NotificationService';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const authService = new AuthService(supabaseClient);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await notificationService.getSettings();
    setNotificationsEnabled(settings.enabled);
    const time = new Date();
    time.setHours(settings.time.hour);
    time.setMinutes(settings.time.minute);
    setNotificationTime(time);
  };

  const handleSignOut = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (user?.id) {
      await notificationService.toggleNotifications(value, user.id);
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && user?.id) {
      setNotificationTime(selectedDate);
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      await notificationService.updateNotificationTime(hour, minute, user.id);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? '오후' : '오전';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${period} ${displayHours}시 ${minutes.toString().padStart(2, '0')}분`;
  };


  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.content} elevation={0}>
        {/* 사용자 정보 */}
        <Surface style={styles.section} elevation={1}>
          <List.Item
            title="이메일"
            description={user?.email || ''}
            left={props => <List.Icon {...props} icon="email-outline" color={Colors.primary.main} />}
            style={styles.listItem}
          />
        </Surface>

        {/* 알림 설정 */}
        <Surface style={styles.section} elevation={1}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="titleMedium" style={styles.settingTitle}>
                소비기한 알림
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              color={Colors.primary.main}
            />
          </View>
          {notificationsEnabled && (
            <>
              <Divider />
              <List.Item
                title="알림 시간"
                description={formatTime(notificationTime)}
                left={props => <List.Icon {...props} icon="clock-outline" color={Colors.primary.main} />}
                onPress={() => setShowTimePicker(true)}
                style={styles.listItem}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.timeText}
              />
            </>
          )}
        </Surface>

        {/* 앱 정보 */}
        <Surface style={styles.section} elevation={1}>
          <List.Item
            title="버전 정보"
            description="v1.2.0"
            left={props => <List.Icon {...props} icon="information-outline" color={Colors.primary.main} />}
            style={styles.listItem}
          />
        </Surface>

        {showTimePicker && (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* 로그아웃 버튼 */}
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          textColor={Colors.primary.main}
          icon="logout"
        >
          로그아웃
        </Button>
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
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.background.default,
  },
  section: {
    backgroundColor: Colors.background.paper,
    borderRadius: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-SemiBold',
  },
  listTitle: {
    color: Colors.text.primary,
    fontFamily: 'OpenSans-Medium',
  },
  timeText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
  },
  logoutButton: {
    marginTop: Spacing.lg,
    borderColor: '#00897B', // 짙은 민트색
    borderRadius: 25, // Pill shape
  },
  logoutButtonContent: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
});