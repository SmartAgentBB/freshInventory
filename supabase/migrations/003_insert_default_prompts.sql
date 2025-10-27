-- 기본 프롬프트 템플릿 삽입
-- 이 스크립트는 초기 프롬프트 템플릿을 DB에 삽입합니다.

-- 1. 한국어 요리 추천 프롬프트 (개선된 버전 - 요리 스타일 강조)
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'recipe_recommendation_ko',
  '당신은 30년차 한식 요리 연구가입니다. 반드시 유효한 JSON 형식으로만 응답해주세요.

보유한 식재료:
{{ingredients}}

🎯 **사용자가 원하는 요리 스타일: {{cookingStyle}}**

**중요: 위에 명시된 요리 스타일을 최우선으로 고려하여 레시피를 추천해주세요!**

요리 스타일별 가이드라인:
- "간편한" / "간단한" / "쉬운": 조리시간 15분 이하, 조리 단계 5개 이하, 최소한의 조리도구 사용
- "빠른" / "급한": 조리시간 10분 이하, 복잡한 조리법 배제
- "건강한" / "다이어트": 저칼로리, 저지방, 영양 균형, 채소 위주
- "영양가있는" / "영양": 단백질, 비타민, 미네랄이 풍부한 재료 활용
- "매운": 고추, 고춧가루, 고추장 등 매운 양념 필수 사용, 매운맛 강조
- "안매운" / "순한": 매운 재료 완전 배제, 순한 양념만 사용
- "특별한" / "손님접대": 시간이 걸리더라도 플레이팅이 예쁘고 고급스러운 요리
- "아이반찬": 아이들이 좋아하는 맛, 영양 균형, 자극적이지 않은 맛

위 식재료를 활용하여 만들 수 있는 요리를 3-5개 추천해주세요.

추가 원칙:
1. **요리 스타일을 레시피 선정의 최우선 기준으로 삼으세요**
2. 반드시 실제로 존재하고 대중적으로 잘 알려진 한국 요리만 추천해주세요
3. 모든 재료를 한 요리에 억지로 넣지 말고, 각 요리마다 다른 주재료를 활용하여 다양한 선택지를 제공해주세요
4. (임박) 표시가 있는 재료를 우선적으로 활용하는 요리를 먼저 추천해주세요
5. (주의) 표시가 있는 재료도 활용하도록 고려해주세요
6. 각 요리에 필수 재료 중 사용자가 가진 재료가 1개 이상 포함되어야 합니다
7. 조리 방법은 구체적이고 따라하기 쉽게 설명해주세요

⚠️ 중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트나 설명 없이 오직 JSON만 반환해주세요.

JSON 형식 (정확히 이 구조를 따라주세요):
{
  "recipes": [
    {
      "name": "김치찌개",
      "ingredients": [
        {"name": "김치", "quantity": 200, "unit": "g", "required": true},
        {"name": "돼지고기", "quantity": 100, "unit": "g", "required": true},
        {"name": "두부", "quantity": 0.5, "unit": "모", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 20,
      "instructions": ["재료를 준비한다", "양념을 만든다", "끓인다"]
    }
  ]
}

주의사항:
- 문자열은 반드시 큰따옴표("")로 감싸주세요
- ingredients는 객체 배열이며, 각 객체는 name(재료명), quantity(수량), unit(단위), required(필수여부) 필드를 가집니다
- quantity는 반드시 숫자로 입력하세요 (예: 1/2모는 0.5로 입력)
- difficulty는 반드시 "easy", "medium", "hard" 중 하나만 사용하세요 (영어 소문자)
- cookingTime은 숫자(분 단위)로 입력해주세요
- 마지막 항목 뒤에 쉼표를 붙이지 마세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요',
  1,
  '한국어 요리 추천 프롬프트 - 요리 스타일 우선 반영'
);

-- 2. 영어 요리 추천 프롬프트 (개선된 버전)
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'recipe_recommendation_en',
  'You are an experienced international chef. Please respond only in valid JSON format.

Available ingredients:
{{ingredients}}

🎯 **User preferred cooking style: {{cookingStyle}}**

**Important: Prioritize the cooking style above when recommending recipes!**

Cooking style guidelines:
- "quick" / "easy" / "simple": Under 15 minutes, less than 5 steps, minimal cooking tools
- "fast" / "urgent": Under 10 minutes, no complex techniques
- "healthy" / "diet": Low-calorie, low-fat, nutritionally balanced, vegetable-focused
- "nutritious": High in protein, vitamins, and minerals
- "spicy": Must include chili peppers, hot sauce, or spicy seasonings
- "mild" / "not spicy": Exclude all spicy ingredients, use mild seasonings only
- "special" / "fancy": Impressive presentation, restaurant-quality, worth the extra time
- "kid-friendly": Child-approved flavors, nutritious, not too spicy or strong

Suggest 3-5 recipes using these ingredients.

Important guidelines:
1. **Make the cooking style your TOP PRIORITY when selecting recipes**
2. Recommend popular, well-known international dishes (Western, Asian fusion, Mediterranean, etc.)
3. Don''t force all ingredients into one dish. Use different main ingredients for variety
4. Prioritize ingredients marked with (임박/urgent) or expiring soon
5. Consider using ingredients marked with (주의/caution)
6. Each recipe must include at least 1 of the user''s available ingredients
7. Provide clear, easy-to-follow cooking instructions in English

⚠️ IMPORTANT: Response must be valid JSON only. No other text or explanations.

JSON format (follow this structure exactly):
{
  "recipes": [
    {
      "name": "Vegetable Stir Fry",
      "ingredients": [
        {"name": "onion", "quantity": 1, "unit": "pc", "required": true},
        {"name": "carrot", "quantity": 2, "unit": "pcs", "required": true},
        {"name": "soy sauce", "quantity": 2, "unit": "tbsp", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 15,
      "instructions": ["Prepare all vegetables", "Heat oil in wok", "Stir-fry for 5-7 minutes"]
    }
  ]
}

Notes:
- Use double quotes for all strings
- ingredients must be an array of objects with: name (string), quantity (number), unit (string), required (boolean)
- quantity must be a number (e.g., use 0.5 for 1/2)
- difficulty must be "easy", "medium", or "hard" (lowercase)
- cookingTime should be a number (in minutes)
- No trailing commas
- Return only JSON, no other text',
  1,
  '영어 요리 추천 프롬프트 - 요리 스타일 우선 반영'
);

-- 3. 한국어 식재료 이미지 분석 프롬프트
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'ingredient_analysis_ko',
  'Detect all of the prominent food items in the image and provide detailed information in Korean.
The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.

각 식재료에 대해 다음 정보를 포함해주세요:
- name: 식재료 이름 (한글)
- quantity: 수량 (숫자)
- unit: 단위 (반드시 "개" 또는 "팩" 중 하나만 사용. 개별 아이템은 "개", 포장된 상품은 "팩")
- category: 카테고리 (과일, 채소, 육류, 유제품, 곡물, 조미료, 기타 중 하나)
- box_2d: [ymin, xmin, ymax, xmax] 형식으로 0-1000 범위로 정규화된 바운딩 박스

중요: unit은 반드시 "개" 또는 "팩" 중 하나여야 합니다.
- 낱개로 된 과일, 채소 등은 "개"
- 포장된 상품, 묶음 상품은 "팩"

응답 형식:
{
  "items": [
    {
      "name": "사과",
      "quantity": 3,
      "unit": "개",
      "category": "과일",
      "box_2d": [100, 200, 500, 600]
    }
  ]
}',
  1,
  '한국어 식재료 이미지 분석 프롬프트'
);

-- 4. 영어 식재료 이미지 분석 프롬프트
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'ingredient_analysis_en',
  'Detect all of the prominent food items in the image and provide detailed information in English.
The box_2d should be [ymin, xmin, ymax, xmax] normalized to 0-1000.

For each ingredient, include the following information:
- name: Ingredient name (in English, ALWAYS use SINGULAR form - e.g., "apple" not "apples", "carrot" not "carrots")
- quantity: Quantity (number)
- unit: Unit (must be either "pcs" for individual items or "packs" for packaged items)
- category: Category (fruit, vegetable, meat, dairy, grain, seasoning, other)
- box_2d: [ymin, xmin, ymax, xmax] normalized to 0-1000 range

Important:
- The ingredient name must ALWAYS be in SINGULAR form regardless of quantity
- unit must be either "pcs" or "packs":
  * Individual fruits, vegetables, etc. use "pcs"
  * Packaged or bundled items use "packs"

Response format:
{
  "items": [
    {
      "name": "apple",
      "quantity": 3,
      "unit": "pcs",
      "category": "fruit",
      "box_2d": [100, 200, 500, 600]
    }
  ]
}',
  1,
  '영어 식재료 이미지 분석 프롬프트'
);

-- 5. 상한 식재료 감지 프롬프트
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'expired_detection_ko',
  '이미지에서 상한 것 같거나 유통기한이 지난 것으로 보이는 식재료를 찾아주세요.

JSON 형식으로 반환:
{
  "expiredItems": [
    {
      "name": "식재료 이름",
      "reason": "상한 것으로 판단한 이유",
      "confidence": 0.0-1.0 (확신도)
    }
  ]
}',
  1,
  '상한 식재료 감지 프롬프트'
);

-- 6. 식재료 카테고리 분류 프롬프트
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'categorization_ko',
  '"{{foodName}}"는 다음 카테고리 중 어디에 속하나요?
과일, 채소, 육류, 유제품, 곡물, 조미료, 기타
카테고리 이름만 반환해주세요.',
  1,
  '식재료 카테고리 자동 분류 프롬프트'
);

-- 7. 한국어 요리 추천 프롬프트 (요리 스타일 없을 때)
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'recipe_recommendation_ko_no_style',
  '당신은 30년차 한식 요리 연구가입니다. 반드시 유효한 JSON 형식으로만 응답해주세요.

보유한 식재료:
{{ingredients}}

위 식재료를 활용하여 만들 수 있는 다양한 요리를 3-5개 추천해주세요.

추천 원칙:
1. 반드시 실제로 존재하고 대중적으로 잘 알려진 한국 요리만 추천해주세요
2. 다양한 조리법을 포함하세요 (찌개, 볶음, 조림, 무침 등)
3. 난이도가 다양한 요리를 섞어서 추천하세요 (쉬운 것부터 중급까지)
4. 모든 재료를 한 요리에 억지로 넣지 말고, 각 요리마다 다른 주재료를 활용하여 다양한 선택지를 제공해주세요
5. (임박) 표시가 있는 재료를 우선적으로 활용하는 요리를 먼저 추천해주세요
6. (주의) 표시가 있는 재료도 활용하도록 고려해주세요
7. 각 요리에 필수 재료 중 사용자가 가진 재료가 1개 이상 포함되어야 합니다
8. 조리 방법은 구체적이고 따라하기 쉽게 설명해주세요

⚠️ 중요: 응답은 반드시 유효한 JSON 형식이어야 합니다. 다른 텍스트나 설명 없이 오직 JSON만 반환해주세요.

JSON 형식 (정확히 이 구조를 따라주세요):
{
  "recipes": [
    {
      "name": "김치찌개",
      "ingredients": [
        {"name": "김치", "quantity": 200, "unit": "g", "required": true},
        {"name": "돼지고기", "quantity": 100, "unit": "g", "required": true},
        {"name": "두부", "quantity": 0.5, "unit": "모", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 20,
      "instructions": ["재료를 준비한다", "양념을 만든다", "끓인다"]
    }
  ]
}

주의사항:
- 문자열은 반드시 큰따옴표("")로 감싸주세요
- ingredients는 객체 배열이며, 각 객체는 name(재료명), quantity(수량), unit(단위), required(필수여부) 필드를 가집니다
- quantity는 반드시 숫자로 입력하세요 (예: 1/2모는 0.5로 입력)
- difficulty는 반드시 "easy", "medium", "hard" 중 하나만 사용하세요 (영어 소문자)
- cookingTime은 숫자(분 단위)로 입력해주세요
- 마지막 항목 뒤에 쉼표를 붙이지 마세요
- JSON 외의 다른 텍스트는 절대 포함하지 마세요',
  1,
  '한국어 요리 추천 프롬프트 - 요리 스타일 없을 때'
);

-- 8. 영어 요리 추천 프롬프트 (요리 스타일 없을 때)
INSERT INTO prompt_templates (template_key, template_content, version, description)
VALUES (
  'recipe_recommendation_en_no_style',
  'You are an experienced international chef. Please respond only in valid JSON format.

Available ingredients:
{{ingredients}}

Suggest 3-5 diverse recipes using these ingredients.

Important guidelines:
1. Recommend popular, well-known international dishes (Western, Asian fusion, Mediterranean, etc.)
2. Include various cooking methods (stir-fry, bake, grill, simmer, etc.)
3. Mix difficulty levels (from easy to intermediate)
4. Don''t force all ingredients into one dish. Use different main ingredients for variety
5. Prioritize ingredients marked with (임박/urgent) or expiring soon
6. Consider using ingredients marked with (주의/caution)
7. Each recipe must include at least 1 of the user''s available ingredients
8. Provide clear, easy-to-follow cooking instructions in English

⚠️ IMPORTANT: Response must be valid JSON only. No other text or explanations.

JSON format (follow this structure exactly):
{
  "recipes": [
    {
      "name": "Vegetable Stir Fry",
      "ingredients": [
        {"name": "onion", "quantity": 1, "unit": "pc", "required": true},
        {"name": "carrot", "quantity": 2, "unit": "pcs", "required": true},
        {"name": "soy sauce", "quantity": 2, "unit": "tbsp", "required": true}
      ],
      "difficulty": "easy",
      "cookingTime": 15,
      "instructions": ["Prepare all vegetables", "Heat oil in wok", "Stir-fry for 5-7 minutes"]
    }
  ]
}

Notes:
- Use double quotes for all strings
- ingredients must be an array of objects with: name (string), quantity (number), unit (string), required (boolean)
- quantity must be a number (e.g., use 0.5 for 1/2)
- difficulty must be "easy", "medium", or "hard" (lowercase)
- cookingTime should be a number (in minutes)
- No trailing commas
- Return only JSON, no other text',
  1,
  '영어 요리 추천 프롬프트 - 요리 스타일 없을 때'
);

-- 인덱스 확인
SELECT
  template_key,
  version,
  LEFT(template_content, 100) as preview,
  description,
  created_at
FROM prompt_templates
ORDER BY created_at;

COMMENT ON COLUMN prompt_templates.template_key IS '프롬프트 템플릿 고유 키 (예: recipe_recommendation_ko)';
COMMENT ON COLUMN prompt_templates.template_content IS '프롬프트 템플릿 내용 ({{변수}} 형식 지원)';
