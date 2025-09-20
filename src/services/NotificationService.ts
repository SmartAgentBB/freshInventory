import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryService } from './InventoryService';
import { supabaseClient } from './supabaseClient';
import { differenceInDays, format, startOfDay, setHours, setMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_SETTINGS_KEY = '@ez2cook_notification_settings';
const NOTIFICATION_IDENTIFIER = 'daily-expiry-check';

interface NotificationSettings {
  enabled: boolean;
  time: { hour: number; minute: number };
  lastScheduledDate?: string;
}

export class NotificationService {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService(supabaseClient);
  }

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('알림은 실제 기기에서만 작동합니다.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }

    return true;
  }

  // 알림 설정 저장
  async saveSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }

  // 알림 설정 불러오기
  async getSettings(): Promise<NotificationSettings> {
    const settingsStr = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    // 기본값: 오후 12시
    return {
      enabled: true,
      time: { hour: 12, minute: 0 }
    };
  }

  // 만기/임박 식재료 확인
  async checkExpiringItems(userId: string) {
    const items = await this.inventoryService.getItems(userId, 'active');
    const today = startOfDay(new Date());

    const expired: string[] = [];
    const expiringSoon: string[] = [];
    const expiringToday: string[] = [];

    items.forEach(item => {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, today);

        if (daysUntilExpiry < 0) {
          expired.push(item.name);
        } else if (daysUntilExpiry === 0) {
          expiringToday.push(item.name);
        } else if (daysUntilExpiry <= 3) {
          expiringSoon.push(item.name);
        }
      }
    });

    return { expired, expiringToday, expiringSoon };
  }

  // 알림 내용 생성
  private createNotificationContent(expired: string[], expiringToday: string[], expiringSoon: string[]) {
    let title = '⚠냉파고 임박 재료 알림';
    let body = '빨리 소비해야하는 식재료가 있어요!\n';

    // 모든 임박/만료 식재료를 하나의 리스트로 통합
    const allItems: string[] = [];

    // 만료된 식재료 추가
    if (expired.length > 0) {
      allItems.push(...expired);
    }

    // 오늘 만료 식재료 추가
    if (expiringToday.length > 0) {
      allItems.push(...expiringToday);
    }

    // 3일 이내 임박 식재료 추가
    if (expiringSoon.length > 0) {
      allItems.push(...expiringSoon);
    }

    if (allItems.length === 0) {
      return null; // 알릴 내용이 없으면 null 반환
    }

    // 최대 10개까지만 표시
    const displayItems = allItems.slice(0, 10);
    body += displayItems.join(', ');

    if (allItems.length > 10) {
      body += ` 외 ${allItems.length - 10}개`;
    }

    return { title, body };
  }

  // 일일 알림 스케줄링
  async scheduleDailyNotification(userId: string): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const settings = await this.getSettings();
    if (!settings.enabled) return;

    // 기존 알림 취소
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER).catch(() => {});

    // 알림 시간 설정 (오늘 또는 내일)
    const now = new Date();
    let notificationTime = setMinutes(setHours(now, settings.time.hour), settings.time.minute);

    // 이미 지난 시간이면 내일로 설정
    if (notificationTime <= now) {
      notificationTime = new Date(notificationTime.getTime() + 24 * 60 * 60 * 1000);
    }

    // 알림 스케줄링
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠냉파고 임박 재료 알림',
        body: '빨리 소비해야하는 식재료가 있어요!',
        data: {
          userId,
          type: 'daily-check',
          navigateTo: 'inventory-expiring'
        },
        sound: true,
      },
      trigger: {
        hour: settings.time.hour,
        minute: settings.time.minute,
        repeats: true,
      },
      identifier: NOTIFICATION_IDENTIFIER,
    });

    // 설정 업데이트
    await this.saveSettings({
      ...settings,
      lastScheduledDate: format(new Date(), 'yyyy-MM-dd'),
    });

    console.log(`알림이 매일 ${settings.time.hour}시 ${settings.time.minute}분에 예약되었습니다.`);
  }

  // 즉시 알림 보내기 (테스트용)
  async sendImmediateNotification(userId: string): Promise<void> {
    const { expired, expiringToday, expiringSoon } = await this.checkExpiringItems(userId);
    const content = this.createNotificationContent(expired, expiringToday, expiringSoon);

    if (!content) {
      // 모든 식재료가 신선할 때는 알림을 보내지 않음
      console.log('모든 식재료가 신선합니다. 알림을 보내지 않습니다.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        ...content,
        data: {
          userId,
          type: 'immediate-check',
          navigateTo: 'inventory-expiring'
        },
        sound: true,
      },
      trigger: null,
    });
  }

  // 알림 활성화/비활성화
  async toggleNotifications(enabled: boolean, userId: string): Promise<void> {
    const settings = await this.getSettings();
    settings.enabled = enabled;
    await this.saveSettings(settings);

    if (enabled) {
      await this.scheduleDailyNotification(userId);
    } else {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER).catch(() => {});
    }
  }

  // 알림 시간 업데이트
  async updateNotificationTime(hour: number, minute: number, userId: string): Promise<void> {
    const settings = await this.getSettings();
    settings.time = { hour, minute };
    await this.saveSettings(settings);

    if (settings.enabled) {
      await this.scheduleDailyNotification(userId);
    }
  }

  // 알림 응답 리스너 설정
  setupNotificationListeners(navigation: any) {
    // 알림 클릭 시
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      if (data?.navigateTo === 'inventory-expiring') {
        // 재고목록 화면으로 이동하며 임박순 정렬 설정
        navigation.navigate('Inventory', {
          screen: 'InventoryList',
          params: {
            initialSortBy: 'expiry' // 임박순 정렬
          }
        });
      }
    });

    return subscription;
  }
}

export const notificationService = new NotificationService();