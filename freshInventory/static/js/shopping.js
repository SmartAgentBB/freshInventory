document.addEventListener('DOMContentLoaded', () => {
    const logoBtn = document.getElementById('logo-btn');
    const cookingBtn = document.getElementById('cooking-btn');
    const shoppingListBtn = document.getElementById('shoppinglist-btn');
    const shoppingList = document.getElementById('shopping-list');
    const completedShopping = document.getElementById('completed-shopping');
    const shoppingCount = document.getElementById('shopping-count');
    const shoppingBadge = document.getElementById('shopping-badge');
    
    // 달력 네비게이션을 위한 전역 변수
    let currentCalendarYear = new Date().getFullYear();
    let currentCalendarMonth = new Date().getMonth();
    let allHistoryItems = []; // 모든 히스토리 데이터를 저장할 변수

    // 로고 버튼 클릭 이벤트 (index 화면으로 이동)
    logoBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    // Cooking 버튼 클릭 이벤트
    cookingBtn.addEventListener('click', () => {
        window.location.href = '/cooking.html';
    });

    // Function to update shopping badge
    const updateShoppingBadge = async () => {
        try {
            const response = await fetch('/api/shopping-list/count');
            const data = await response.json();
            const count = data.count || 0;
            
            if (shoppingBadge) {
                shoppingBadge.textContent = count;
                if (count > 0) {
                    shoppingBadge.style.display = 'flex';
                } else {
                    shoppingBadge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating shopping badge:', error);
        }
    };

    // Shopping list button click event (현재 페이지이므로 아무것도 하지 않음)
    shoppingListBtn.addEventListener('click', () => {
        // 현재 페이지이므로 아무것도 하지 않음
    });

    // 탭 전환 기능
    function setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 모든 탭 버튼의 스타일 초기화
                tabButtons.forEach(btn => {
                    btn.classList.remove('border-cyan-500', 'text-cyan-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                    // 인라인 스타일도 제거
                    btn.style.removeProperty('color');
                    btn.style.removeProperty('border-bottom-color');
                });
                
                // 클릭된 탭 버튼 활성화
                this.classList.remove('border-transparent', 'text-gray-500');
                this.classList.add('border-cyan-500', 'text-cyan-600');
                // 인라인 스타일로 강제 적용
                this.style.color = '#0891b2'; // cyan-600
                this.style.borderBottomColor = '#0891b2'; // cyan-600
                
                // 탭별 콘텐츠 전환
                const tabId = this.id;
                switch(tabId) {
                    case 'tab-shopping':
                        showShoppingTab();
                        break;
                    case 'tab-history':
                        showHistoryTab();
                        break;
                }
            });
        });
    }

    // 장보기 탭 표시
    function showShoppingTab() {
        const shoppingTab = document.getElementById('shopping-tab');
        const historyTab = document.getElementById('history-tab');
        
        if (shoppingTab) shoppingTab.classList.remove('hidden');
        if (historyTab) historyTab.classList.add('hidden');
    }

    // 지난 기록 탭 표시
    async function showHistoryTab() {
        const shoppingTab = document.getElementById('shopping-tab');
        const historyTab = document.getElementById('history-tab');
        
        if (shoppingTab) shoppingTab.classList.add('hidden');
        if (historyTab) historyTab.classList.remove('hidden');
        
        // 지난 기록 데이터 로드
        await fetchHistory();
    }

    // 지난 기록 데이터 가져오기
    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/shopping-list');
            if (response.ok) {
                const shoppingItems = await response.json();
                // todo가 false인 완료된 쇼핑 항목들만 필터링
                const completedItems = shoppingItems.filter(item => item.todo === false);
                allHistoryItems = completedItems; // 모든 히스토리 데이터 저장
                
                
                
                // 달력 생성 및 데이터 표시
                generateCalendar(completedItems);
            } else {
                console.error('Failed to fetch shopping history');
            }
        } catch (error) {
            console.error('Error fetching shopping history:', error);
        }
    };

    // 지난 기록 표시 (인벤토리 히스토리 데이터를 날짜별로 그룹화)
    const displayHistoryItems = async (historyItems) => {
        const historyTable = document.getElementById('history-table');
        
        historyTable.innerHTML = '';
        
        if (!historyItems || historyItems.length === 0) {
            historyTable.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    해당 월의 기록이 없습니다.
                </div>
            `;
            return;
        }
        
        // 날짜별로 그룹화
        const groupedByDate = {};
        historyItems.forEach(item => {
            const dateKey = item.updateDate.split('T')[0]; // YYYY-MM-DD 형식
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            // 쇼핑 리스트 데이터의 경우 name을 사용하여 아이템 정보를 표시
            groupedByDate[dateKey].push({
                name: item.name,
                memo: item.memo
            });
        });
        
        // 날짜별로 중복 제거 (같은 날짜에 같은 name이 여러 개 있으면 하나만)
        Object.keys(groupedByDate).forEach(dateKey => {
            const uniqueItems = [];
            const seenNames = new Set();
            groupedByDate[dateKey].forEach(item => {
                if (!seenNames.has(item.name)) {
                    seenNames.add(item.name);
                    uniqueItems.push(item);
                }
            });
            groupedByDate[dateKey] = uniqueItems;
        });
        
        // 날짜순으로 정렬 (최신순)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
        
        // 각 날짜별로 별도 테이블 생성
        sortedDates.forEach(dateKey => {
            const items = groupedByDate[dateKey];
            const date = new Date(dateKey);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const weekday = weekdays[date.getDay()];
            const formattedDate = `${month}월 ${day}일 (${weekday})`;
            
            // 날짜별 테이블 컨테이너 (장보기 탭과 동일한 스타일)
            const tableContainer = document.createElement('div');
            tableContainer.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6';
            
            // 아이템 정보 생성
            const itemsInfo = items.map(item => {
                let itemText = item.name;
                if (item.memo) {
                    itemText += ` (${item.memo})`;
                }
                return itemText;
            }).join(', ');
            
            // 테이블 내용
            tableContainer.innerHTML = `
                <div class="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 class="text-md font-semibold text-gray-800">${formattedDate}</h3>
                </div>
                <div class="p-4">
                    <p class="text-sm text-gray-800">${itemsInfo}</p>
                </div>
            `;
            
            historyTable.appendChild(tableContainer);
        });
    };

    // 탭 전환 기능 초기화
    setupTabNavigation();

    // 쇼핑 목록 데이터 가져오기
    const fetchShoppingList = async () => {
        try {
            const response = await fetch('/api/shopping-list');
            const shoppingData = await response.json();
            
            // todo가 true인 항목들 (쇼핑 목록)
            const todoItems = shoppingData.filter(item => item.todo === true);
            
            // todo가 false인 항목들 (완료한 쇼핑) - 중복 제거 및 최신순 정렬
            const completedItems = shoppingData
                .filter(item => item.todo === false)
                .sort((a, b) => new Date(b.updateDate) - new Date(a.updateDate)) // 최신순 정렬
                .filter((item, index, self) => 
                    index === self.findIndex(t => t.name === item.name) // 중복 제거 (이름 기준)
                )
                .slice(0, 5); // 최대 5개만 표시
            
            displayShoppingList(todoItems);
            displayCompletedShopping(completedItems);
            
            shoppingCount.textContent = `총 ${todoItems.length}개`;
            
        } catch (error) {
            console.error('Error fetching shopping list:', error);
        }
    };

    // 쇼핑 목록 표시
    const displayShoppingList = (items) => {
        shoppingList.innerHTML = '';
        
        if (items.length === 0) {
            shoppingList.innerHTML = `
                <div class="p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                    <p class="text-gray-500">쇼핑 목록이 비어있습니다</p>
                </div>
            `;
            return;
        }
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'p-4 hover:bg-gray-50 transition-colors';
            itemElement.setAttribute('data-item-id', item.id);
            
            itemElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center cursor-pointer toggle-shopping-item" data-item-id="${item.id}" data-todo="true">
                            <svg class="w-3 h-3 text-white hidden" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="flex-grow">
                            <p class="text-sm font-medium text-gray-800">${item.name}</p>
                            ${item.memo ? `<p class="text-xs text-gray-500 mt-1">${item.memo}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">${formatDate(item.updateDate)}</span>
                        <button class="text-gray-400 hover:text-red-500 delete-shopping-item" data-item-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            shoppingList.appendChild(itemElement);
        });
    };

    // 완료한 쇼핑 표시
    const displayCompletedShopping = (items) => {
        completedShopping.innerHTML = '';
        
        if (items.length === 0) {
            completedShopping.innerHTML = `
                <div class="p-8 text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-gray-500">완료한 쇼핑이 없습니다</p>
                </div>
            `;
            return;
        }
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'p-4 hover:bg-gray-50 transition-colors';
            itemElement.setAttribute('data-item-id', item.id);
            
            itemElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-5 h-5 bg-green-500 border-2 border-green-500 rounded-full flex items-center justify-center cursor-pointer toggle-shopping-item" data-item-id="${item.id}" data-todo="false">
                            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <div class="flex-grow">
                            <p class="text-sm font-medium text-gray-500 line-through">${item.name}</p>
                            ${item.memo ? `<p class="text-xs text-gray-400 mt-1 line-through">${item.memo}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">${formatDate(item.updateDate)}</span>
                        <button class="text-gray-400 hover:text-red-500 delete-shopping-item" data-item-id="${item.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            completedShopping.appendChild(itemElement);
        });
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        
        // 날짜만 비교하기 위해 시간을 제거
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffTime = nowOnly.getTime() - dateOnly.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return '오늘';
        } else if (diffDays === 1) {
            return '어제';
        } else {
            // "8월 8일 (금)" 형식으로 표시
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            return `${month}월 ${day}일 (${dayOfWeek})`;
        }
    };

    // 쇼핑 아이템 토글 이벤트
    document.addEventListener('click', async (event) => {
        const toggleBtn = event.target.closest('.toggle-shopping-item');
        if (toggleBtn) {
            const itemId = parseInt(toggleBtn.dataset.itemId);
            const currentTodo = toggleBtn.dataset.todo === 'true';
            const newTodo = !currentTodo;
            
            try {
                const response = await fetch('/api/shopping-list/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        itemId: itemId,
                        todo: newTodo
                    })
                });
                
                if (response.ok) {
                    // 페이지 새로고침
                    fetchShoppingList();
                    // 뱃지 업데이트
                    updateShoppingBadge();
                } else {
                    console.error('Failed to toggle shopping item');
                }
            } catch (error) {
                console.error('Error toggling shopping item:', error);
            }
        }
    });

    // 쇼핑 아이템 삭제 이벤트
    document.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('.delete-shopping-item');
        if (deleteBtn) {
            const itemId = parseInt(deleteBtn.dataset.itemId);
            
            if (confirm('이 항목을 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(`/api/shopping-list/${itemId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        // 페이지 새로고침
                        fetchShoppingList();
                        // 뱃지 업데이트
                        updateShoppingBadge();
                    } else {
                        console.error('Failed to delete shopping item');
                    }
                } catch (error) {
                    console.error('Error deleting shopping item:', error);
                }
            }
        }
    });

    // 쇼핑 아이템 추가 Enter 키 처리
    const handleAddItemEnter = (event) => {
        if (event.key === 'Enter') {
            addShoppingItem();
        }
    };

    // 쇼핑 아이템 추가
    const addShoppingItem = async () => {
        const input = document.getElementById('new-shopping-item');
        const itemName = input.value.trim();
        
        if (!itemName) {
            alert('재료 이름을 입력해주세요.');
            return;
        }
        
        try {
            const response = await fetch('/api/shopping-list/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: itemName
                })
            });
            
            const result = await response.json();
            if (result.success) {
                // 입력창 초기화
                input.value = '';
                
                // 쇼핑 목록 새로고침
                setTimeout(() => {
                    fetchShoppingList();
                }, 500);
                
                // 뱃지 업데이트
                updateShoppingBadge();
            } else {
                console.error('Failed to add shopping item:', result.error);
                // 서버에서 받은 에러 메시지를 표시하거나 기본 메시지 사용
                const errorMessage = result.error || '쇼핑 아이템 추가에 실패했습니다.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Shopping item add 실패:', error);
            alert('쇼핑 아이템 추가에 실패했습니다.');
        }
    };

    // 달력 생성 함수
    const generateCalendar = (historyItems) => {
        const calendarContainer = document.getElementById('calendar-container');
        const calendarTitle = document.getElementById('calendar-title');
        
        if (!calendarContainer) return;
        
        // 월 제목 업데이트
        calendarTitle.textContent = `${currentCalendarYear}년 ${currentCalendarMonth + 1}월`;
        
        // 현재 표시 중인 달의 데이터만 필터링
        const filteredHistoryItems = historyItems.filter(item => {
            const itemDate = new Date(item.updateDate);
            return itemDate.getFullYear() === currentCalendarYear && itemDate.getMonth() === currentCalendarMonth;
        });
        

        
        // 필터링된 데이터로 히스토리 테이블 업데이트
        displayHistoryItems(filteredHistoryItems);
        
        // 데이터가 있는 날짜들 추출
        const datesWithData = new Set();
        historyItems.forEach(item => {
            const itemDate = new Date(item.updateDate);
            
            if (itemDate.getFullYear() === currentCalendarYear && itemDate.getMonth() === currentCalendarMonth) {
                datesWithData.add(itemDate.getDate());
            }
        });
        
        // 달력 HTML 생성
        const now = new Date();
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = '<div class="text-sm w-full" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0;">';
        
        // 요일 헤더
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        weekdays.forEach(day => {
            calendarHTML += `<div class="text-center text-xs text-gray-500 py-1 border-b border-gray-200">${day}</div>`;
        });
        
        // 날짜들
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === currentCalendarMonth;
            const isToday = currentDate.toDateString() === now.toDateString() && isCurrentMonth;
            const hasData = datesWithData.has(currentDate.getDate());
            

            
            let dateClass = 'text-center py-1 relative border-b border-gray-100 min-h-[2rem] flex flex-col items-center justify-center';
            let dateText = currentDate.getDate();
            
            if (!isCurrentMonth) {
                dateClass += ' text-gray-300';
            } else if (isToday) {
                dateClass += ' text-cyan-600 font-semibold';
            } else if (currentDate.getDay() === 0) { // 일요일
                dateClass += ' text-red-500';
            } else if (currentDate.getDay() === 6) { // 토요일
                dateClass += ' text-blue-500';
            } else {
                dateClass += ' text-gray-700';
            }
            
            // 데이터가 있는 날짜는 배경색과 테두리 변경
            if (hasData && isCurrentMonth) {
                dateClass += ' bg-cyan-50 border-cyan-200';
            }
            
            // 인라인 스타일 추가
            let inlineStyle = '';
            if (hasData && isCurrentMonth) {
                inlineStyle = ' style="background-color: #ecfeff; border-color: #67e8f9;"';
            }
            
            calendarHTML += `<div class="${dateClass}"${inlineStyle}>`;
            calendarHTML += `<div class="text-xs">${dateText}</div>`;
            
            // 데이터가 있는 날짜에 점 표시 (더 눈에 띄게)
            if (hasData && isCurrentMonth) {
                calendarHTML += '<div class="w-2 h-2 bg-red-500 rounded-full mt-0.5" style="background-color: #ef4444;"></div>';
            }
            
            calendarHTML += '</div>';
        }
        
        calendarHTML += '</div>';
        calendarContainer.innerHTML = calendarHTML;
    };

    // 달력 네비게이션 이벤트 리스너
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            generateCalendar(allHistoryItems); // 저장된 히스토리 데이터로 달력 업데이트
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            generateCalendar(allHistoryItems); // 저장된 히스토리 데이터로 달력 업데이트
        });
    }

    // 전역 함수로 등록 (HTML에서 호출하기 위해)
    window.handleAddItemEnter = handleAddItemEnter;
    window.addShoppingItem = addShoppingItem;

    // 초기 데이터 로드
    fetchShoppingList();
    
    // 초기 뱃지 업데이트
    updateShoppingBadge();
    
    // 초기 달력 표시 (빈 달력)
    generateCalendar([]);
});
