# 🌍 냉파고 앱 다국어 지원 개발 계획

## 📋 개요
냉파고 앱을 글로벌 서비스로 확장하기 위한 다국어 지원 시스템 구축 계획입니다.

### 목표
- **1단계**: 한국어(KO), 영어(EN) 지원
- **2단계**: 일본어(JA), 중국어(ZH) 추가 (추후)
- **3단계**: 유럽권 언어 추가 (추후)

---

## 🏗️ 아키텍처 설계

### 1. 기술 스택 선정

#### **i18n 라이브러리: react-i18next** ✅
```json
{
  "장점": [
    "React Native 완벽 지원",
    "Expo 호환성 우수",
    "커뮤니티 활발",
    "TypeScript 지원",
    "동적 언어 변경 지원",
    "Lazy loading 지원"
  ],
  "패키지": [
    "react-i18next",
    "i18next",
    "i18next-react-native-async-storage"
  ]
}
```

### 2. 데이터베이스 스키마 설계

#### **users 테이블 수정**
```sql
-- 기존 users 테이블에 컬럼 추가
ALTER TABLE users
ADD COLUMN language VARCHAR(5) DEFAULT 'ko';
-- ko, en, ja, zh, es, fr 등

-- 인덱스 추가 (선택사항)
CREATE INDEX idx_users_language ON users(language);
```

#### **storage_info 테이블 다국어 지원** ✅ **간단한 방식 채택**

```sql
-- storage_info 테이블에 language 컬럼 추가
ALTER TABLE storage_info
ADD COLUMN language VARCHAR(5) DEFAULT 'ko';

-- 인덱스 추가 (name + language 조합으로 빠른 검색)
CREATE INDEX idx_storage_info_name_lang ON storage_info(name, language);

-- 샘플 데이터 (한국어)
INSERT INTO storage_info (name, category, storage_days, storage_desc, storage_method, language)
VALUES
('양파', 'vegetable', 30,
 '서늘하고 건조한 곳에 보관하면 1개월 이상 보관 가능합니다.',
 '통풍이 잘 되는 그물망이나 바구니에 보관. 냉장고에는 다른 식품과 분리하여 비닐봉지에 보관.',
 'ko'),
('당근', 'vegetable', 14,
 '냉장 보관 시 2주 이상 신선도 유지가 가능합니다.',
 '잎은 제거 후 흙을 털어내고 신문지에 싸서 냉장고 야채칸에 보관.',
 'ko');

-- 샘플 데이터 (영어)
INSERT INTO storage_info (name, category, storage_days, storage_desc, storage_method, language)
VALUES
('onion', 'vegetable', 30,
 'Can be stored for over a month in a cool, dry place.',
 'Store in a well-ventilated mesh bag or basket. In the fridge, separate from other foods in a plastic bag.',
 'en'),
('carrot', 'vegetable', 14,
 'Can maintain freshness for over 2 weeks when refrigerated.',
 'Remove leaves, shake off soil, wrap in newspaper and store in vegetable drawer.',
 'en');
```

**장점:**
- 구조가 간단하고 직관적
- name으로 직접 검색 가능 ("양파" vs "onion")
- 별도 JOIN 불필요
- 성능 우수

#### **다국어 데이터 관리 방식**

**Option 1: 정적 데이터 (추천)** ✅
- 메뉴, UI 텍스트: JSON 파일로 관리
- 장점: 빠른 로딩, 오프라인 지원

**Option 2: 동적 데이터**
- 식재료명, 레시피: API 응답에 언어 코드 포함
```typescript
// API 응답 예시
{
  "ingredient": {
    "id": 1,
    "name": {
      "ko": "양파",
      "en": "Onion"
    },
    "category": "vegetable"
  }
}
```

### 3. 폴더 구조

```
src/
├── locales/
│   ├── ko/
│   │   ├── common.json      # 공통 UI 텍스트
│   │   ├── inventory.json    # 재고 관련
│   │   ├── cooking.json      # 요리 관련
│   │   ├── shopping.json     # 장보기 관련
│   │   ├── profile.json      # 프로필 관련
│   │   └── storage.json      # 보관 정보 관련
│   ├── en/
│   │   ├── common.json
│   │   ├── inventory.json
│   │   ├── cooking.json
│   │   ├── shopping.json
│   │   ├── profile.json
│   │   └── storage.json
│   └── index.ts             # 언어 리소스 export
├── services/
│   ├── i18n.ts              # i18n 설정
│   └── StorageService.ts    # 보관 정보 다국어 서비스
└── hooks/
    └── useTranslation.ts    # 커스텀 훅
```

---

## 🔧 구현 계획

### Phase 1: 기반 시스템 구축 (Day 1-2)

#### 1.1 라이브러리 설치 및 설정
```bash
npm install i18next react-i18next i18next-react-native-async-storage
npm install --save-dev @types/i18next
```

#### 1.2 i18n 서비스 구현
```typescript
// src/services/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ko from '../locales/ko';
import en from '../locales/en';

const resources = {
  ko: { translation: ko },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'ko', // 기본 언어
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// 언어 변경 함수
export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem('user_language', lang);
  await i18n.changeLanguage(lang);
};

export default i18n;
```

#### 1.3 언어 파일 생성
```json
// src/locales/ko/common.json
{
  "app": {
    "name": "냉파고",
    "tagline": "냉장고 파먹기 도우미"
  },
  "navigation": {
    "inventory": "재고",
    "cooking": "요리",
    "shopping": "장보기",
    "profile": "마이"
  },
  "buttons": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "add": "추가",
    "confirm": "확인"
  },
  "messages": {
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "success": "성공적으로 완료되었습니다",
    "noData": "데이터가 없습니다"
  }
}

// src/locales/en/common.json
{
  "app": {
    "name": "FreshKeeper",
    "tagline": "Smart Fridge Manager"
  },
  "navigation": {
    "inventory": "Inventory",
    "cooking": "Recipes",
    "shopping": "Shopping",
    "profile": "Profile"
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "confirm": "Confirm"
  },
  "messages": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Successfully completed",
    "noData": "No data available"
  }
}
```

### Phase 2: UI 컴포넌트 다국어화 (Day 3-4)

#### 2.1 컴포넌트 수정 예시
```typescript
// Before
<Text>재고가 없습니다</Text>

// After
import { useTranslation } from 'react-i18next';

const InventoryScreen = () => {
  const { t } = useTranslation();

  return (
    <Text>{t('inventory.emptyMessage')}</Text>
  );
};
```

#### 2.2 동적 텍스트 처리
```typescript
// 수량 표시
t('inventory.quantity', { count: 5 }) // "5개" or "5 items"

// 날짜 표시
t('inventory.expiryDate', { date: new Date() })
```

### Phase 3: 사용자 설정 기능 (Day 5)

#### 3.1 프로필 화면 언어 선택기
```typescript
// src/screens/ProfileScreen.tsx
import { changeLanguage } from '../services/i18n';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    await changeLanguage(lang);

    // Supabase 업데이트
    await supabase
      .from('users')
      .update({ language: lang })
      .eq('id', userId);
  };

  return (
    <Surface style={styles.section}>
      <Text variant="titleMedium">{t('profile.language')}</Text>
      <RadioButton.Group
        onValueChange={handleLanguageChange}
        value={language}
      >
        {languages.map(lang => (
          <RadioButton.Item
            key={lang.code}
            label={`${lang.flag} ${lang.name}`}
            value={lang.code}
          />
        ))}
      </RadioButton.Group>
    </Surface>
  );
};
```

### Phase 4: AI 서비스 다국어화 (Day 6)

#### 4.1 AI 프롬프트 언어별 처리
```typescript
// src/services/AIService.ts
class AIService {
  generatePrompt(language: string, ingredients: string[]) {
    const prompts = {
      ko: `다음 재료로 만들 수 있는 한국 요리를 추천해주세요: ${ingredients.join(', ')}`,
      en: `Suggest recipes using these ingredients: ${ingredients.join(', ')}`
    };

    return prompts[language] || prompts.ko;
  }
}
```

#### 4.2 StorageService 다국어 지원 (간소화)
```typescript
// src/services/StorageService.ts
export class StorageService {
  private supabase: SupabaseClient;
  private currentLanguage: string;

  constructor(supabase: SupabaseClient, language: string = 'ko') {
    this.supabase = supabase;
    this.currentLanguage = language;
  }

  async getStorageInfo(itemName: string): Promise<StorageInfo | null> {
    // 현재 언어에 맞는 name으로 검색
    // 예: 한국어 사용자는 "양파", 영어 사용자는 "onion"으로 검색
    const { data: storageInfo, error } = await this.supabase
      .from('storage_info')
      .select('*')
      .eq('name', itemName)
      .eq('language', this.currentLanguage)
      .single();

    if (error || !storageInfo) {
      // Fallback: 언어 관계없이 name으로 검색 (기본값)
      const { data: fallback } = await this.supabase
        .from('storage_info')
        .select('*')
        .eq('name', itemName)
        .single();

      return fallback;
    }

    return storageInfo;
  }

  // 식재료명 번역 헬퍼 (선택사항)
  translateIngredientName(koreanName: string): string {
    const translations: { [key: string]: { [lang: string]: string } } = {
      '양파': { en: 'onion', ko: '양파' },
      '당근': { en: 'carrot', ko: '당근' },
      '감자': { en: 'potato', ko: '감자' },
      // ... 더 많은 번역
    };

    return translations[koreanName]?.[this.currentLanguage] || koreanName;
  }

  setLanguage(language: string) {
    this.currentLanguage = language;
  }
}
```

#### 4.3 ItemDetailScreen 다국어 적용
```typescript
// src/screens/ItemDetailScreen.tsx
const ItemDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const [storageInfo, setStorageInfo] = useState(null);
  const storageService = useMemo(
    () => new StorageService(supabaseClient, i18n.language),
    [i18n.language]
  );

  useEffect(() => {
    loadStorageInfo();
  }, [item.name, i18n.language]); // 언어 변경 시 리로드

  const loadStorageInfo = async () => {
    // 언어에 따라 적절한 이름으로 검색
    const searchName = i18n.language === 'en'
      ? storageService.translateIngredientName(item.name)
      : item.name;

    const info = await storageService.getStorageInfo(searchName);
    setStorageInfo(info);
  };

  return (
    <View>
      {/* 보관 기간 - 숫자는 언어 관계없이 동일 */}
      <Text>{storageInfo?.storage_days} {t('common.days')}</Text>

      {/* 보관 설명 - DB에서 언어별 텍스트 */}
      <View style={styles.infoSection}>
        <IconButton icon="help-circle" size={16} />
        <Text>{storageInfo?.storage_desc}</Text>
      </View>

      {/* 보관 방법 - DB에서 언어별 텍스트 */}
      <Text>{storageInfo?.storage_method}</Text>
    </View>
  );
};
```

#### 4.4 식재료 번역 데이터베이스
```sql
-- food_translations 테이블 생성
CREATE TABLE food_translations (
  id SERIAL PRIMARY KEY,
  food_id INTEGER REFERENCES foods(id),
  language VARCHAR(5),
  name VARCHAR(100),
  UNIQUE(food_id, language)
);

-- 샘플 데이터
INSERT INTO food_translations (food_id, language, name) VALUES
(1, 'ko', '양파'),
(1, 'en', 'Onion'),
(2, 'ko', '당근'),
(2, 'en', 'Carrot');
```

### Phase 5: 테스트 및 최적화 (Day 7)

#### 5.1 테스트 시나리오
```typescript
describe('다국어 지원 테스트', () => {
  it('언어 변경 시 UI 업데이트', async () => {
    await changeLanguage('en');
    expect(screen.getByText('Inventory')).toBeTruthy();

    await changeLanguage('ko');
    expect(screen.getByText('재고')).toBeTruthy();
  });

  it('사용자 설정 저장', async () => {
    await changeLanguage('en');
    const user = await getUserSettings();
    expect(user.language).toBe('en');
  });
});
```

---

## 📊 구현 우선순위

### 🔴 필수 (MVP)
1. ✅ i18n 기본 설정
2. ✅ 네비게이션 메뉴 번역
3. ✅ 주요 화면 텍스트 번역
4. ✅ 언어 선택 기능
5. ✅ 사용자 설정 저장
6. ✅ storage_info 다국어 지원

### 🟡 중요
1. ⏳ 식재료명 번역
2. ⏳ 에러 메시지 번역
3. ⏳ 날짜/시간 형식 현지화
4. ⏳ 숫자 형식 현지화

### 🟢 선택
1. ⏳ AI 응답 번역
2. ⏳ 푸시 알림 번역
3. ⏳ 이메일 템플릿 번역

---

## 🚀 예상 일정

| 단계 | 작업 내용 | 소요 시간 | 우선순위 |
|------|-----------|-----------|----------|
| Day 1-2 | i18n 설정 및 기본 구조 | 8시간 | 🔴 필수 |
| Day 3-4 | UI 컴포넌트 번역 | 12시간 | 🔴 필수 |
| Day 5 | 언어 선택 기능 | 4시간 | 🔴 필수 |
| Day 6 | storage_info 다국어 지원 | 4시간 | 🔴 필수 |
| Day 7 | AI 서비스 다국어화 | 6시간 | 🟡 중요 |
| Day 8 | 테스트 및 버그 수정 | 4시간 | 🔴 필수 |
| **Total** | **전체 구현** | **38시간** | - |

---

## 🌐 향후 확장 계획

### 추가 언어 지원 로드맵
```
2025 Q1: 한국어, 영어
2025 Q2: 일본어, 중국어(간체)
2025 Q3: 스페인어, 프랑스어
2025 Q4: 독일어, 이탈리아어
```

### 현지화 고려사항
1. **문화적 차이**
   - 식재료 단위 (g/kg vs lb/oz)
   - 날짜 형식 (YYYY-MM-DD vs MM/DD/YYYY)
   - 통화 표시 (₩ vs $)

2. **콘텐츠 현지화**
   - 레시피 추천 (한식 vs 서양식)
   - 식재료 카테고리
   - 알림 시간대

3. **기술적 고려**
   - RTL 언어 지원 (아랍어, 히브리어)
   - 폰트 지원
   - 텍스트 길이 차이

---

## ✅ 체크리스트

### 개발 전 준비
- [ ] i18n 라이브러리 선정 완료
- [ ] 번역 키 네이밍 규칙 정의
- [ ] 언어 코드 표준 선택 (ISO 639-1)
- [ ] 기본 언어 결정 (ko)

### 개발 중
- [ ] i18n 설정 완료
- [ ] 언어 파일 구조 생성
- [ ] 컴포넌트 번역 적용
- [ ] 언어 선택 UI 구현
- [ ] DB 스키마 업데이트

### 개발 후
- [ ] 모든 하드코딩 텍스트 제거
- [ ] 번역 누락 확인
- [ ] storage_info 번역 데이터 검증
- [ ] 언어별 테스트
- [ ] 성능 최적화
- [ ] 문서화

---

## 💡 Best Practices

1. **번역 키 네이밍**
```javascript
// Good
t('inventory.item.deleteConfirm')

// Bad
t('delete_item_confirm_message')
```

2. **컨텍스트 제공**
```javascript
// 단수/복수 처리
t('inventory.itemCount', { count: items.length })
// ko: "{{count}}개의 항목"
// en: "{{count}} item" / "{{count}} items"
```

3. **폴백 처리**
```javascript
t('inventory.unknownItem', { defaultValue: '알 수 없는 항목' })
```

4. **동적 로딩**
```javascript
// 필요한 언어만 로드
import(`../locales/${language}/cooking.json`)
```

---

이 계획서를 확인하시고, 진행 여부를 결정해주세요!