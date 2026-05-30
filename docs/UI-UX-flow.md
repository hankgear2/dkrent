# 독도렌트카 UI/UX 플로우 및 기능 명세

## 📱 메인 예약 페이지 (Rental Request Screen)

### 1단계: 날짜 선택
- **UI 요소**: "날짜를 선택하세요" 텍스트 (클릭 가능)
- **기능**: 
  - 캘린더 팝업 표시
  - **드래그로 기간 범위 선택** (시작일 ~ 종료일)
  - 선택된 기간 표시
- **데이터 저장**: `rental_start_date`, `rental_end_date`

```
┌─────────────────────────────────────┐
│ 📅 날짜를 선택하세요                 │ ← 클릭하면 캘린더 팝업
│ 2026.05.30 ~ 2026.06.01            │ ← 선택된 기간 표시
└─────────────────────────────────────┘
```

---

### 2단계: 시간 선택
- **트리거**: 날짜 선택 후 자동으로 팝업 표시
- **팝업 제목**: "시간을 선택하세요"
- **UI 구성**:

#### 대여시간 탭 (Tab)
```
┌──────────────────────────────┐
│ 대여시간 탭                   │
├──────────────────────────────┤
│ 06:00                        │
│ 07:00                        │
│ 08:00                        │
│ ...                          │
│ 17:00                        │
└──────────────────────────────┘
```

#### 반납시간 탭 (Tab)
```
┌──────────────────────────────┐
│ 반납시간 탭                   │
├──────────────────────────────┤
│ 06:00                        │
│ 07:00                        │
│ ...                          │
│ 17:00                        │
└──────────────────────────────┘
```

- **데이터 저장**: `rental_start_time`, `rental_end_time`
- **제약조건**: 반납시간 > 대여시간

---

### 3단계: 조회 버튼
- **위치**: 시간 선택 하단
- **기능**: 예약 가능 차량 조회
- **데이터베이스 쿼리**: 
  - 선택한 날짜 범위에 겹치는 예약이 없는 차량만 조회
  - 성수기 판정 (peak_seasons 테이블 확인)
  - 평일/주말/성수기 구분

---

### 4단계: 예약 가능 차량 표시 (하단)
- **레이아웃**: 세로 리스트 (one per row)
- **표시 정보**: 각 차종별 1개씩만 표시 (중복 없음)
  - 차종 이름 (ex: 아반떼, 투싼, 스타렉스)
  - 차량 이미지 (썸네일)
  - 기본 렌트료
  - 클릭 가능 영역

```
┌─────────────────────────────────────┐
│ 🚗 기아 아반떼 (준중형)              │ ← 클릭 가능
│ 예상 요금: 70,000원                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚙 현대 투싼 (중형SUV)              │ ← 클릭 가능
│ 예상 요금: 80,000원                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚐 현대 스타렉스 (승합차)            │ ← 클릭 가능
│ 예상 요금: 90,000원                 │
└─────────────────────────────────────┘
```

---

## 🔍 예약 상세 페이지 (Reservation Detail Screen)

### 페이지 구성
```
┌─────────────────────────────────────────────────────────────┐
│ LEFT SECTION (60%)    │ RIGHT SECTION (40%)                │
├───────────────────────┼────────────────────────────────────┤
│ 차량 사진              │ 렌트 가격 계산                      │
│ (높이: 300px)         │ ┌──────────────────────────────┐  │
│                       │ │ 렌트료: 70,000 × 2일        │  │
│ 보험정보 탭           │ │ = 140,000원                  │  │
│ 배차안내 탭           │ │                              │  │
│ 약관및환불 탭         │ │ 시간추가: 5시간 × 7,000원   │  │
│                       │ │ = 35,000원                   │  │
│                       │ │                              │  │
│                       │ │ 보험선택 ↓                   │  │
│                       │ │ ☐ 미가입                      │  │
│                       │ │ ☐ 일반자차 (+15,000/일)     │  │
│                       │ │ ☐ 고급자차 (+25,000/일)     │  │
│                       │ │ ☑ 완전자차 (+40,000/일)     │  │
│                       │ │                              │  │
│                       │ │ 보험료: 80,000원              │  │
│                       │ │ ┌──────────────────────────┐ │  │
│                       │ │ │ 합계: 255,000원          │ │  │
│                       │ │ └──────────────────────────┘ │  │
│                       │ └──────────────────────────────┘  │
└───────────────────────┴────────────────────────────────────┘
```

### LEFT: 차량 정보 섹션

#### 차량 사진
- 메인 사진 표시 (높이: 300px 이상)
- 사진 하단에 정보 표시

#### 정보 탭 (Tab Navigation)

**1️⃣ 보험정보 탭**
```
보험 상세정보
- 일반자차: 자차 손해시 본인 부담 최소화
- 고급자차: 자차 손해시 더 많은 보장
- 완전자차: 자차 손해 전액 보장

면책금 정보:
- 일반자차: 100만원 이상
- 고급자차: 50만원 이상
- 완전자차: 0원 (전액 보장)
```

**2️⃣ 배차안내 탭**
```
배차 정보
- 배차지: 독도 렌트카 본점
- 위치: 경북 울릉군 울릉읍 ~
- 배차 시간: 대여시간 기준 ±10분
- 배차 준비물: 운전면허증, 신용카드, 주민등록증
```

**3️⃣ 약관및환불 탭**
```
약관 및 환불 정책
- 48시간 이전 취소: 100% 환불
- 24시간 이전 취소: 80% 환불
- 24시간 이내 취소: 50% 환불
- 예약 시간 이후: 환불 불가

전체 약관 보기 (링크)
```

---

### RIGHT: 가격 계산 섹션

#### 📊 가격 계산 로직

```
1. 기본 렌트료 계산
   - 대여 기간 계산: 2026.05.30 ~ 2026.06.01 = 2일 (48시간)
   - 성수기 확인: peak_seasons 테이블 조회
   - 적용 요금:
     * 평일: 70,000원/일
     * 주말: 80,000원/일
     * 성수기: 90,000원/일
   
   예시) 토-월-화: [주말 80,000] + [평일 70,000] = 150,000원

2. 시간 추가 요금 계산
   - 대여시간: 15:00, 반납시간: 20:00 → 5시간 초과
   - 초과 시간만 계산: 5시간 × 7,000원/시간 = 35,000원
   - (성수기면 5시간 × 9,000원 = 45,000원)

3. 보험료 계산 (일간 요금 기준)
   💡 핵심 규칙: 자정(00:00)을 기준으로 일자 증가
   
   예시) 2026.05.30 15:00 대여, 2026.06.01 10:00 반납
   - 1일차: 2026.05.30 15:00 ~ 2026.05.31 00:00 (9시간) → 1일 요금
   - 2일차: 2026.05.31 00:00 ~ 2026.06.01 00:00 (24시간) → 1일 요금
   - 3일차: 2026.06.01 00:00 ~ 2026.06.01 10:00 (10시간) → 1일 요금
   
   보험료 계산:
   - 완전자차 1일: 40,000원
   - 3일 분: 40,000 × 3 = 120,000원

4. 총합계 계산
   총합계 = 기본렌트료 + 시간추가료 + 보험료
          = 150,000 + 35,000 + 120,000
          = 305,000원
```

#### 🔄 보험 선택 시 동적 계산

```
사용자가 보험을 선택하면 실시간으로 합계 업데이트:

[미가입] 선택 → 합계: 185,000원
[일반자차 15,000/일] 선택 → 합계: 230,000원 (+ 45,000)
[고급자차 25,000/일] 선택 → 합계: 260,000원 (+ 75,000)
[완전자차 40,000/일] 선택 → 합계: 305,000원 (+ 120,000)
```

---

## 🗃️ 데이터베이스 - 시간/보험 계산 필드

### `reservations` 테이블 (수정)

```sql
CREATE TABLE reservations (
  reservation_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  
  -- 대여/반납 정보
  rental_start_date DATE NOT NULL,
  rental_start_time TIME NOT NULL,
  rental_end_date DATE NOT NULL,
  rental_end_time TIME NOT NULL,
  
  -- 기간 계산 필드
  total_days INT NOT NULL, -- 자정 기준 일수 (보험료 계산용)
  total_hours INT NOT NULL, -- 총 시간
  excess_hours INT DEFAULT 0, -- 24시간 초과 시간
  
  -- 가격 상세 필드
  base_price INT NOT NULL, -- 기본 렌트료
  hourly_addition_price INT DEFAULT 0, -- 시간 추가 요금
  insurance_type ENUM('미선택', '일반자차', '고급자차', '완전자차') DEFAULT '미선택',
  insurance_daily_rate INT DEFAULT 0, -- 선택한 보험의 일일 요금
  insurance_total_price INT DEFAULT 0, -- 보험료 (일일요금 × 일수)
  total_price INT NOT NULL, -- 합계
  
  -- 기타
  status ENUM('접수', '예약확정', '취소', '완료') DEFAULT '접수',
  payment_method ENUM('무통장입금', '카드결제') DEFAULT '무통장입금',
  payment_status ENUM('미결제', '결제완료', '환불') DEFAULT '미결제',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);
```

---

## 💻 백엔드 계산 함수 (Python 예시)

```python
from datetime import datetime, timedelta

def calculate_reservation_prices(
    vehicle_type_id: int,
    rental_start: datetime,
    rental_end: datetime,
    insurance_type: str,
    is_peak_season: bool
) -> dict:
    """
    예약료 계산 함수
    """
    
    # 1. 기본 렌트료 계산
    start_date = rental_start.date()
    end_date = rental_end.date()
    
    # 자정 기준 일수 (보험료 계산용)
    total_days = (end_date - start_date).days + 1
    
    # 시간 기준 일수 (렌트료 계산용)
    total_hours = (rental_end - rental_start).total_seconds() / 3600
    rental_days = total_hours / 24
    
    # 초과 시간 계산
    excess_hours = total_hours % 24 if total_hours % 24 > 0 else 0
    
    # 성수기/평일/주말 판정
    if is_peak_season:
        daily_rate = get_peak_daily_rate(vehicle_type_id)
        hourly_rate = get_peak_hourly_rate(vehicle_type_id)
    elif is_weekend(start_date):
        daily_rate = get_weekend_daily_rate(vehicle_type_id)
        hourly_rate = get_weekend_hourly_rate(vehicle_type_id)
    else:
        daily_rate = get_weekday_daily_rate(vehicle_type_id)
        hourly_rate = get_weekday_hourly_rate(vehicle_type_id)
    
    base_price = int(daily_rate * rental_days)
    hourly_addition_price = int(hourly_rate * excess_hours)
    
    # 2. 보험료 계산 (자정 기준 일수 사용)
    insurance_total_price = 0
    insurance_daily_rate = 0
    
    if insurance_type != '미선택':
        insurance_daily_rate = get_insurance_rate(vehicle_type_id, insurance_type)
        insurance_total_price = insurance_daily_rate * total_days
    
    # 3. 합계
    total_price = base_price + hourly_addition_price + insurance_total_price
    
    return {
        'base_price': base_price,
        'hourly_addition_price': hourly_addition_price,
        'insurance_type': insurance_type,
        'insurance_daily_rate': insurance_daily_rate,
        'insurance_total_price': insurance_total_price,
        'total_days': total_days,
        'total_hours': total_hours,
        'excess_hours': excess_hours,
        'total_price': total_price
    }
```

---

## ✅ 구현 체크리스트

- [ ] 메인 페이지 캘린더 UI (드래그 선택)
- [ ] 시간 선택 팝업 (탭 UI)
- [ ] 예약 가능 차량 조회 API
- [ ] 상세 페이지 레이아웃
- [ ] 가격 동적 계산 (보험 선택 시)
- [ ] 자정 기준 일수 계산 로직
- [ ] 탭 네비게이션 (보험정보/배차안내/약관)
- [ ] 결제 연동 (무통장/카드)
- [ ] 반응형 디자인 (모바일/태블릿/PC)
