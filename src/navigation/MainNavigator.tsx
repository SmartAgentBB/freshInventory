import React, { useEffect, useRef } from 'react';
import { BottomTabNavigation } from './BottomTabNavigation';
import { ShoppingProvider } from '../contexts/ShoppingContext';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/NotificationService';
import { useAuth } from '../hooks/useAuth';

// Export the type from InventoryStackNavigator for backwards compatibility
export { InventoryStackParamList as RootStackParamList } from './InventoryStackNavigator';

export const MainNavigator = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const notificationSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    // 알림 리스너 설정
    if (user?.id) {
      notificationSubscriptionRef.current = notificationService.setupNotificationListeners(navigation);

      // 알림 설정이 활성화되어 있는 경우에만 스케줄링
      // (사용자가 프로필에서 직접 설정을 변경할 때 스케줄링됨)
      notificationService.getSettings(user.id).then(settings => {
        if (settings.enabled) {
          notificationService.scheduleDailyNotification(user.id);
        }
      });
    }

    return () => {
      // 컴포넌트 언마운트 시 리스너 제거
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.remove();
      }
    };
  }, [user?.id, navigation]);

  return (
    <ShoppingProvider>
      <BottomTabNavigation />
    </ShoppingProvider>
  );
};