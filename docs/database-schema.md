# 독도렌트카 시스템 데이터베이스 설계

## 📋 개요
독도렌트카 실시간 예약 시스템의 데이터베이스 구조

---

## 🗄️ 데이터베이스 테이블 설계

### 1. 사용자 관련 테이블

#### `users` - 예약자 정보
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `drivers` - 운전자 정보
```sql
CREATE TABLE drivers (
  driver_id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  license_number VARCHAR(50) NOT NULL UNIQUE,
  license_type ENUM('1종대형', '1종보통', '2종보통', '기타') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
);
```

---

### 2. 차량 관련 테이블

#### `vehicle_types` - 차종 정보
```sql
CREATE TABLE vehicle_types (
  type_id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('경차', '준중형', '중형', '대형', '준중SUV', '중형SUV', '대형SUV', '승합차') NOT NULL,
  manufacturer VARCHAR(50) NOT NULL, -- 현대, 기아, 제네시스, 쌍용, 르노 등
  model_name VARCHAR(100) NOT NULL, -- 모닝, 아반떼, 투싼 등
  fuel_type ENUM('가솔린', '디젤', '가솔린하이브리드', 'LPG', '바이뷰엘', '전기', '기타') NOT NULL,
  stock_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `vehicles` - 보유 차량
```sql
CREATE TABLE vehicles (
  vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
  type_id INT NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  color VARCHAR(50),
  registration_year INT,
  options TEXT, -- 차량 옵션 정보
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES vehicle_types(type_id)
);
```

---

### 3. 가격 관련 테이블

#### `pricing` - 차종별 요금
```sql
CREATE TABLE pricing (
  pricing_id INT PRIMARY KEY AUTO_INCREMENT,
  type_id INT NOT NULL,
  
  -- 일일 렌트료 (24시간 기준)
  weekday_daily_rate INT NOT NULL, -- 평일: 70,000원
  weekend_daily_rate INT NOT NULL, -- 주말: 80,000원
  peak_daily_rate INT NOT NULL, -- 연휴/성수기: 90,000원
  
  -- 시간 추가 요금
  weekday_hourly_rate INT NOT NULL, -- 평일: 7,000원
  weekend_hourly_rate INT NOT NULL, -- 주말: 8,000원
  peak_hourly_rate INT NOT NULL, -- 연휴/성수기: 9,000원
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES vehicle_types(type_id)
);
```

#### `insurance_pricing` - 보험 요금
```sql
CREATE TABLE insurance_pricing (
  insurance_id INT PRIMARY KEY AUTO_INCREMENT,
  type_id INT NOT NULL,
  insurance_type ENUM('일반자차', '고급자차', '완전자차') NOT NULL,
  
  -- 24시간 기준 요금
  daily_rate INT NOT NULL, -- 일반자차: 15,000원 / 고급자차: 25,000원 / 완전자차: 40,000원
  
  -- 24시간 초과시 1시간당 추가요금
  hourly_rate INT NOT NULL, -- 일반자차: 2,000원 / 고급자차: 3,500원 / 완전자차: 5,000원
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES vehicle_types(type_id),
  UNIQUE KEY (type_id, insurance_type)
);
```

---

### 4. 예약 관련 테이블

#### `reservations` - 예약 정보
```sql
CREATE TABLE reservations (
  reservation_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  
  -- 대여 정보
  rental_start_date DATE NOT NULL,
  rental_start_time TIME NOT NULL,
  rental_end_date DATE NOT NULL,
  rental_end_time TIME NOT NULL,
  
  -- 가격 정보
  base_price INT NOT NULL, -- 기본 렌트료
  additional_hour_price INT DEFAULT 0, -- 추가 시간 요금
  insurance_price INT DEFAULT 0, -- 보험료
  total_price INT NOT NULL,
  insurance_type ENUM('미선택', '일반자차', '고급자차', '완전자차') DEFAULT '미선택',
  
  -- 상태 정보
  status ENUM('접수', '예약확정', '취소', '완료') DEFAULT '접수',
  payment_method ENUM('무통장입금', '카드결제') DEFAULT '무통장입금',
  payment_status ENUM('미결제', '결제완료', '환불') DEFAULT '미결제',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  INDEX idx_rental_dates (rental_start_date, rental_end_date),
  INDEX idx_status (status)
);
```

---

### 5. 성수기 관리 테이블

#### `peak_seasons` - 성수기 정보
```sql
CREATE TABLE peak_seasons (
  season_id INT PRIMARY KEY AUTO_INCREMENT,
  season_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dates (start_date, end_date)
);
```

---

### 6. 관리자 기능 관련 테이블

#### `admin_users` - 관리자 계정
```sql
CREATE TABLE admin_users (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('관리자', '슈퍼관리자') DEFAULT '관리자',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

#### `payments` - 결제 관리
```sql
CREATE TABLE payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  reservation_id INT NOT NULL UNIQUE,
  amount INT NOT NULL,
  payment_method ENUM('무통장입금', '카드결제') NOT NULL,
  payment_status ENUM('미결제', '결제완료', '환불') DEFAULT '미결제',
  transaction_id VARCHAR(100),
  paid_at TIMESTAMP NULL,
  refunded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
);
```

---

## 📊 ERD (Entity-Relationship Diagram)

```
users (예약자)
  ├─→ reservations (예약)
  │    ├─→ vehicles (보유차량)
  │    │    └─→ vehicle_types (차종)
  │    │         ├─→ pricing (차종요금)
  │    │         └─→ insurance_pricing (보험요금)
  │    ├─→ drivers (운전자)
  │    ├─→ payments (결제)
  │    └─→ reservations (연결테이블)
  │
  └─→ peak_seasons (성수기)

admin_users (관리자)
```

---

## 🔑 주요 인덱스 (성능 최적화)

```sql
-- 예약 조회 성능 최적화
CREATE INDEX idx_reservations_dates ON reservations(rental_start_date, rental_end_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);

-- 성수기 조회 성능 최적화
CREATE INDEX idx_peak_seasons_dates ON peak_seasons(start_date, end_date);

-- 차량 조회 성능 최적화
CREATE INDEX idx_vehicles_type ON vehicles(type_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
```

---

## 📝 주요 쿼리 예제

### 1. 특정 날짜와 시간대의 예약 가능 차량 조회
```sql
SELECT DISTINCT vt.type_id, vt.model_name, COUNT(v.vehicle_id) as available_count
FROM vehicle_types vt
LEFT JOIN vehicles v ON vt.type_id = v.type_id
WHERE v.vehicle_id NOT IN (
  SELECT vehicle_id FROM reservations
  WHERE status != '취소'
  AND (
    (rental_start_date <= '2026-05-30' AND rental_end_date >= '2026-05-30')
    OR (rental_start_date <= '2026-06-01' AND rental_end_date >= '2026-05-31')
  )
)
AND v.is_active = TRUE
GROUP BY vt.type_id;
```

### 2. 날짜별 예약표 (캘린더 뷰)
```sql
SELECT 
  rental_start_date as date,
  vt.model_name as vehicle_type,
  COUNT(*) as reservation_count
FROM reservations r
JOIN vehicles v ON r.vehicle_id = v.vehicle_id
JOIN vehicle_types vt ON v.type_id = vt.type_id
WHERE r.status != '취소'
GROUP BY rental_start_date, vt.model_name
ORDER BY rental_start_date, vehicle_type;
```

### 3. 가격 계산
```sql
-- 예약 시 총 가격 계산 로직
SELECT 
  p.weekday_daily_rate,
  p.weekday_hourly_rate,
  ip.daily_rate as insurance_daily_rate,
  ip.hourly_rate as insurance_hourly_rate
FROM pricing p
LEFT JOIN insurance_pricing ip ON p.type_id = ip.type_id
WHERE p.type_id = ? AND ip.insurance_type = ?;
```

---

## ✅ 구현 체크리스트

- [ ] 모든 테이블 생성
- [ ] 인덱스 추가
- [ ] 외래 키 제약조건 설정
- [ ] 샘플 데이터 추가
- [ ] 트리거 및 저장 프로시저 구현 (선택사항)
- [ ] 백업 전략 수립
