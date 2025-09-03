export interface KoreanTranslations {
  appName: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  confirm: string;
  back: string;
  
  navigation: {
    inventory: string;
    cooking: string;
    shopping: string;
  };
  
  dateTime: {
    today: string;
    yesterday: string;
    daysAgo: string;
    date: string;
    time: string;
  };
  
  errors: {
    networkError: string;
    unknownError: string;
    required: string;
  };
  
  status: {
    success: string;
    failed: string;
    pending: string;
  };
  
  // Extended structure matching ui_guide.md
  common: {
    retry: string;
    next: string;
    previous: string;
    close: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    error: string;
    success: string;
  };
  
  auth: {
    login: string;
    logout: string;
    signup: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
  };
  
  inventory: {
    inventory: string;
    add: string;
    consume: string;
    dispose: string;
    freeze: string;
    quantity: string;
    expiry: string;
    category: string;
    fresh: string;
    expired: string;
    consumed: string;
    frozen: string;
    name: string;
    memo: string;
    addedDate: string;
    consumedDate: string;
    daysRemaining: string;
    noItems: string;
    addNewItem: string;
  };
  
  shopping: {
    shopping: string;
    shoppingList: string;
    buy: string;
    purchase: string;
    completed: string;
    pending: string;
    addToCart: string;
    removeFromCart: string;
    markComplete: string;
    markIncomplete: string;
    item: string;
    store: string;
    price: string;
    quantity: string;
    priority: string;
    urgent: string;
    normal: string;
    low: string;
    noShoppingItems: string;
    addNewShoppingItem: string;
    completedItems: string;
  };
}

export const koreanTranslations = {
  appName: 'Fresh Inventory',
  loading: '로딩 중...',
  save: '저장',
  cancel: '취소',
  delete: '삭제',
  edit: '수정',
  add: '추가',
  confirm: '확인',
  back: '뒤로',
  
  navigation: {
    inventory: '재고',
    cooking: '요리',
    shopping: '장보기',
  },
  
  dateTime: {
    today: '오늘',
    yesterday: '어제',
    daysAgo: '일 전',
    date: '날짜',
    time: '시간',
  },
  
  errors: {
    networkError: '네트워크 오류가 발생했습니다',
    unknownError: '알 수 없는 오류가 발생했습니다',
    required: '필수 항목입니다',
  },
  
  status: {
    success: '성공',
    failed: '실패',
    pending: '대기 중',
  },
  
  // Extended structure matching ui_guide.md
  common: {
    retry: '다시 시도',
    next: '다음',
    previous: '이전',
    close: '닫기',
    search: '검색',
    filter: '필터',
    sort: '정렬',
    refresh: '새로고침',
    error: '오류가 발생했습니다',
    success: '성공적으로 완료되었습니다',
  },
  
  auth: {
    login: '로그인',
    logout: '로그아웃',
    signup: '회원가입',
    email: '이메일',
    password: '비밀번호',
    confirmPassword: '비밀번호 확인',
    forgotPassword: '비밀번호를 잊으셨나요?',
    resetPassword: '비밀번호 재설정',
  },
  
  inventory: {
    inventory: '재고',
    add: '추가',
    consume: '소비',
    dispose: '폐기',
    freeze: '냉동',
    quantity: '수량',
    expiry: '유통기한',
    category: '카테고리',
    fresh: '신선함',
    expired: '기한 만료',
    consumed: '소비됨',
    frozen: '냉동됨',
    name: '이름',
    memo: '메모',
    addedDate: '추가일',
    consumedDate: '소비일',
    daysRemaining: '남은 일수',
    noItems: '재료가 없습니다',
    addNewItem: '새 재료 추가',
  },
  
  shopping: {
    shopping: '장보기',
    shoppingList: '장보기 목록',
    buy: '구매',
    purchase: '구입',
    completed: '완료',
    pending: '미완료',
    addToCart: '장바구니에 추가',
    removeFromCart: '장바구니에서 제거',
    markComplete: '완료 표시',
    markIncomplete: '미완료 표시',
    item: '항목',
    store: '상점',
    price: '가격',
    quantity: '수량',
    priority: '우선순위',
    urgent: '긴급',
    normal: '일반',
    low: '낮음',
    noShoppingItems: '쇼핑 목록이 없습니다',
    addNewShoppingItem: '새 쇼핑 항목 추가',
    completedItems: '완료한 쇼핑',
  },
} as const;

export function getTranslation(path: string): string | undefined {
  if (!path || typeof path !== 'string') {
    return undefined;
  }

  const keys = path.split('.');
  let current: any = koreanTranslations;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback: return the original path as Korean fallback
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}