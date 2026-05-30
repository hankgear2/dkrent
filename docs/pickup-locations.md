# 배차장소 관리 기능 명세

## 📍 배차장소 기능 개요

예약 시스템에 배차장소 선택 기능을 추가하여 사용자가 원하는 위치에서 차량을 픽업할 수 있도록 하고, 관리자가 배차장소를 동적으로 관리할 수 있는 기능입니다.

---

## 🗄️ 데이터베이스 테이블 추가

### `pickup_locations` - 배차장소
```sql
CREATE TABLE pickup_locations (
  location_id INT PRIMARY KEY AUTO_INCREMENT,
  location_name VARCHAR(100) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  description TEXT, -- 배차장소 설명
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0, -- 정렬 순서
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_order (display_order)
);
```

### `reservations` 테이블 수정
```sql
ALTER TABLE reservations ADD COLUMN (
  pickup_location_id INT,
  pickup_location_custom VARCHAR(255), -- "직접입력" 선택 시 사용자 입력값
  FOREIGN KEY (pickup_location_id) REFERENCES pickup_locations(location_id)
);
```

---

## 📋 기본 배차장소 데이터

```sql
INSERT INTO pickup_locations (location_name, address, description, display_order) VALUES
('울릉공항', '경북 울릉군 서면 태하', '울릉 공항 터미널', 1),
('사동항 (크루즈)', '경북 울릉군 울릉읍 사동', '크루즈 전용 터미널', 2),
('도동항 (엘도라도, 묵호)', '경북 울릉군 울릉읍 도동', '엘도라도/묵호 페리 터미널', 3),
('저동항 (강릉)', '경북 울릉군 북면 저동', '강릉 페리 터미널', 4);
```

---

## 👤 사용자 - 예약 화면 (Reservation Screen)

### 배차장소 선택 UI

**위치**: 시간 선택 후, 조회 버튼 위에 추가

```
┌─────────────────────────────────────┐
│ 📍 배차장소 선택                      │
├─────────────────────────────────────┤
│ ◉ 울릉공항                           │
│ ○ 사동항 (크루즈)                    │
│ ○ 도동항 (엘도라도, 묵호)            │
│ ○ 저동항 (강릉)                      │
│ ○ 직접입력                           │
│   └─ [입력창: 배차장소를 입력하세요] │
└─────────────────────────────────────┘

[ 조회 ] 버튼
```

### 기능 설명

1. **라디오 버튼**: 한 개만 선택 가능
2. **기본 선택**: "울릉공항" (첫 번째)
3. **직접입력 옵션**:
   - 선택 시 입력 필드 활성화
   - 사용자가 자신의 배차 위치 입력
   - 최대 255자

### 배차장소 조회 API

```
GET /api/pickup-locations
응답:
{
  "status": "success",
  "data": [
    {
      "location_id": 1,
      "location_name": "울릉공항",
      "address": "경북 울릉군 서면 태하",
      "phone_number": "054-791-XXXX",
      "description": "울릉 공항 터미널"
    },
    {
      "location_id": 2,
      "location_name": "사동항 (크루즈)",
      "address": "경북 울릉군 울릉읍 사동",
      "phone_number": "054-792-XXXX",
      "description": "크루즈 전용 터미널"
    },
    ...
  ]
}
```

---

## 🔧 관리자 화면 (Admin Screen)

### 1. 예약설정 메뉴

**위치**: 관리자 대시보드 → 예약설정 → 배차장소관리

```
┌──────────────────────────────────────────────────────────┐
│ 예약 설정                                                │
│ ├─ 배차장소 관리 ← 클릭                                 │
│ ├─ 요금 설정                                             │
│ ├─ 성수기 설정                                           │
│ └─ 기타 설정                                             │
└──────────────────────────────────────────────────────────┘
```

### 2. 배차장소 관리 페이지

```
┌──────────────────────────────────────────────────────────┐
│ 배차장소 관리                             [+ 추가 버튼]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ # │ 장소명              │ 주소              │ 활성 │ 액션 │
├───┼────────────────────┼──────────────────┼─────┼──────┤
│ 1 │ 울릉공항            │ 경북 울릉군 서면  │ ✓   │ 수정 │
│   │                    │ 태하              │     │ 삭제 │
├───┼────────────────────┼──────────────────┼─────┼──────┤
│ 2 │ 사동항(크루즈)      │ 경북 울릉군 울릉  │ ✓   │ 수정 │
│   │                    │ 읍 사동           │     │ 삭제 │
├───┼────────────────────┼──────────────────┼─────┼──────┤
│ 3 │ 도동항(엘도라도,   │ 경북 울릉군 울릉  │ ✓   │ 수정 │
│   │ 묵호)              │ 읍 도동           │     │ 삭제 │
├───┼────────────────────┼──────────────────┼─────┼──────┤
│ 4 │ 저동항(강릉)       │ 경북 울릉군 북면  │ ✓   │ 수정 │
│   │                    │ 저동              │     │ 삭제 │
└───┴────────────────────┴──────────────────┴─────┴──────┘
```

### 3. 추가 버튼 (+) - 모달 팝업

```
┌─────────────────────────────────────────────┐
│ 배차장소 추가                          [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ 장소명 *                                    │
│ [___________]                               │
│                                             │
│ 주소 *                                      │
│ [_____________________]                     │
│                                             │
│ 전화번호                                    │
│ [___________]                               │
│                                             │
│ 설명                                        │
│ [_______________________]                   │
│ [_______________________]                   │
│                                             │
│ 활성 상태                                   │
│ ☑ 활성화                                    │
│                                             │
│ 정렬순서                                    │
│ [5]                                         │
│                                             │
│           [ 취소 ]  [ 저장 ]                │
└─────────────────────────────────────────────┘
```

### 4. 수정 버튼 - 모달 팝업

```
┌─────────────────────────────────────────────┐
│ 배차장소 수정                          [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ 장소명 *                                    │
│ [울릉공항_____]                             │
│                                             │
│ 주소 *                                      │
│ [경북 울릉군 서면 태하_]                    │
│                                             │
│ 전화번호                                    │
│ [054-791-XXXX_]                             │
│                                             │
│ 설명                                        │
│ [울릉 공항 터미널____]                      │
│                                             │
│ 활성 상태                                   │
│ ☑ 활성화                                    │
│                                             │
│ 정렬순서                                    │
│ [1]                                         │
│                                             │
│    [ 취소 ]  [ 수정 ]  [ 삭제 ]            │
└─────────────────────────────────────────────┘
```

### 5. 삭제 버튼 - 확인 다이얼로그

```
┌──────────────────────────────────────────┐
│ 경고                                 [X] │
├──────────────────────────────────────────┤
│                                          │
│ "울릉공항" 배차장소를 삭제하시겠습니까?  │
│                                          │
│ ⚠️ 이 작업은 취소할 수 없습니다.         │
│ 관련된 예약 정보는 유지됩니다.           │
│                                          │
│          [ 취소 ]  [ 삭제 ]              │
└──────────────────────────────────────────┘
```

---

## 🔌 API 명세

### 1. 배차장소 목록 조회
```
GET /api/admin/pickup-locations
응답:
{
  "status": "success",
  "data": [
    {
      "location_id": 1,
      "location_name": "울릉공항",
      "address": "경북 울릉군 서면 태하",
      "phone_number": "054-791-XXXX",
      "description": "울릉 공항 터미널",
      "is_active": true,
      "display_order": 1
    }
  ]
}
```

### 2. 배차장소 추가
```
POST /api/admin/pickup-locations
요청:
{
  "location_name": "새로운 배차지",
  "address": "주소",
  "phone_number": "연락처",
  "description": "설명",
  "is_active": true,
  "display_order": 5
}

응답:
{
  "status": "success",
  "message": "배차장소가 추가되었습니다.",
  "data": {
    "location_id": 5,
    "location_name": "새로운 배차지"
  }
}
```

### 3. 배차장소 수정
```
PUT /api/admin/pickup-locations/:location_id
요청:
{
  "location_name": "수정된 배차지",
  "address": "새 주소",
  "phone_number": "새 연락처",
  "description": "새 설명",
  "is_active": true,
  "display_order": 1
}

응답:
{
  "status": "success",
  "message": "배차장소가 수정되었습니다.",
  "data": {
    "location_id": 1,
    "location_name": "수정된 배차지"
  }
}
```

### 4. 배차장소 삭제
```
DELETE /api/admin/pickup-locations/:location_id
응답:
{
  "status": "success",
  "message": "배차장소가 삭제되었습니다."
}
```

### 5. 배차장소 순서 변경 (Drag & Drop)
```
PUT /api/admin/pickup-locations/reorder
요청:
{
  "locations": [
    { "location_id": 2, "display_order": 1 },
    { "location_id": 1, "display_order": 2 },
    { "location_id": 3, "display_order": 3 }
  ]
}

응답:
{
  "status": "success",
  "message": "순서가 변경되었습니다."
}
```

---

## 🔐 접근 제어

- **사용자**: 배차장소 조회만 가능
- **관리자**: CRUD 모든 작업 가능

```python
# 예시 (권한 검증)
@require_admin
def manage_pickup_locations():
    # 관리자만 접근 가능
    pass
```

---

## 📊 배차장소별 예약 통계 (선택사항)

관리자 대시보드에 추가할 수 있는 기능:

```sql
SELECT 
  pl.location_name,
  COUNT(r.reservation_id) as total_reservations,
  SUM(r.total_price) as total_revenue
FROM pickup_locations pl
LEFT JOIN reservations r ON pl.location_id = r.pickup_location_id
WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY pl.location_id
ORDER BY total_reservations DESC;
```

---

## ✅ 구현 체크리스트

**데이터베이스**
- [ ] `pickup_locations` 테이블 생성
- [ ] `reservations` 테이블 수정 (location_id, location_custom 추가)
- [ ] 초기 배차장소 데이터 입력

**사용자 화면**
- [ ] 배차장소 선택 UI (라디오 버튼)
- [ ] 직접입력 옵션 및 입력 필드
- [ ] 배차장소 API 연동
- [ ] 선택 값 예약 정보에 저장

**관리자 화면**
- [ ] 배차장소 관리 페이지 UI
- [ ] 추가 모달 팝업 (폼 검증)
- [ ] 수정 모달 팝업 (기존 데이터 로드)
- [ ] 삭제 기능 (확인 다이얼로그)
- [ ] 활성/비활성 토글
- [ ] 정렬 순서 변경 (Drag & Drop 선택사항)

**API**
- [ ] GET /api/pickup-locations (사용자)
- [ ] GET /api/admin/pickup-locations (관리자)
- [ ] POST /api/admin/pickup-locations (추가)
- [ ] PUT /api/admin/pickup-locations/:id (수정)
- [ ] DELETE /api/admin/pickup-locations/:id (삭제)
- [ ] PUT /api/admin/pickup-locations/reorder (순서 변경)

**테스트**
- [ ] 배차장소 선택 후 예약 가능 확인
- [ ] 관리자 추가/수정/삭제 기능 테스트
- [ ] 직접입력 데이터 저장 확인
- [ ] 권한 검증 테스트
