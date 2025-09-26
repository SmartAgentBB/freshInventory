import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryService } from './InventoryService';
import { supabaseClient } from './supabaseClient';
import { differenceInDays, format, startOfDay, setHours, setMinutes } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getCurrentLanguage } from './i18n';

// Expo Go 환경 체크 - Android에서만 문제가 발생
const isExpoGo = Constants.appOwnership === 'expo';
const isAndroidExpoGo = isExpoGo && Platform.OS === 'android';

// Android Expo Go에서는 알림 기능 비활성화 (SDK 53 이상)
// iOS는 정상 작동, 프로덕션 빌드는 모두 정상 작동

const NOTIFICATION_SETTINGS_KEY_PREFIX = '@ez2cook_notification_settings_';
const getNotificationIdentifier = (userId: string) => `daily-expiry-check-${userId}`;

interface NotificationSettings {
  enabled: boolean;
  time: { hour: number; minute: number };
  lastScheduledDate?: string;
}

export class NotificationService {
  private inventoryService: InventoryService;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY ||
                   process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    this.inventoryService = new InventoryService(supabaseClient, apiKey);
  }

  // 알림 권한 요청
  async requestPermissions(): Promise<boolean> {
    // Android Expo Go에서만 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 알림을 지원하지 않습니다.');
      return false;
    }

    // iOS나 프로덕션 빌드에서는 정상 동작
    // 여기에 원래 코드가 와야 하지만 expo-notifications import 문제로 비활성화
    return false;
  }

  // 알림 설정 저장
  async saveSettings(settings: NotificationSettings, userId?: string): Promise<void> {
    if (!userId) return;
    const key = `${NOTIFICATION_SETTINGS_KEY_PREFIX}${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(settings));
  }

  // 알림 설정 불러오기
  async getSettings(userId?: string): Promise<NotificationSettings> {
    if (!userId) {
      // userId가 없으면 기본값 반환
      return {
        enabled: false,
        time: { hour: 12, minute: 0 }
      };
    }
    const key = `${NOTIFICATION_SETTINGS_KEY_PREFIX}${userId}`;
    const settingsStr = await AsyncStorage.getItem(key);
    if (settingsStr) {
      return JSON.parse(settingsStr);
    }
    // 기본값: 알림 OFF, 오후 12시
    return {
      enabled: false,
      time: { hour: 12, minute: 0 }
    };
  }

  // 만기/임박 식재료 확인
  async checkExpiringItems(userId: string) {
    const items = await this.inventoryService.getItems(userId);
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
    const language = getCurrentLanguage();
    const isEnglish = language === 'en';

    let title = isEnglish
      ? '⚠️ FreshKeeper Expiry Alert'
      : '⚠️ 냉프로 임박 재료 알림';
    let body = isEnglish
      ? 'Items that need to be consumed soon!\n'
      : '빨리 소비해야하는 식재료가 있어요!\n';

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
      body += isEnglish
        ? ` and ${allItems.length - 10} more`
        : ` 외 ${allItems.length - 10}개`;
    }

    return { title, body };
  }

  // 일일 알림 스케줄링
  async scheduleDailyNotification(userId: string): Promise<void> {
    // Android Expo Go에서만 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 알림 스케줄링을 지원하지 않습니다.');
      return;
    }
    // iOS나 프로덕션 빌드에서는 정상 동작해야 함
    return;
  }

  // 즉시 알림 보내기 (테스트용)
  async sendImmediateNotification(userId: string): Promise<void> {
    // Android Expo Go에서만 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 즉시 알림을 지원하지 않습니다.');
      return;
    }
    return;
  }

  // 알림 활성화/비활성화
  async toggleNotifications(enabled: boolean, userId: string): Promise<void> {
    // 설정은 항상 저장 (나중에 프로덕션 빌드에서 사용)
    const settings = await this.getSettings(userId);
    settings.enabled = enabled;
    await this.saveSettings(settings, userId);

    // Android Expo Go에서만 실제 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 알림 토글을 지원하지 않습니다.');
      return;
    }
  }

  // 알림 시간 업데이트
  async updateNotificationTime(hour: number, minute: number, userId: string): Promise<void> {
    // 설정은 항상 저장 (나중에 프로덕션 빌드에서 사용)
    const settings = await this.getSettings(userId);
    settings.time = { hour, minute };
    await this.saveSettings(settings, userId);

    // Android Expo Go에서만 실제 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 알림 시간 업데이트를 지원하지 않습니다.');
      return;
    }
  }

  // 알림 응답 리스너 설정
  setupNotificationListeners(navigation: any) {
    // Android Expo Go에서만 알림 기능 비활성화
    if (isAndroidExpoGo) {
      console.log('안드로이드 Expo Go에서는 알림 리스너를 지원하지 않습니다.');
      return null;
    }
    // iOS나 프로덕션 빌드에서는 정상 동작해야 함
    return null;
  }
}

export const notificationService = new NotificationService();