# Fresh Inventory - 신선한 재료 관리 시스템

## 📋 프로젝트 개요

Fresh Inventory는 가정에서 사용하는 식재료를 효율적으로 관리할 수 있는 웹 애플리케이션입니다. 식재료의 추가, 소비, 폐기량 추적, 장보기 목록 관리 등 다양한 기능을 제공하여 식재료의 낭비를 줄이고 효율적인 주방 관리를 도와줍니다.

## ✨ 주요 기능

### 🏠 메인 화면 (index.html)
- **내 재고 목록 탭**
    - **재고 목록**: 현재 보유한 식재료 목록 표시
    - **재료 추가**: 이미지 업로드 및 AI 분석을 통한 자동 재료 인식
    - **재료 상세 정보**: 재료별 남은 양, 사용 이력 확인 및 소비, 냉동, 폐기 관리
- **냉동 보관 탭**: 냉동실에 보관 중인 재료 관리
- **지난 기록 탭**: 최근에 소비한 재료 10개 표시 (중복 제거)

### 🧑‍🍳 요리 화면 (cooking.html)
- **요리 추천 탭**: AI 기반 개인화된 요리 추천
    - **재고 목록**: 현재 보유한 식재료 목록 표시
- **북마크 탭**: 즐겨찾기한 요리 관리
    - **요리 상세 정보**: 요리별 필요한 재료, 남은 양 체크

### 🛒 장보기 화면 (shopping.html)
- **장보기 탭**
    - **쇼핑 목록**: 구매해야 할 재료 관리 (`todo=true`)
    - **신규 추가**: 구매할 새로운 재료 추가
    - **완료한 쇼핑**: 구매 완료된 재료 5개 표시 (`todo=false`)
- **지난 기록**: 날짜별 완료한 장보기 기록 표시


## 🛠 기술 스택

### Backend
- **Flask**: Python 웹 프레임워크
- **SQLite**: 데이터베이스
- **Google Generative AI**: AI 기반 재료 인식 및 요리 추천

### Frontend
- **HTML5**: 웹 페이지 구조
- **Tailwind CSS**: 스타일링
- **JavaScript**: 동적 기능 구현

### 주요 라이브러리
- `Flask`: 웹 서버
- `google-generativeai`: AI 기능
- `python-dotenv`: 환경 변수 관리

## 📁 프로젝트 구조

```
freshInventory/
├── app.py                 # Flask 메인 애플리케이션
├── requirements.txt       # Python 의존성
├── templates/            # HTML 템플릿
│   ├── index.html       # 메인 화면
│   ├── cooking.html     # 요리 화면
│   └── shopping.html    # 쇼핑 화면
├── static/              # 정적 파일
│   ├── css/
│   │   └── output.css   # Tailwind CSS
│   └── js/
│       ├── app.js       # 메인 JavaScript
│       └── shopping.js  # 쇼핑 화면 JavaScript
└── README.md           # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone [repository-url]
cd freshInventory
```

### 2. 가상환경 생성 및 활성화
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 환경 변수 설정
`.env` 파일을 생성하고 Google AI API 키를 설정하세요:
```
GOOGLE_API_KEY=your_api_key_here
```

### 5. 애플리케이션 실행
```bash
python app.py
```

### 6. 브라우저에서 접속
```
http://localhost:5000
```

## 📊 데이터베이스 구조

### 주요 테이블
- **foodItems**: 재료 정보 (이름, 수량, 추가일, 소비일 등)
- **cookBook**: 요리 정보 및 북마크
- **shoppingList**: 쇼핑 목록 (이름, 메모, 완료 상태, 업데이트일)

## 🎨 UI/UX 특징

### 디자인 통일성
- **일관된 색상**: Cyan (#0891b2) 메인 컬러
- **통일된 테두리**: `border border-gray-200` 스타일
- **일관된 그림자**: `shadow-sm` 효과
- **동일한 둥근 모서리**: `rounded-xl` 적용

### 반응형 디자인
- 모바일 친화적 레이아웃
- 터치 친화적 버튼 크기
- 적응형 그리드 시스템

### 사용자 경험
- **직관적인 네비게이션**: 탭 기반 화면 전환
- **실시간 피드백**: 토글 버튼, 로딩 상태 표시
- **명확한 시각적 구분**: 날짜별 그룹화, 색상 코딩

## 🔧 주요 기능 상세

### 재료 관리
- **이미지 업로드**: 사진으로 재료 자동 인식
- **수량 추적**: 남은 양 실시간 업데이트
- **소비 기록**: 사용량과 폐기량 분리 추적
- **소비 기간**: 추가일부터 소비일까지 기간 계산

### 쇼핑 목록
- **스마트 중복 방지**: 이미 목록에 있는 재료 추가 시 경고
- **완료 상태 관리**: 구매 완료/미완료 토글
- **날짜별 기록**: 완료한 쇼핑을 날짜별로 그룹화
- **최신순 정렬**: 가장 최근 완료된 항목 우선 표시

### 지난 기록
- **중복 제거**: 같은 이름의 재료는 최신 것만 표시
- **최신 10개**: 최근 소비한 재료 10개로 제한
- **토글 기능**: 지난 기록에서 쇼핑 목록에 추가/제거

## 🔄 API 엔드포인트

### 재료 관리
- `GET /api/inventory`: 재료 목록 조회
- `POST /api/inventory/add`: 새 재료 추가
- `PUT /api/inventory/<id>/remains`: 남은 양 수정
- `DELETE /api/inventory/<id>`: 재료 삭제

### 쇼핑 목록
- `GET /api/shopping-list`: 쇼핑 목록 조회
- `POST /api/shopping-list/add`: 쇼핑 항목 추가
- `PUT /api/shopping-list/<id>/toggle`: 완료 상태 토글
- `DELETE /api/shopping-list/<id>`: 쇼핑 항목 삭제

### 지난 기록
- `GET /api/inventory/history`: 소비 기록 조회

## 🎯 향후 개선 계획

- [ ] 다국어 지원 (영어, 일본어)
- [ ] 데이터 백업/복원 기능
- [ ] 알림 기능 (유통기한, 재고 부족)
- [ ] 통계 대시보드 (월별 소비량, 폐기량)
- [ ] 레시피 데이터베이스 확장
- [ ] 모바일 앱 개발

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**Fresh Inventory** - 더 스마트한 주방 관리의 시작 🥕
