-- 개선된 food_history 테이블 생성
-- 식재료 사용 이력을 추적하여 평균 소비 기간 및 패턴 분석을 위한 테이블

CREATE TABLE IF NOT EXISTS food_history (
    -- 기본 식별자
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 식재료 정보
    food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL, -- 나중에 삭제된 아이템도 추적 가능하도록
    category VARCHAR(50), -- 식재료 카테고리 저장
    
    -- 이벤트 정보
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created',        -- 새로 등록
        'updated',        -- 남은양 업데이트
        'consumed',       -- 소비 완료
        'frozen',         -- 냉동 처리
        'unfrozen',       -- 냉동 해제
        'disposed',       -- 폐기
        'expired'         -- 만료
    )),
    event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 수량 및 남은양 추적
    quantity_before DECIMAL(10,2),  -- 이벤트 전 수량
    quantity_after DECIMAL(10,2),   -- 이벤트 후 수량
    remains_before DECIMAL(3,2),    -- 이벤트 전 남은 비율 (0.00 ~ 1.00)
    remains_after DECIMAL(3,2),     -- 이벤트 후 남은 비율
    
    -- 소비 패턴 분석용 추가 정보
    days_since_added INTEGER,        -- 등록 후 경과일
    days_until_expiry INTEGER,       -- 소비기한까지 남은 날
    storage_days INTEGER,            -- 권장 보관 기간
    
    -- 냉동 관련
    was_frozen BOOLEAN DEFAULT FALSE,      -- 냉동 상태였는지
    frozen_duration_days INTEGER,          -- 냉동 기간 (일)
    
    -- 폐기 관련
    waste_amount DECIMAL(3,2),            -- 폐기된 양 (비율)
    waste_reason VARCHAR(100),             -- 폐기 사유 (expired, damaged, etc.)
    
    -- 메타 정보
    user_id UUID NOT NULL,
    household_id UUID,                     -- 가구 단위 분석용 (선택적)
    device_type VARCHAR(50),               -- 입력 기기 (mobile, web)
    notes TEXT,                            -- 추가 메모
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스를 위한 복합키
    CONSTRAINT unique_event UNIQUE (food_item_id, event_type, event_date)
);

-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_food_history_food_item ON food_history(food_item_id);
CREATE INDEX idx_food_history_event_type ON food_history(event_type);
CREATE INDEX idx_food_history_event_date ON food_history(event_date);
CREATE INDEX idx_food_history_user_id ON food_history(user_id);
CREATE INDEX idx_food_history_category ON food_history(category);
CREATE INDEX idx_food_history_waste ON food_history(waste_amount) WHERE waste_amount > 0;

-- RLS (Row Level Security) 정책
ALTER TABLE food_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 기록만 조회 가능
CREATE POLICY "Users can view own history" ON food_history
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 기록만 추가 가능
CREATE POLICY "Users can insert own history" ON food_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 기록은 수정 불가 (이력 데이터의 무결성 보장)
-- UPDATE 정책 없음

-- 관리자만 삭제 가능
CREATE POLICY "Only admins can delete history" ON food_history
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- 뷰: 식재료별 평균 소비 기간 계산
CREATE OR REPLACE VIEW food_consumption_stats AS
SELECT 
    food_name,
    category,
    user_id,
    COUNT(*) as total_events,
    AVG(CASE 
        WHEN event_type = 'consumed' THEN days_since_added 
        ELSE NULL 
    END) as avg_consumption_days,
    AVG(CASE 
        WHEN event_type = 'disposed' THEN waste_amount 
        ELSE NULL 
    END) as avg_waste_percentage,
    COUNT(CASE WHEN event_type = 'frozen' THEN 1 END) as freeze_count,
    COUNT(CASE WHEN event_type = 'disposed' THEN 1 END) as disposal_count,
    COUNT(CASE WHEN event_type = 'consumed' THEN 1 END) as consumption_count
FROM food_history
GROUP BY food_name, category, user_id;

-- 트리거: food_items 테이블 변경 시 자동으로 history 기록
CREATE OR REPLACE FUNCTION record_food_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 아이템 생성 시
    IF TG_OP = 'INSERT' THEN
        INSERT INTO food_history (
            food_item_id, food_name, category, event_type,
            quantity_after, remains_after, user_id
        ) VALUES (
            NEW.id, NEW.name, NEW.category, 'created',
            NEW.quantity, NEW.remains, NEW.user_id
        );
        RETURN NEW;
    
    -- 업데이트 시
    ELSIF TG_OP = 'UPDATE' THEN
        -- 상태 변경 감지
        IF OLD.status != NEW.status THEN
            INSERT INTO food_history (
                food_item_id, food_name, category, event_type,
                quantity_before, quantity_after,
                remains_before, remains_after,
                days_since_added, user_id
            ) VALUES (
                NEW.id, NEW.name, NEW.category,
                CASE NEW.status
                    WHEN 'frozen' THEN 'frozen'
                    WHEN 'consumed' THEN 'consumed'
                    WHEN 'disposed' THEN 'disposed'
                    ELSE 'updated'
                END,
                OLD.quantity, NEW.quantity,
                OLD.remains, NEW.remains,
                DATE_PART('day', NOW() - NEW.added_date),
                NEW.user_id
            );
        -- 남은양만 변경된 경우
        ELSIF OLD.remains != NEW.remains THEN
            INSERT INTO food_history (
                food_item_id, food_name, category, event_type,
                remains_before, remains_after,
                days_since_added, user_id,
                waste_amount
            ) VALUES (
                NEW.id, NEW.name, NEW.category, 'updated',
                OLD.remains, NEW.remains,
                DATE_PART('day', NOW() - NEW.added_date),
                NEW.user_id,
                CASE 
                    WHEN NEW.remains < OLD.remains THEN OLD.remains - NEW.remains
                    ELSE NULL
                END
            );
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (필요시 활성화)
-- CREATE TRIGGER food_history_trigger
-- AFTER INSERT OR UPDATE ON food_items
-- FOR EACH ROW EXECUTE FUNCTION record_food_history();

-- 유용한 분석 쿼리 예시들
COMMENT ON TABLE food_history IS '식재료 사용 이력 테이블 - 소비 패턴 분석 및 폐기 추적용';

-- 예시: 사용자별 평균 식재료 소비 기간
-- SELECT 
--     category,
--     AVG(days_since_added) as avg_days_to_consume
-- FROM food_history
-- WHERE event_type = 'consumed'
--     AND user_id = 'USER_ID'
-- GROUP BY category;

-- 예시: 월별 폐기율 분석
-- SELECT 
--     DATE_TRUNC('month', event_date) as month,
--     AVG(waste_amount) * 100 as waste_percentage
-- FROM food_history
-- WHERE event_type = 'disposed'
-- GROUP BY DATE_TRUNC('month', event_date)
-- ORDER BY month DESC;