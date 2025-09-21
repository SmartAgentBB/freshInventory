# 냉파고 앱 광고 통합 계획

## 1단계: AppLovin MAX 설정 (Day 1)

### 1.1 계정 설정
```bash
# AppLovin 계정 생성
# https://www.applovin.com/max/

# 앱 등록
# - Android: com.shinysun0.naengpago
# - iOS: com.shinysun0.freshinventory
```

### 1.2 패키지 설치
```bash
# AppLovin MAX React Native SDK 설치
npm install react-native-applovin-max

# iOS 설정 (Mac 환경)
cd ios && pod install
```

## 2단계: 광고 컴포넌트 구현 (Day 2)

### 2.1 광고 매니저 서비스 생성
```typescript
// src/services/AdService.ts
import AppLovinMAX from 'react-native-applovin-max';

export class AdService {
  private static instance: AdService;
  private interstitialAdUnitId: string;
  private isInitialized = false;
  private retryAttempt = 0;

  constructor() {
    // Platform-specific Ad Unit IDs
    this.interstitialAdUnitId = Platform.select({
      ios: 'YOUR_IOS_INTERSTITIAL_AD_UNIT_ID',
      android: 'YOUR_ANDROID_INTERSTITIAL_AD_UNIT_ID',
    }) || '';
  }

  static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize SDK
      await AppLovinMAX.initialize('YOUR_SDK_KEY');

      // Set up ad listeners
      this.setupAdListeners();

      // Preload first ad
      this.loadInterstitial();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ads:', error);
    }
  }

  private setupAdListeners(): void {
    AppLovinMAX.addEventListener('OnInterstitialLoadedEvent', () => {
      console.log('Interstitial ad loaded');
      this.retryAttempt = 0;
    });

    AppLovinMAX.addEventListener('OnInterstitialLoadFailedEvent', () => {
      this.retryAttempt++;
      const retryDelay = Math.pow(2, Math.min(6, this.retryAttempt));

      setTimeout(() => {
        this.loadInterstitial();
      }, retryDelay * 1000);
    });

    AppLovinMAX.addEventListener('OnInterstitialHiddenEvent', () => {
      this.loadInterstitial(); // Preload next ad
    });
  }

  private loadInterstitial(): void {
    AppLovinMAX.loadInterstitial(this.interstitialAdUnitId);
  }

  async showInterstitialAd(): Promise<boolean> {
    const isReady = await AppLovinMAX.isInterstitialReady(this.interstitialAdUnitId);

    if (isReady) {
      AppLovinMAX.showInterstitial(this.interstitialAdUnitId);
      return true;
    }

    // If ad not ready, load it for next time
    this.loadInterstitial();
    return false;
  }
}
```

### 2.2 로딩 화면 컴포넌트
```typescript
// src/components/LoadingWithAd.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, Surface } from 'react-native-paper';
import { AdService } from '../services/AdService';

interface LoadingWithAdProps {
  message: string;
  onAdClosed?: () => void;
  minLoadingTime?: number; // Minimum loading time in ms
}

export const LoadingWithAd: React.FC<LoadingWithAdProps> = ({
  message,
  onAdClosed,
  minLoadingTime = 2000
}) => {
  const [showingAd, setShowingAd] = useState(false);
  const adService = AdService.getInstance();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const showAd = async () => {
      // Wait minimum loading time before showing ad
      timeoutId = setTimeout(async () => {
        const adShown = await adService.showInterstitialAd();
        setShowingAd(adShown);

        if (!adShown && onAdClosed) {
          onAdClosed();
        }
      }, minLoadingTime);
    };

    showAd();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (showingAd) {
    return null; // Ad is showing fullscreen
  }

  return (
    <Surface style={styles.container} elevation={2}>
      <ActivityIndicator size="large" color="#26A69A" />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>광고를 불러오는 중...</Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
```

## 3단계: AI 기능에 광고 통합 (Day 3)

### 3.1 이미지 분석 시 광고 표시
```typescript
// CameraScreen.tsx 수정
const handleImageAnalysis = async (imageUri: string) => {
  setShowLoadingAd(true);

  try {
    // Start image analysis
    const analysisPromise = aiService.analyzeImage(imageUri);

    // Show ad while analyzing
    await adService.showInterstitialAd();

    // Wait for analysis to complete
    const result = await analysisPromise;

    // Process results
    handleAnalysisResult(result);
  } finally {
    setShowLoadingAd(false);
  }
};
```

### 3.2 요리 추천 시 광고 표시
```typescript
// CookingScreen.tsx 수정
const handleRecommend = async () => {
  setRecommending(true);
  setShowLoadingAd(true);

  try {
    // Start recipe generation
    const recipePromise = aiService.generateRecipeSuggestions(
      ingredientInfo,
      cookingStyleInput
    );

    // Show ad while generating
    await adService.showInterstitialAd();

    // Wait for recipes
    const result = await recipePromise;

    // Display results
    setRecommendations(result.recipes);
  } finally {
    setRecommending(false);
    setShowLoadingAd(false);
  }
};
```

## 4단계: 광고 정책 및 UX 최적화 (Day 4)

### 4.1 광고 빈도 제한
```typescript
// src/services/AdFrequencyManager.ts
export class AdFrequencyManager {
  private lastAdTime: number = 0;
  private adCount: number = 0;
  private readonly MIN_INTERVAL = 60000; // 1분
  private readonly MAX_ADS_PER_SESSION = 10;

  canShowAd(): boolean {
    const now = Date.now();

    // Check time interval
    if (now - this.lastAdTime < this.MIN_INTERVAL) {
      return false;
    }

    // Check session limit
    if (this.adCount >= this.MAX_ADS_PER_SESSION) {
      return false;
    }

    return true;
  }

  recordAdShown(): void {
    this.lastAdTime = Date.now();
    this.adCount++;
  }
}
```

### 4.2 사용자 설정
```typescript
// src/screens/SettingsScreen.tsx
const AdSettings = () => {
  const [adsEnabled, setAdsEnabled] = useState(true);

  return (
    <Surface style={styles.section}>
      <Text variant="titleMedium">광고 설정</Text>
      <View style={styles.row}>
        <Text>개인화 광고 허용</Text>
        <Switch
          value={adsEnabled}
          onValueChange={setAdsEnabled}
        />
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        광고 수익은 앱 개선에 사용됩니다
      </Text>
    </Surface>
  );
};
```

## 5단계: 테스트 및 배포 (Day 5)

### 5.1 테스트 모드 설정
```typescript
// App.tsx
useEffect(() => {
  const initializeAds = async () => {
    const adService = AdService.getInstance();

    // Enable test mode in development
    if (__DEV__) {
      AppLovinMAX.setTestDeviceAdvertisingIds([
        'YOUR_TEST_DEVICE_ID' // Get from console logs
      ]);
    }

    await adService.initialize();
  };

  initializeAds();
}, []);
```

### 5.2 광고 수익 모니터링
```typescript
// Analytics tracking
const trackAdRevenue = (adInfo: any) => {
  analytics.track('ad_impression', {
    ad_unit_id: adInfo.adUnitId,
    revenue: adInfo.revenue,
    network_name: adInfo.networkName,
    placement: adInfo.placement,
  });
};
```

## 예상 수익 모델

### 월간 예상 수익 (1,000 MAU 기준)
- **평균 세션당 광고 노출**: 2-3회
- **eCPM (1,000 노출당 수익)**: $5-15 (한국 시장)
- **예상 월 수익**: $300-1,500

### 수익 최적화 전략
1. **프리미엄 구독 옵션**: 광고 제거 + 추가 기능
2. **보상형 광고**: 추가 AI 분석 횟수 제공
3. **네이티브 광고**: 레시피 목록에 자연스럽게 삽입

## 주의사항

### 법적 준수사항
- GDPR/KISA 개인정보 보호 정책 준수
- 어린이 대상 광고 정책 확인
- 광고 표시 명확히 구분

### UX 고려사항
- 광고 로딩 실패 시 graceful fallback
- 네트워크 오프라인 처리
- 광고 스킵 옵션 제공 (5초 후)

## 타임라인

| 단계 | 작업 내용 | 소요 시간 |
|------|-----------|-----------|
| Day 1 | AppLovin 계정 설정 및 SDK 설치 | 4시간 |
| Day 2 | 광고 서비스 구현 | 6시간 |
| Day 3 | AI 기능 통합 | 4시간 |
| Day 4 | UX 최적화 및 설정 | 3시간 |
| Day 5 | 테스트 및 배포 준비 | 3시간 |
| **총계** | **전체 구현** | **20시간** |

## 다음 단계

1. AppLovin 계정 생성 및 앱 등록
2. Test Ad Unit ID 발급
3. 개발 환경에서 테스트 구현
4. 수익 정책 및 가격 모델 확정
5. 프로덕션 배포