// ==========================================
// 독도렌트카 예약 시스템 - JavaScript 로직
// ==========================================

// 더미 데이터: 성수기
const peakSeasons = [
    { id: 1, name: '여름휴가', startDate: '2026-07-15', endDate: '2026-08-31' },
    { id: 2, name: '추석', startDate: '2026-09-29', endDate: '2026-10-06' },
];

// 더미 데이터: 차종별 요금
const vehicleTypes = [
    {
        id: 1,
        name: '기아 아반떼',
        category: '준중형',
        manufacturer: '기아',
        model: '아반떼',
        weekday_daily: 70000,
        weekend_daily: 80000,
        peak_daily: 90000,
        weekday_hourly: 7000,
        weekend_hourly: 8000,
        peak_hourly: 9000,
    },
    {
        id: 2,
        name: '현대 투싼',
        category: '중형SUV',
        manufacturer: '현대',
        model: '투싼',
        weekday_daily: 80000,
        weekend_daily: 90000,
        peak_daily: 100000,
        weekday_hourly: 8000,
        weekend_hourly: 9000,
        peak_hourly: 10000,
    },
    {
        id: 3,
        name: '현대 스타렉스',
        category: '승합차',
        manufacturer: '현대',
        model: '스타렉스',
        weekday_daily: 90000,
        weekend_daily: 100000,
        peak_daily: 110000,
        weekday_hourly: 9000,
        weekend_hourly: 10000,
        peak_hourly: 11000,
    },
];

// 보험 요금 (일일 기준)
const insurancePricing = {
    미가입: { daily: 0, hourly: 0 },
    일반자차: { daily: 15000, hourly: 2000 },
    고급자차: { daily: 25000, hourly: 3500 },
    완전자차: { daily: 40000, hourly: 5000 },
};

// ==========================================
// 예약 상태 저장소
// ==========================================
let reservationData = {
    startDate: null,
    endDate: null,
    rentalTime: null,
    returnTime: null,
    pickupLocation: '울릉공항',
    isPeakSeason: false,
    isEarlyPickup: false, // 11:00 ~ 14:00 배차 여부
};

// ==========================================
// 1. 성수기 판정 함수
// ==========================================
function isPeakSeasonDate(date) {
    return peakSeasons.some(season => {
        const start = new Date(season.startDate);
        const end = new Date(season.endDate);
        return date >= start && date <= end;
    });
}

// ==========================================
// 2. 요일 판정 함수 (평일/주말)
// ==========================================
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // 0: 일요일, 6: 토요일
}

// ==========================================
// 3. 반납시간 자동 계산
// ==========================================
function calculateReturnTime(rentalTime, isPeak) {
    if (!rentalTime) return null;

    const [hours, minutes] = rentalTime.split(':').map(Number);

    // 11:00 ~ 14:00 배차는 반납시간 10:00 고정
    if (hours >= 11 && hours <= 14) {
        reservationData.isEarlyPickup = true;
        return '10:00';
    }

    // 성수기: 반납시간 = 대여시간 - 1시간
    if (isPeak) {
        let newHours = hours - 1;
        let newDay = 0; // 0: 같은날, -1: 전날

        if (newHours < 0) {
            newHours = 23;
            newDay = -1;
        }

        const result = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        return result;
    }

    // 일반: 반납시간 자유 (기본값은 대여시간 + 24시간)
    return null;
}

// ==========================================
// 4. 연장 시간 비용 계산 (핵심 규칙)
// ==========================================
function calculateExtensionFee(extensionHours, hourlyRate) {
    // 1시간 <= 연장 <= 2시간: 2시간 요금
    if (extensionHours > 0 && extensionHours <= 2) {
        return hourlyRate * 2;
    }
    // 3시간 이상: 실제 시간 요금
    if (extensionHours > 2) {
        return Math.ceil(hourlyRate * extensionHours);
    }
    return 0;
}

// ==========================================
// 5. 가격 계산 함수
// ==========================================
function calculatePrice(vehicleType, startDate, startTime, endDate, endTime, insuranceType = '미가입', isPeak = false) {
    // 시간 계산
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const totalHours = (end - start) / (1000 * 60 * 60);
    const rentalDays = totalHours / 24;

    // 성수기/평일/주말 판정
    let dailyRate, hourlyRate;
    
    if (isPeak) {
        dailyRate = vehicleType.peak_daily;
        hourlyRate = vehicleType.peak_hourly;
    } else if (isWeekend(startDate)) {
        dailyRate = vehicleType.weekend_daily;
        hourlyRate = vehicleType.weekend_hourly;
    } else {
        dailyRate = vehicleType.weekday_daily;
        hourlyRate = vehicleType.weekday_hourly;
    }

    // 기본 렌트료
    const basePrice = Math.round(dailyRate * rentalDays);

    // 초과 시간 계산
    const excessHours = totalHours % 24;
    const additionalHourPrice = calculateExtensionFee(excessHours, hourlyRate);

    // 보험료 계산 (자정 기준 일수)
    const fullDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const insurance = insurancePricing[insuranceType] || insurancePricing['미가입'];
    const insurancePrice = insurance.daily * fullDays;

    // 총합계
    const totalPrice = basePrice + additionalHourPrice + insurancePrice;

    return {
        basePrice,
        additionalHourPrice,
        insurancePrice,
        totalPrice,
        totalHours,
        fullDays,
        excessHours,
    };
}

// ==========================================
// 6. 캘린더 초기화
// ==========================================
function initCalendar() {
    flatpickr('#dateRange', {
        mode: 'range',
        minDate: 'today',
        locale: 'ko',
        dateFormat: 'Y.m.d',
        onClose: function(selectedDates) {
            if (selectedDates.length === 2) {
                const startDate = selectedDates[0];
                const endDate = selectedDates[1];

                reservationData.startDate = startDate.toISOString().split('T')[0];
                reservationData.endDate = endDate.toISOString().split('T')[0];

                // 성수기 판정
                reservationData.isPeakSeason = isPeakSeasonDate(startDate) || isPeakSeasonDate(endDate);

                // 시간 선택 필드 표시
                showTimeSelect();

                // 조회 버튼 활성화
                updateSearchButtonState();
            }
        },
    });
}

// ==========================================
// 7. 시간 선택 필드 표시
// ==========================================
function showTimeSelect() {
    const timeGroup = document.getElementById('timeSelectGroup');
    const pickupGroup = document.getElementById('pickupGroup');
    timeGroup.style.display = 'block';
    pickupGroup.style.display = 'block';

    // 대여시간 옵션 생성 (6:00 ~ 17:00)
    const rentalTimeSelect = document.getElementById('rentalTime');
    rentalTimeSelect.innerHTML = '<option value="">-- 대여시간 선택 --</option>';

    for (let i = 6; i <= 17; i++) {
        const time = `${String(i).padStart(2, '0')}:00`;
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        rentalTimeSelect.appendChild(option);
    }

    // 반납시간 변경 이벤트 설정
    rentalTimeSelect.addEventListener('change', handleRentalTimeChange);
}

// ==========================================
// 8. 대여시간 변경 이벤트
// ==========================================
function handleRentalTimeChange() {
    const rentalTime = document.getElementById('rentalTime').value;
    if (!rentalTime) return;

    reservationData.rentalTime = rentalTime;

    const returnTimeSelect = document.getElementById('returnTime');
    const peakWarning = document.getElementById('peakSeasonWarning');

    // 성수기 또는 11:00 ~ 14:00 배차 시간일 때
    if (reservationData.isPeakSeason || (parseInt(rentalTime) >= 11 && parseInt(rentalTime) <= 14)) {
        const autoReturnTime = calculateReturnTime(rentalTime, reservationData.isPeakSeason);
        
        // 반납시간 자동 설정 (비활성화)
        returnTimeSelect.innerHTML = `<option value="${autoReturnTime}">${autoReturnTime} (자동 고정)</option>`;
        returnTimeSelect.value = autoReturnTime;
        returnTimeSelect.disabled = true;
        peakWarning.classList.add('active');

        reservationData.returnTime = autoReturnTime;
    } else {
        // 일반: 반납시간 자유 선택
        returnTimeSelect.innerHTML = '<option value="">-- 반납시간 선택 --</option>';
        
        for (let i = 6; i <= 17; i++) {
            const time = `${String(i).padStart(2, '0')}:00`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            returnTimeSelect.appendChild(option);
        }
        
        returnTimeSelect.disabled = false;
        peakWarning.classList.remove('active');
        
        // 반납시간 변경 이벤트 설정
        returnTimeSelect.addEventListener('change', function() {
            reservationData.returnTime = this.value;
            updateSearchButtonState();
        });
    }

    updateSearchButtonState();
}

// ==========================================
// 9. 조회 버튼 상태 업데이트
// ==========================================
function updateSearchButtonState() {
    const searchBtn = document.getElementById('searchBtn');
    const isComplete = 
        reservationData.startDate &&
        reservationData.endDate &&
        reservationData.rentalTime &&
        reservationData.returnTime;

    searchBtn.disabled = !isComplete;
}

// ==========================================
// 10. 조회 버튼 클릭 이벤트
// ==========================================
function handleSearch() {
    const vehicleList = document.getElementById('vehicleList');
    const vehicleContainer = document.getElementById('vehicleContainer');

    vehicleContainer.innerHTML = '';

    // 더미 데이터로 차량 표시
    vehicleTypes.forEach(vehicle => {
        const price = calculatePrice(
            vehicle,
            reservationData.startDate,
            reservationData.rentalTime,
            reservationData.endDate,
            reservationData.returnTime,
            '미가입',
            reservationData.isPeakSeason
        );

        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'vehicle-card';
        vehicleCard.innerHTML = `
            <div class="vehicle-name">🚗 ${vehicle.name}</div>
            <div class="vehicle-details">
                <div class="detail-item">
                    <span class="detail-label">분류:</span>
                    <span class="detail-value">${vehicle.category}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">렌트료:</span>
                    <span class="detail-value">${price.basePrice.toLocaleString()}원</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">추가료:</span>
                    <span class="detail-value">${price.additionalHourPrice.toLocaleString()}원</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">예상 합계:</span>
                    <span class="detail-value">${price.totalPrice.toLocaleString()}원</span>
                </div>
            </div>
        `;

        vehicleCard.addEventListener('click', () => {
            handleVehicleSelect(vehicle, price);
        });

        vehicleContainer.appendChild(vehicleCard);
    });

    vehicleList.classList.add('active');
}

// ==========================================
// 11. 차량 선택 이벤트
// ==========================================
function handleVehicleSelect(vehicle, price) {
    const message = `
선택된 차량: ${vehicle.name}
기간: ${reservationData.startDate} ~ ${reservationData.endDate}
시간: ${reservationData.rentalTime} ~ ${reservationData.returnTime}
배차지: ${reservationData.pickupLocation}
예상 요금: ${price.totalPrice.toLocaleString()}원

(실제 시스템에서는 여기서 상세 페이지로 이동합니다)
    `;

    alert(message);
}

// ==========================================
// 12. 배차장소 선택 이벤트
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // 캘린더 초기화
    initCalendar();

    // 배차장소 라디오 버튼 이벤트
    const radioButtons = document.querySelectorAll('input[name="pickupLocation"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const customWrapper = document.getElementById('customLocationWrapper');
            
            if (this.value === 'custom') {
                customWrapper.classList.add('active');
                const customInput = document.getElementById('customLocation');
                customInput.addEventListener('change', function() {
                    reservationData.pickupLocation = this.value;
                });
            } else {
                customWrapper.classList.remove('active');
                reservationData.pickupLocation = this.value;
            }
        });
    });

    // 조회 버튼 클릭
    document.getElementById('searchBtn').addEventListener('click', handleSearch);

    // 초기화 버튼 클릭
    document.getElementById('resetBtn').addEventListener('click', function() {
        reservationData = {
            startDate: null,
            endDate: null,
            rentalTime: null,
            returnTime: null,
            pickupLocation: '울릉공항',
            isPeakSeason: false,
            isEarlyPickup: false,
        };

        document.getElementById('timeSelectGroup').style.display = 'none';
        document.getElementById('pickupGroup').style.display = 'none';
        document.getElementById('vehicleList').classList.remove('active');
        document.getElementById('peakSeasonWarning').classList.remove('active');
        updateSearchButtonState();
    });
});
