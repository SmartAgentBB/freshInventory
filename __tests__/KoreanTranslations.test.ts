import { koreanTranslations, getTranslation } from '../src/constants/translations';

describe('Korean Translations', () => {
  describe('Should export Korean translation object with common terms', () => {
    it('should export Korean translation object', () => {
      expect(koreanTranslations).toBeDefined();
      expect(typeof koreanTranslations).toBe('object');
    });

    it('should contain common app terms', () => {
      expect(koreanTranslations.appName).toBe('Fresh Inventory');
      expect(koreanTranslations.loading).toBe('로딩 중...');
      expect(koreanTranslations.save).toBe('저장');
      expect(koreanTranslations.cancel).toBe('취소');
      expect(koreanTranslations.delete).toBe('삭제');
      expect(koreanTranslations.edit).toBe('수정');
      expect(koreanTranslations.add).toBe('추가');
      expect(koreanTranslations.confirm).toBe('확인');
      expect(koreanTranslations.back).toBe('뒤로');
    });

    it('should contain navigation terms', () => {
      expect(koreanTranslations.navigation).toBeDefined();
      expect(koreanTranslations.navigation.inventory).toBe('재고');
      expect(koreanTranslations.navigation.cooking).toBe('요리');
      expect(koreanTranslations.navigation.shopping).toBe('장보기');
    });

    it('should contain date and time terms', () => {
      expect(koreanTranslations.dateTime).toBeDefined();
      expect(koreanTranslations.dateTime.today).toBe('오늘');
      expect(koreanTranslations.dateTime.yesterday).toBe('어제');
      expect(koreanTranslations.dateTime.daysAgo).toBe('일 전');
      expect(koreanTranslations.dateTime.date).toBe('날짜');
      expect(koreanTranslations.dateTime.time).toBe('시간');
    });

    it('should contain error and status terms', () => {
      expect(koreanTranslations.errors).toBeDefined();
      expect(koreanTranslations.errors.networkError).toBe('네트워크 오류가 발생했습니다');
      expect(koreanTranslations.errors.unknownError).toBe('알 수 없는 오류가 발생했습니다');
      expect(koreanTranslations.errors.required).toBe('필수 항목입니다');
      
      expect(koreanTranslations.status).toBeDefined();
      expect(koreanTranslations.status.success).toBe('성공');
      expect(koreanTranslations.status.failed).toBe('실패');
      expect(koreanTranslations.status.pending).toBe('대기 중');
    });

    it('should contain common UI terms matching ui_guide.md structure', () => {
      expect(koreanTranslations.common).toBeDefined();
      expect(koreanTranslations.common.retry).toBe('다시 시도');
      expect(koreanTranslations.common.next).toBe('다음');
      expect(koreanTranslations.common.previous).toBe('이전');
      expect(koreanTranslations.common.close).toBe('닫기');
      expect(koreanTranslations.common.search).toBe('검색');
      expect(koreanTranslations.common.filter).toBe('필터');
      expect(koreanTranslations.common.sort).toBe('정렬');
      expect(koreanTranslations.common.refresh).toBe('새로고침');
      expect(koreanTranslations.common.error).toBe('오류가 발생했습니다');
      expect(koreanTranslations.common.success).toBe('성공적으로 완료되었습니다');
    });
  });

  describe('Korean translations should include auth terms', () => {
    it('should contain authentication terms', () => {
      expect(koreanTranslations.auth).toBeDefined();
      expect(koreanTranslations.auth.login).toBe('로그인');
      expect(koreanTranslations.auth.logout).toBe('로그아웃');
      expect(koreanTranslations.auth.signup).toBe('회원가입');
      expect(koreanTranslations.auth.email).toBe('이메일');
      expect(koreanTranslations.auth.password).toBe('비밀번호');
      expect(koreanTranslations.auth.confirmPassword).toBe('비밀번호 확인');
      expect(koreanTranslations.auth.forgotPassword).toBe('비밀번호를 잊으셨나요?');
      expect(koreanTranslations.auth.resetPassword).toBe('비밀번호 재설정');
    });
  });

  describe('Korean translations should include inventory terms', () => {
    it('should contain inventory management terms', () => {
      expect(koreanTranslations.inventory).toBeDefined();
      expect(koreanTranslations.inventory.inventory).toBe('재고');
      expect(koreanTranslations.inventory.add).toBe('추가');
      expect(koreanTranslations.inventory.consume).toBe('소비');
      expect(koreanTranslations.inventory.dispose).toBe('폐기');
      expect(koreanTranslations.inventory.freeze).toBe('냉동');
      expect(koreanTranslations.inventory.quantity).toBe('수량');
      expect(koreanTranslations.inventory.expiry).toBe('유통기한');
      expect(koreanTranslations.inventory.category).toBe('카테고리');
      expect(koreanTranslations.inventory.fresh).toBe('신선함');
      expect(koreanTranslations.inventory.expired).toBe('기한 만료');
      expect(koreanTranslations.inventory.consumed).toBe('소비됨');
      expect(koreanTranslations.inventory.frozen).toBe('냉동됨');
    });

    it('should contain food item related terms', () => {
      expect(koreanTranslations.inventory.name).toBe('이름');
      expect(koreanTranslations.inventory.memo).toBe('메모');
      expect(koreanTranslations.inventory.addedDate).toBe('추가일');
      expect(koreanTranslations.inventory.consumedDate).toBe('소비일');
      expect(koreanTranslations.inventory.daysRemaining).toBe('남은 일수');
      expect(koreanTranslations.inventory.noItems).toBe('재료가 없습니다');
      expect(koreanTranslations.inventory.addNewItem).toBe('새 재료 추가');
    });
  });

  describe('Korean translations should include shopping terms', () => {
    it('should contain shopping management terms', () => {
      expect(koreanTranslations.shopping).toBeDefined();
      expect(koreanTranslations.shopping.shopping).toBe('장보기');
      expect(koreanTranslations.shopping.shoppingList).toBe('장보기 목록');
      expect(koreanTranslations.shopping.buy).toBe('구매');
      expect(koreanTranslations.shopping.purchase).toBe('구입');
      expect(koreanTranslations.shopping.completed).toBe('완료');
      expect(koreanTranslations.shopping.pending).toBe('미완료');
      expect(koreanTranslations.shopping.addToCart).toBe('장바구니에 추가');
      expect(koreanTranslations.shopping.removeFromCart).toBe('장바구니에서 제거');
      expect(koreanTranslations.shopping.markComplete).toBe('완료 표시');
      expect(koreanTranslations.shopping.markIncomplete).toBe('미완료 표시');
    });

    it('should contain shopping item related terms', () => {
      expect(koreanTranslations.shopping.item).toBe('항목');
      expect(koreanTranslations.shopping.store).toBe('상점');
      expect(koreanTranslations.shopping.price).toBe('가격');
      expect(koreanTranslations.shopping.quantity).toBe('수량');
      expect(koreanTranslations.shopping.priority).toBe('우선순위');
      expect(koreanTranslations.shopping.urgent).toBe('긴급');
      expect(koreanTranslations.shopping.normal).toBe('일반');
      expect(koreanTranslations.shopping.low).toBe('낮음');
      expect(koreanTranslations.shopping.noShoppingItems).toBe('쇼핑 목록이 없습니다');
      expect(koreanTranslations.shopping.addNewShoppingItem).toBe('새 쇼핑 항목 추가');
      expect(koreanTranslations.shopping.completedItems).toBe('완료한 쇼핑');
    });
  });

  describe('Should provide helper function to get translated text', () => {
    it('should export getTranslation helper function', () => {
      expect(getTranslation).toBeDefined();
      expect(typeof getTranslation).toBe('function');
    });

    it('should return correct translations for valid paths', () => {
      expect(getTranslation('appName')).toBe('Fresh Inventory');
      expect(getTranslation('loading')).toBe('로딩 중...');
      expect(getTranslation('common.retry')).toBe('다시 시도');
      expect(getTranslation('auth.login')).toBe('로그인');
      expect(getTranslation('inventory.add')).toBe('추가');
      expect(getTranslation('shopping.buy')).toBe('구매');
    });

    it('should handle nested property access with dot notation', () => {
      expect(getTranslation('navigation.inventory')).toBe('재고');
      expect(getTranslation('dateTime.today')).toBe('오늘');
      expect(getTranslation('errors.networkError')).toBe('네트워크 오류가 발생했습니다');
      expect(getTranslation('status.success')).toBe('성공');
    });

    it('should return key path for invalid paths as fallback', () => {
      expect(getTranslation('nonexistent')).toBe('nonexistent');
      expect(getTranslation('common.nonexistent')).toBe('common.nonexistent');
      expect(getTranslation('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should handle empty or invalid input gracefully', () => {
      expect(getTranslation('')).toBeUndefined();
      expect(getTranslation(null as any)).toBeUndefined();
      expect(getTranslation(undefined as any)).toBeUndefined();
    });

    it('should fallback to Korean when translation key is missing', () => {
      // Test fallback for missing key - should return Korean text or key itself
      expect(getTranslation('missingKey')).toBe('missingKey');
      expect(getTranslation('common.missingKey')).toBe('common.missingKey');
      expect(getTranslation('auth.missingKey')).toBe('auth.missingKey');
      
      // Test fallback preserves existing behavior for valid keys
      expect(getTranslation('appName')).toBe('Fresh Inventory');
      expect(getTranslation('common.retry')).toBe('다시 시도');
    });
  });
});