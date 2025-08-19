document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.getElementById('add-item-btn');
    const addItemModal = document.getElementById('add-item-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const closeModal = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const aiResults = document.getElementById('ai-results');
    const inventoryList = document.getElementById('inventory-list');
    const itemCount = document.getElementById('item-count');
    const sortNewestBtn = document.getElementById('sort-newest');
    const sortOldestBtn = document.getElementById('sort-oldest');
    const sortUrgentBtn = document.getElementById('sort-urgent');
    const sortFrozenNewestBtn = document.getElementById('sort-frozen-newest');
    const sortFrozenOldestBtn = document.getElementById('sort-frozen-oldest');
    const shoppingBadge = document.getElementById('shopping-badge');
    
    // Tab elements
    const tabCurrent = document.getElementById('tab-current');
    const tabFrozen = document.getElementById('tab-frozen');
    const tabHistory = document.getElementById('tab-history');
    const currentInventoryTab = document.getElementById('current-inventory-tab');
    const frozenTab = document.getElementById('frozen-tab');
    const historyTab = document.getElementById('history-tab');
    const historyTable = document.getElementById('history-table');
    const historyCount = document.getElementById('history-count');
    const frozenList = document.getElementById('frozen-list');
    const frozenCount = document.getElementById('frozen-count');
    
    // Edit remains modal elements
    const editRemainsModal = document.getElementById('edit-remains-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const consumeBtn = document.getElementById('consume-btn');
    const freezeBtn = document.getElementById('freeze-btn');
    const wasteBtn = document.getElementById('waste-btn');
    const remainsSlider = document.getElementById('remains-slider');
    const remainsValue = document.getElementById('remains-value');
    
    // Edit modal item info elements
    const editItemImage = document.getElementById('edit-item-image');
    const editItemName = document.getElementById('edit-item-name');
    const editItemQuantity = document.getElementById('edit-item-quantity');
    const editItemDate = document.getElementById('edit-item-date');
    const editItemExpiry = document.getElementById('edit-item-expiry');
    const historyTableBody = document.getElementById('history-table-body');
    const storageDesc = document.getElementById('storage-desc');
    const storageMethod = document.getElementById('storage-method');

    let analyzedItems = []; // To store items analyzed by AI
    let currentInventoryItems = []; // To store current inventory items
    let frozenItems = []; // To store frozen items
    let currentSortOrder = 'newest';
    let frozenSortOrder = 'newest';
    let currentTab = 'current'; // 'current', 'frozen', or 'history'
    let currentEditItem = null; // To store current item being edited
    let searchQuery = ''; // To store current search query

    // Function to update shopping badge
    const updateShoppingBadge = async () => {
        try {
            console.log('Updating shopping badge...');
            const response = await fetch('/api/shopping-list/count');
            const data = await response.json();
            const count = data.count || 0;
            
            console.log('Shopping badge count:', count);
            console.log('Shopping badge element:', shoppingBadge);
            
            if (shoppingBadge) {
                shoppingBadge.textContent = count;
                if (count > 0) {
                    shoppingBadge.style.display = 'flex';
                    console.log('Shopping badge should be visible');
                } else {
                    shoppingBadge.style.display = 'none';
                    console.log('Shopping badge should be hidden');
                }
            } else {
                console.error('Shopping badge element not found');
            }
        } catch (error) {
            console.error('Error updating shopping badge:', error);
        }
    };

    const fetchInventory = async () => {
        try {
            console.log('Fetching inventory...');
            const response = await fetch('/api/inventory');
            const items = await response.json();
            console.log('Fetched inventory items:', items);
            
            // Store items for sorting
            currentInventoryItems = items;
            
            // Sort and display items
            displayInventoryItems();
        } catch (error) {
            console.error('Error fetching inventory:', error);
            inventoryList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">재고 목록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    };

    const fetchFrozen = async () => {
        try {
            const response = await fetch('/api/frozen');
            const items = await response.json();
            
            // Store items for sorting
            frozenItems = items;
            
            // Sort and display items
            displayFrozenItems();
        } catch (error) {
            console.error('Error fetching frozen items:', error);
            frozenList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">냉동 목록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    };

    const displayFrozenItems = () => {
        frozenList.innerHTML = ''; // Clear existing items
        
        // Filter items by search query
        const filteredItems = filterItemsBySearch(frozenItems);
        
        // 업데이트 아이템 카운트 (필터링된 결과 기준)
        frozenCount.textContent = `총 ${filteredItems.length}개`;
        
        if (filteredItems.length === 0) {
            if (searchQuery) {
                // 검색 결과가 없는 경우
                frozenList.innerHTML = `
                    <div class="text-center py-12">
                        <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <p class="text-gray-500 text-lg font-medium">검색 결과가 없습니다</p>
                        <p class="text-gray-400 text-sm mt-1">다른 검색어를 입력해보세요</p>
                    </div>
                `;
            } else {
                // 냉동이 비어있는 경우
                frozenList.innerHTML = `
                    <div class="text-center py-12">
                        <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <p class="text-gray-500 text-lg font-medium">냉동이 비어있습니다</p>
                        <p class="text-gray-400 text-sm mt-1">새로운 냉동 식재료를 추가해보세요!</p>
                    </div>
                `;
            }
            return;
        }
        
        // Sort items based on current sort order
        const sortedItems = [...filteredItems].sort((a, b) => {
            const dateA = new Date(a.addedAt);
            const dateB = new Date(b.addedAt);
            return frozenSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        sortedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative';
            
            const addedAtDate = new Date(item.addedAt);
            const today = new Date();
            
            // 시간을 제거하고 날짜만 비교
            const addedDateOnly = new Date(addedAtDate.getFullYear(), addedAtDate.getMonth(), addedAtDate.getDate());
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            const timeDiff = todayDateOnly.getTime() - addedDateOnly.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            let formattedDate;
            if (daysDiff === 0) {
                formattedDate = "저장: 오늘";
            } else {
                formattedDate = `저장: ${daysDiff}일`;
            }

            itemDiv.innerHTML = `
                <!-- 삭제 버튼을 오른쪽 위 모서리에 배치 -->
                <button class="delete-inventory-item-btn absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors z-20" data-id="${item.id}" style="position: absolute; top: 8px; right: 8px;">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                
                <div class="flex items-center space-x-4 cursor-pointer pr-8" data-item-id="${item.id}">
                    <div class="flex-shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover border border-gray-200">
                    </div>
                    <div class="flex-grow min-w-0">
                        <h3 class="text-lg font-semibold text-gray-800 truncate">${item.name}</h3>
                        <div class="flex items-center justify-between mt-2 mb-3">
                            <span class="text-sm text-gray-600">수량: ${item.quantity}</span>
                            <span class="text-sm text-gray-500">${formattedDate}</span>
                        </div>
                        <div class="mt-3">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs text-gray-500">남은 양</span>
                                <span class="text-xs font-medium text-gray-700">${Math.round(item.remains * 100)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-cyan-500 h-2 rounded-full transition-all duration-300" style="width: ${item.remains * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add click event to open detail modal
            const itemContent = itemDiv.querySelector('[data-item-id]');
            itemContent.addEventListener('click', () => {
                openEditModal(item);
            });
            
            // Add delete button event listener
            const deleteBtn = itemDiv.querySelector('.delete-inventory-item-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent modal from opening
                
                const confirmed = confirm('이 항목을 삭제하시겠습니까?');
                if (!confirmed) return;
                
                try {
                    const response = await fetch(`/api/inventory/${item.id}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        fetchFrozen(); // Refresh frozen list
                    } else {
                        alert('삭제에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Error deleting item:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                }
            });
            
            frozenList.appendChild(itemDiv);
        });
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/inventory/history');
            if (response.ok) {
                const historyItems = await response.json();
                await displayHistoryItems(historyItems);
            } else {
                console.error('Failed to fetch history');
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const switchTab = (tabName) => {
        currentTab = tabName;
        
        // Update tab button styles
        if (tabName === 'current') {
            tabCurrent.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-cyan-500 text-cyan-600 transition-colors';
            tabFrozen.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            tabHistory.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            currentInventoryTab.classList.remove('hidden');
            frozenTab.classList.add('hidden');
            historyTab.classList.add('hidden');
        } else if (tabName === 'frozen') {
            tabCurrent.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            tabFrozen.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-cyan-500 text-cyan-600 transition-colors';
            tabHistory.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            currentInventoryTab.classList.add('hidden');
            frozenTab.classList.remove('hidden');
            historyTab.classList.add('hidden');
            fetchFrozen(); // Load frozen data when switching to frozen tab
            updateFrozenSortButtons(); // Update sort button states
        } else {
            tabCurrent.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            tabFrozen.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors';
            tabHistory.className = 'tab-btn px-6 py-3 text-sm font-medium border-b-2 border-cyan-500 text-cyan-600 transition-colors';
            currentInventoryTab.classList.add('hidden');
            frozenTab.classList.add('hidden');
            historyTab.classList.remove('hidden');
            fetchHistory(); // Load history data when switching to history tab
        }
    };

    const displayHistoryItems = async (historyItems) => {
        historyTable.innerHTML = '';
        
        if (historyItems.length === 0) {
            historyTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        지난 기록이 없습니다.
                    </td>
                </tr>
            `;
            historyCount.textContent = `총 0개`;
            return;
        }
        
        // 최근에 remains이 0이된 재료를 중복되지 않는 항목으로 10개까지만 필터링
        const uniqueItems = [];
        const seenNames = new Set();
        
        // consumedAt 기준으로 최신순 정렬 후 중복 제거
        const sortedItems = historyItems.sort((a, b) => new Date(b.consumedAt) - new Date(a.consumedAt));
        
        for (const item of sortedItems) {
            if (!seenNames.has(item.name) && uniqueItems.length < 10) {
                seenNames.add(item.name);
                uniqueItems.push(item);
            }
        }
        
        historyCount.textContent = `총 ${uniqueItems.length}개`;
        
        // Get shopping list data to check which items are in todo list
        let shoppingList = [];
        try {
            const shoppingResponse = await fetch('/api/shopping-list');
            shoppingList = await shoppingResponse.json();
        } catch (error) {
            console.error('Error fetching shopping list:', error);
        }
        
        // Create a set of todo item names for faster lookup
        const todoItemNames = new Set(
            shoppingList
                .filter(item => item.todo === true)
                .map(item => item.name)
        );
        
        uniqueItems.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100 hover:bg-gray-50 cursor-pointer';
            row.setAttribute('data-item-id', item.id);
            
            // Calculate consumption period
            const addedDate = new Date(item.addedAt);
            const consumedDate = new Date(item.consumedAt);
            const consumptionDays = Math.ceil((consumedDate - addedDate) / (1000 * 60 * 60 * 24));
            
            // Format dates for consumption period display
            const addedDateStr = `${addedDate.getMonth() + 1}/${String(addedDate.getDate()).padStart(2, '0')}`;
            const consumedDateStr = `${consumedDate.getMonth() + 1}/${String(consumedDate.getDate()).padStart(2, '0')}`;
            const consumptionPeriodStr = `${addedDateStr}~${consumedDateStr} (${consumptionDays}일)`;
            
            const usedPercent = Math.round(item.totalUsed * 100);
            const wastedPercent = Math.round(item.totalWasted * 100);
            
            // Check if this item is in shopping list todo
            const isInTodo = todoItemNames.has(item.name);
            const initialColor = isInTodo ? 'text-cyan-500' : 'text-gray-400';
            const initialSelected = isInTodo ? 'true' : 'false';
            
            row.innerHTML = `
                <td class="p-1 text-center align-middle">
                    <div class="history-toggle-icon w-8 h-8 mx-auto transition-colors duration-200" data-selected="${initialSelected}" style="display: inline-flex; align-items: center; justify-content: center;">
                        ${isInTodo ? 
                            `<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.6476 7C16.8806 7 17.8199 8.1048 17.6216 9.32172L16.4807 16.3217C16.323 17.2893 15.4872 18 14.5068 18H4.72475C3.7625 18 2.93666 17.3148 2.75909 16.3691L1.4448 9.36906C1.21368 8.1381 2.15798 7 3.41046 7H15.6476Z" stroke="currentColor" stroke-width="2" class="text-cyan-500"/>
                                <path d="M5.5 12.5L8 15L13 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-cyan-500"/>
                                <path d="M6 7C6 7 6 1 9.50001 1C13 1 13 7 13 7" stroke="currentColor" stroke-width="2" class="text-cyan-500"/>
                            </svg>` :
                            `<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.6476 7C16.8806 7 17.8199 8.1048 17.6216 9.32172L16.4807 16.3217C16.323 17.2893 15.4872 18 14.5068 18H4.72475C3.7625 18 2.93666 17.3148 2.75909 16.3691L1.4448 9.36906C1.21368 8.1381 2.15798 7 3.41046 7H15.6476Z" stroke="currentColor" stroke-width="2" class="text-gray-400"/>
                                <path d="M6 7C6 7 6 1 9.5 1C13 1 13 7 13 7" stroke="currentColor" stroke-width="2" class="text-gray-400"/>
                            </svg>`
                        }
                    </div>
                </td>
                <td class="p-4 pl-1 text-sm text-gray-800 font-medium">${item.name} (${item.quantity})</td>
                <td class="p-4 text-sm text-gray-600">${consumptionPeriodStr}</td>
                <td class="p-4 text-sm text-gray-600">
                    <div class="relative">
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-medium" style="color: #3A7556;">${usedPercent}%</span>
                            <span class="font-medium" style="color: #DB474F;">${wastedPercent}%</span>
                        </div>
                        <div class="w-full rounded-full h-2" style="background-color: #DB474F;">
                            <div class="h-2 rounded-full transition-all duration-300" style="width: ${usedPercent}%; background-color: #3A7556;"></div>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-sm text-gray-600"></td>
            `;
            
            // Add click event listener to toggle selection
            row.addEventListener('click', async function() {
                const toggleIcon = this.querySelector('.history-toggle-icon');
                const isSelected = toggleIcon.getAttribute('data-selected') === 'true';
                const itemName = item.name;
                
                if (isSelected) {
                    // Unselect - remove from shopping list
                    toggleIcon.setAttribute('data-selected', 'false');
                    toggleIcon.innerHTML = `<svg width="21" height="21" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.6476 7C16.8806 7 17.8199 8.1048 17.6216 9.32172L16.4807 16.3217C16.323 17.2893 15.4872 18 14.5068 18H4.72475C3.7625 18 2.93666 17.3148 2.75909 16.3691L1.4448 9.36906C1.21368 8.1381 2.15798 7 3.41046 7H15.6476Z" stroke="currentColor" stroke-width="2" class="text-gray-400"/>
                        <path d="M6 7C6 7 6 1 9.5 1C13 1 13 7 13 7" stroke="currentColor" stroke-width="2" class="text-gray-400"/>
                    </svg>`;
                    
                    // Remove from shopping list
                    await removeFromShoppingList(itemName);
                } else {
                    // Select - add to shopping list
                    toggleIcon.setAttribute('data-selected', 'true');
                    toggleIcon.innerHTML = `<svg width="21" height="21" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.6476 7C16.8806 7 17.8199 8.1048 17.6216 9.32172L16.4807 16.3217C16.323 17.2893 15.4872 18 14.5068 18H4.72475C3.7625 18 2.93666 17.3148 2.75909 16.3691L1.4448 9.36906C1.21368 8.1381 2.15798 7 3.41046 7H15.6476Z" stroke="currentColor" stroke-width="2" class="text-cyan-500"/>
                        <path d="M5.5 12.5L8 15L13 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-cyan-500"/>
                        <path d="M6 7C6 7 6 1 9.50001 1C13 1 13 7 13 7" stroke="currentColor" stroke-width="2" class="text-cyan-500"/>
                    </svg>`;
                    
                    // Add to shopping list
                    await addToShoppingList(itemName);
                }
            });
            
            historyTable.appendChild(row);
        });
    };

    const displayInventoryItems = () => {
        inventoryList.innerHTML = ''; // Clear existing items
        
        // Filter items by search query
        const filteredItems = filterItemsBySearch(currentInventoryItems);
        
        // 업데이트 아이템 카운트 (필터링된 결과 기준)
        itemCount.textContent = `총 ${filteredItems.length}개`;
        
        if (filteredItems.length === 0) {
            if (searchQuery) {
                // 검색 결과가 없는 경우
                inventoryList.innerHTML = `
                    <div class="text-center py-12">
                        <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <p class="text-gray-500 text-lg font-medium">검색 결과가 없습니다</p>
                        <p class="text-gray-400 text-sm mt-1">다른 검색어를 입력해보세요</p>
                    </div>
                `;
            } else {
                // 재고가 비어있는 경우
                inventoryList.innerHTML = `
                    <div class="text-center py-12">
                        <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <p class="text-gray-500 text-lg font-medium">재고가 비어있습니다</p>
                        <p class="text-gray-400 text-sm mt-1">새로운 재료를 추가해보세요!</p>
                    </div>
                `;
            }
            return;
        }
        
        // Sort items based on current sort order
        const sortedItems = [...filteredItems].sort((a, b) => {
            if (currentSortOrder === 'urgent') {
                // 임박순 정렬: 소비기한이 많이 지난 순으로 정렬
                
                // 각 재료의 권장 소비기한 대비 남은 소비기한 비율 계산
                const getUrgencyRatio = (item) => {
                    if (!item.storageDays || !item.remainingDays) return 0;
                    
                    // remainingDays가 음수면 이미 만료된 것
                    if (item.remainingDays < 0) {
                        // 만료된 경우, 권장 소비기한 대비 얼마나 초과했는지 계산
                        return item.remainingDays / item.storageDays; // 음수 값이므로 작을수록 더 긴급
                    } else {
                        // 만료되지 않은 경우, 남은 비율 계산 (1에 가까울수록 여유있음)
                        return item.remainingDays / item.storageDays;
                    }
                };
                
                const ratioA = getUrgencyRatio(a);
                const ratioB = getUrgencyRatio(b);
                
                // 비율이 작을수록 긴급 (음수면 만료, 양수면 남은 비율)
                return ratioA - ratioB;
            } else {
                // 기존 날짜 정렬
            const dateA = new Date(a.addedAt);
            const dateB = new Date(b.addedAt);
            return currentSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            }
        });
        
        sortedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative';
            
            const addedAtDate = new Date(item.addedAt);
            const today = new Date();
            
            // 시간을 제거하고 날짜만 비교
            const addedDateOnly = new Date(addedAtDate.getFullYear(), addedAtDate.getMonth(), addedAtDate.getDate());
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            const timeDiff = todayDateOnly.getTime() - addedDateOnly.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            let formattedDate;
            if (daysDiff === 0) {
                formattedDate = "저장: 오늘";
            } else {
                formattedDate = `저장: ${daysDiff}일`;
            }

            itemDiv.innerHTML = `
                <!-- 삭제 버튼을 오른쪽 위 모서리에 배치 -->
                <button class="delete-inventory-item-btn absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors z-20" data-id="${item.id}" style="position: absolute; top: 8px; right: 8px;">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                
                <div class="flex items-center space-x-4 cursor-pointer pr-8" data-item-id="${item.id}">
                    <div class="flex-shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover border border-gray-200">
                    </div>
                    <div class="flex-grow min-w-0">
                        <h3 class="text-lg font-semibold text-gray-800 truncate">${item.name}</h3>
                        <div class="flex items-center justify-between mt-2 mb-3">
                            <span class="text-sm text-gray-600">수량: ${item.quantity}</span>
                            <span class="text-sm text-gray-500">${formattedDate}</span>
                            ${item.expiryStatus ? `
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style="${
                                item.expiryColor === "green-500" ? "background-color: #dcfce7; color: #166534;" :
                                item.expiryColor === "green-400" ? "background-color: #bbf7d0; color: #15803d;" :
                                item.expiryColor === "green-300" ? "background-color: #d1fae5; color: #047857;" :
                                item.expiryColor === "yellow-400" ? "background-color: #fef3c7; color: #d97706;" :
                                item.expiryColor === "yellow-500" ? "background-color: #fef08a; color: #ca8a04;" :
                                item.expiryColor === "orange-400" ? "background-color: #fed7aa; color: #ea580c;" :
                                item.expiryColor === "orange-500" ? "background-color: #fdba74; color: #c2410c;" :
                                item.expiryColor === "red-400" ? "background-color: #fecaca; color: #dc2626;" :
                                item.expiryColor === "red-500" ? "background-color: #fca5a5; color: #b91c1c;" :
                                item.expiryColor === "red-600" ? "background-color: #f87171; color: #991b1b;" :
                                item.expiryColor === "red-700" ? "background-color: #fecaca; color: #7f1d1d;" :
                                item.expiryColor === "gray-400" ? "background-color: #f3f4f6; color: #6b7280;" :
                                "background-color: #f3f4f6; color: #6b7280;"
                            }">
                                ${item.expiryStatus}
                            </span>
                            ` : ''}
                        </div>
                        <div class="mt-3">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs text-gray-500">남은 양</span>
                                <span class="text-xs font-medium text-gray-700">${Math.round(item.remains * 100)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-cyan-500 h-2 rounded-full transition-all duration-300" style="width: ${item.remains * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            inventoryList.appendChild(itemDiv);
        });
    };

    // 모달 열기
    addItemBtn.addEventListener('click', () => {
        addItemModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });

    // 모달 닫기 함수
    const closeModalFunction = () => {
        addItemModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        imagePreview.innerHTML = '';
        aiResults.innerHTML = '';
        imageUpload.value = '';
        analyzedItems = [];
        
        // Show image upload section again
        const imageUploadSection = document.getElementById('image-upload-section');
        if (imageUploadSection) {
            imageUploadSection.style.display = 'block';
        }
    };

    // 모달 닫기 이벤트
    cancelBtn.addEventListener('click', closeModalFunction);
    closeModal.addEventListener('click', closeModalFunction);
    
    // 모달 외부 클릭시 닫기
    addItemModal.addEventListener('click', (e) => {
        if (e.target === addItemModal) {
            closeModalFunction();
        }
    });

    saveBtn.addEventListener('click', async () => {
        if (analyzedItems.length === 0) {
            alert('저장할 항목이 없습니다.');
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '저장 중...';
            
            console.log('Saving items:', analyzedItems);
            
            const response = await fetch('/api/save-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: analyzedItems }),
            });
            const data = await response.json();
            console.log('Save response:', data);
            
            if (data.error) {
                alert(`저장 중 오류가 발생했습니다: ${data.error}`);
            } else {
                // 성공 메시지 표시
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
                successMessage.textContent = '성공적으로 저장되었습니다!';
                document.body.appendChild(successMessage);
                
                setTimeout(() => {
                    document.body.removeChild(successMessage);
                }, 3000);
                
                closeModalFunction();
                console.log('Refreshing inventory...');
                await fetchInventory(); // Refresh inventory after saving
                console.log('Inventory refreshed');
            }
        } catch (error) {
            console.error('Error saving items:', error);
            alert('저장에 실패했습니다.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Hide image upload section
            const imageUploadSection = document.getElementById('image-upload-section');
            if (imageUploadSection) {
                imageUploadSection.style.display = 'none';
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const originalWidth = img.width;
                    const originalHeight = img.height;

                    const MAX_SIZE = 480;
                    let width = originalWidth;
                    let height = originalHeight;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const resizedImageBase64 = canvas.toDataURL('image/jpeg');
                    imagePreview.innerHTML = `
                        <div class="bg-gray-50 rounded-xl p-4">
                            <h3 class="text-sm font-medium text-gray-700 mb-3">업로드된 이미지</h3>
                            <img src="${resizedImageBase64}" class="w-full h-auto rounded-lg border border-gray-200">
                        </div>
                    `;

                    // Send to AI for analysis
                    sendImageToAI(resizedImageBase64, originalWidth, originalHeight, width, height);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    const sendImageToAI = async (imageData, originalWidth, originalHeight, resizedWidth, resizedHeight) => {
        aiResults.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                <p class="text-gray-600">이미지를 분석하고 있습니다...</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageData }),
            });
            const data = await response.json();
            
            if (data.error) {
                aiResults.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <p class="text-red-700">오류: ${data.error}</p>
                        </div>
                    </div>
                `;
                return;
            }

            // Helper function to generate thumbnail from bounding box
            const generateThumbnailFromBoundingBox = (img, boundingBox, itemName) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const thumbnailSize = 72;
                
                canvas.width = thumbnailSize;
                canvas.height = thumbnailSize;
                
                // Fill with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, thumbnailSize, thumbnailSize);
                
                console.log(`=== Generating thumbnail for ${itemName} ===`);
                console.log('Image dimensions:', img.width, 'x', img.height);
                console.log('Original bounding box:', boundingBox);
                
                // Validate bounding box makes sense for image size
                if (boundingBox && boundingBox.length === 4) {
                    const [bbX, bbY, bbW, bbH] = boundingBox;
                    console.log('Bounding box analysis:');
                    console.log(`  Original BB: [${bbX}, ${bbY}, ${bbW}, ${bbH}]`);
                    console.log(`  Current image size: ${img.width} x ${img.height}`);
                    console.log(`  BB exceeds image bounds: ${bbX + bbW > img.width || bbY + bbH > img.height}`);
                    
                    // Detect if bounding box is for original image size
                    // If BB dimensions are much larger than current image, assume it's original size coordinates
                    if (bbX + bbW > img.width || bbY + bbH > img.height) {
                        console.log('  🔍 Bounding box appears to be for original image size, needs scaling');
                        
                        // Estimate original image size based on bounding box
                        const estimatedOriginalWidth = Math.max(bbX + bbW, img.width);
                        const estimatedOriginalHeight = Math.max(bbY + bbH, img.height);
                        
                        console.log(`  Estimated original size: ${estimatedOriginalWidth} x ${estimatedOriginalHeight}`);
                        
                        // Calculate scale factors
                        const scaleX = img.width / estimatedOriginalWidth;
                        const scaleY = img.height / estimatedOriginalHeight;
                        
                        console.log(`  Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
                    }
                }
                
                if (!boundingBox || boundingBox.length !== 4) {
                    console.warn('Invalid bounding box for', itemName, ':', boundingBox);
                    return generateFallbackThumbnail(img);
                }
                
                let [x, y, width, height] = boundingBox;
                console.log('Original parsed coordinates:', { x, y, width, height });
                
                // Scale bounding box if it exceeds current image dimensions
                if (x + width > img.width || y + height > img.height) {
                    console.log('🔧 Scaling bounding box to fit current image size...');
                    
                    // Estimate original image dimensions
                    const estimatedOriginalWidth = Math.max(x + width, img.width);
                    const estimatedOriginalHeight = Math.max(y + height, img.height);
                    
                    // Calculate scale factors
                    const scaleX = img.width / estimatedOriginalWidth;
                    const scaleY = img.height / estimatedOriginalHeight;
                    
                    // Apply scaling
                    x = Math.round(x * scaleX);
                    y = Math.round(y * scaleY);
                    width = Math.round(width * scaleX);
                    height = Math.round(height * scaleY);
                    
                    console.log('Scaled coordinates:', { x, y, width, height });
                    console.log(`Scale factors applied: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
                }
                
                // Validate and clamp bounding box coordinates
                const originalCoords = { x, y, width, height };
                x = Math.max(0, Math.min(x, img.width - 1));
                y = Math.max(0, Math.min(y, img.height - 1));
                width = Math.min(width, img.width - x);
                height = Math.min(height, img.height - y);
                
                console.log('Clamped coordinates:', { x, y, width, height });
                console.log('Coordinate changes:', {
                    xChanged: originalCoords.x !== x,
                    yChanged: originalCoords.y !== y,
                    widthChanged: originalCoords.width !== width,
                    heightChanged: originalCoords.height !== height
                });
                
                if (width <= 0 || height <= 0) {
                    console.warn('Invalid bounding box dimensions for', itemName);
                    return generateFallbackThumbnail(img);
                }
                
                // Create square crop from bounding box center
                const centerX = x + width / 2;
                const centerY = y + height / 2;
                // Use the larger dimension and add padding to ensure full object visibility
                const cropSize = Math.max(width, height) * 1.2; // Add 20% padding around the larger dimension
                
                // Calculate crop area (ensure it stays within image bounds)
                const cropX = Math.max(0, Math.min(centerX - cropSize / 2, img.width - cropSize));
                const cropY = Math.max(0, Math.min(centerY - cropSize / 2, img.height - cropSize));
                const finalCropSize = Math.min(cropSize, img.width - cropX, img.height - cropY);
                
                console.log('Final crop area:', { cropX, cropY, finalCropSize });
                console.log('Center point:', { centerX, centerY });
                
                // Draw the cropped area to thumbnail
                ctx.drawImage(
                    img,
                    cropX, cropY, finalCropSize, finalCropSize,  // Source
                    0, 0, thumbnailSize, thumbnailSize          // Destination
                );
                
                console.log(`✓ Generated thumbnail for ${itemName}`);
                console.log('==========================================');
                
                return canvas.toDataURL('image/jpeg', 0.8);
            };

            // Helper function to generate fallback thumbnail (whole image)
            const generateFallbackThumbnail = (img) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const thumbnailSize = 72;
                
                canvas.width = thumbnailSize;
                canvas.height = thumbnailSize;
                
                // Fill with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, thumbnailSize, thumbnailSize);
                
                // Calculate aspect ratio and draw centered
                const aspectRatio = img.width / img.height;
                let drawWidth = thumbnailSize;
                let drawHeight = thumbnailSize;
                let drawX = 0;
                let drawY = 0;
                
                if (aspectRatio > 1) {
                    // Landscape image
                    drawHeight = thumbnailSize / aspectRatio;
                    drawY = (thumbnailSize - drawHeight) / 2;
                } else {
                    // Portrait image
                    drawWidth = thumbnailSize * aspectRatio;
                    drawX = (thumbnailSize - drawWidth) / 2;
                }
                
                ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawWidth, drawHeight);
                return canvas.toDataURL('image/jpeg', 0.8);
            };

            // Process items to generate thumbnails from bounding boxes
            const itemsWithThumbnails = await Promise.all(data.items.map(async (item, index) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            console.log(`Processing item ${index + 1}/${data.items.length}: ${item.name}`);
                            console.log('Bounding box:', item.boundingBox);
                            
                            const thumbnail = generateThumbnailFromBoundingBox(img, item.boundingBox, item.name);
                            
                            resolve({
                                ...item,
                                image: thumbnail
                            });
                        } catch (error) {
                            console.error('Error generating thumbnail for', item.name, ':', error);
                            // Fallback: use whole image as thumbnail
                            const fallbackThumbnail = generateFallbackThumbnail(img);
                            resolve({
                                ...item,
                                image: fallbackThumbnail
                            });
                        }
                    };
                    img.onerror = () => {
                        console.error('Failed to load image for thumbnail generation');
                        resolve({
                            ...item,
                            image: imageData // Use original image as fallback
                        });
                    };
                    img.src = imageData;
                });
            }));

            // Merge duplicate items by name
            const mergedItems = [];
            const itemMap = new Map();

            itemsWithThumbnails.forEach(item => {
                const name = item.name.trim().toLowerCase();
                if (itemMap.has(name)) {
                    // Merge with existing item
                    const existingItem = itemMap.get(name);
                    existingItem.quantity += item.quantity;
                    // Keep the first thumbnail for merged items (already set)
                } else {
                    // Add new item
                    itemMap.set(name, { ...item });
                    mergedItems.push(itemMap.get(name));
                }
            });

            analyzedItems = mergedItems;
            displayAIResults(analyzedItems);
        } catch (error) {
            console.error('Error sending image to AI:', error);
            aiResults.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p class="text-red-700">이미지 분석에 실패했습니다.</p>
                    </div>
                </div>
            `;
        }
    };

    const retryAnalysis = async () => {
        // Show loading state
        aiResults.innerHTML = `
            <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                <p class="text-gray-600">이미지를 다시 분석하고 있습니다...</p>
            </div>
        `;
        
        // Get the original image data from the preview
        const imagePreview = document.getElementById('image-preview');
        const img = imagePreview.querySelector('img');
        if (!img) {
            console.error('Original image not found');
            return;
        }
        
        // Convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Retry analysis with the same image
        try {
            await sendImageToAI(imageData, img.naturalWidth, img.naturalHeight, img.naturalWidth, img.naturalHeight);
        } catch (error) {
            console.error('Error retrying analysis:', error);
            aiResults.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-500">다시 분석 중 오류가 발생했습니다.</p>
                </div>
            `;
        }
    };

    const displayAIResults = (items) => {
        aiResults.innerHTML = '';
        if (items.length === 0) {
            aiResults.innerHTML = `
                <div class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"></path>
                    </svg>
                    <p class="text-gray-500">감지된 항목이 없습니다.</p>
                </div>
            `;
            return;
        }

        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'mb-4';
        resultsHeader.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-700">감지된 재료 (${items.length} 종)</h3>
                <button id="retry-analysis-btn" class="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span>다시 분석</span>
                </button>
            </div>
            <p class="text-xs text-gray-500 mb-3">AI가 감지한 정보가 틀렸다면, 이름과 수량을 수정 후 저장하세요.</p>
        `;
        aiResults.appendChild(resultsHeader);

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200';

            itemDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <img class="w-12 h-12 object-cover rounded-lg border border-gray-300" src="${item.image}" alt="Thumbnail">
                    </div>
                    <div class="flex-grow min-w-0">
                        <input type="text" class="w-full text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent" value="${item.name}" data-index="${index}" data-field="name" placeholder="재료명">

                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="quantity-btn bg-gray-200 text-gray-700 w-8 h-8 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center" data-index="${index}" data-action="decrement">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                            </svg>
                        </button>
                        <span class="quantity-display w-8 text-center font-semibold text-gray-800" data-index="${index}">${item.quantity}</span>
                        <button class="quantity-btn bg-gray-200 text-gray-700 w-8 h-8 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center" data-index="${index}" data-action="increment">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>
                        <button class="delete-btn bg-red-100 text-red-600 w-8 h-8 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center" data-index="${index}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            aiResults.appendChild(itemDiv);
        });

    };

    // AI 결과 이벤트 리스너들 (한 번만 등록)
    aiResults.addEventListener('change', (event) => {
        if (event.target.dataset.field === 'name') {
            const index = parseInt(event.target.dataset.index);
            analyzedItems[index].name = event.target.value;
        }
    });

    aiResults.addEventListener('click', (event) => {
        if (event.target.closest('#retry-analysis-btn')) {
            retryAnalysis();
        }
    });

    aiResults.addEventListener('click', (event) => {
        if (event.target.classList.contains('quantity-btn') || event.target.closest('.quantity-btn')) {
            const btn = event.target.classList.contains('quantity-btn') ? event.target : event.target.closest('.quantity-btn');
            const index = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            const quantityDisplay = aiResults.querySelector(`.quantity-display[data-index="${index}"]`);
            
            if (action === 'increment') {
                analyzedItems[index].quantity++;
            } else if (action === 'decrement' && analyzedItems[index].quantity > 0) {
                analyzedItems[index].quantity--;
            }
            quantityDisplay.textContent = analyzedItems[index].quantity;
        } else if (event.target.classList.contains('delete-btn') || event.target.closest('.delete-btn')) {
            const btn = event.target.classList.contains('delete-btn') ? event.target : event.target.closest('.delete-btn');
            const index = parseInt(btn.dataset.index);
            analyzedItems.splice(index, 1);
            displayAIResults(analyzedItems);
        }
    });

    // 삭제 버튼 이벤트 위임
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-inventory-item-btn') || event.target.closest('.delete-inventory-item-btn')) {
            const btn = event.target.classList.contains('delete-inventory-item-btn') ? event.target : event.target.closest('.delete-inventory-item-btn');
            const itemId = btn.dataset.id;
            
            if (confirm('이 항목을 삭제하시겠습니까?')) {
                try {
                    const response = await fetch(`/api/inventory/${itemId}`, {
                        method: 'DELETE',
                    });
                    if (response.ok) {
                        fetchInventory();
                    } else {
                        alert('삭제에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Error deleting item:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                }
            }
        }
    });

    // Tab button event listeners
    tabCurrent.addEventListener('click', () => {
        switchTab('current');
    });

    tabFrozen.addEventListener('click', () => {
        switchTab('frozen');
    });

    // Cooking button event listener
    const cookingBtn = document.getElementById('cooking-btn');
    
    if (cookingBtn) {
        cookingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Cooking button clicked, navigating to cooking page');
            window.location.href = '/cooking.html';
        });
    } else {
        console.log('Cooking button not found');
    }

    tabHistory.addEventListener('click', () => {
        switchTab('history');
    });

    // Sort button event listeners
    sortNewestBtn.addEventListener('click', () => {
        currentSortOrder = 'newest';
        updateSortButtons();
        displayInventoryItems();
    });

    sortOldestBtn.addEventListener('click', () => {
        currentSortOrder = 'oldest';
        updateSortButtons();
        displayInventoryItems();
    });

    sortUrgentBtn.addEventListener('click', () => {
        currentSortOrder = 'urgent';
        updateSortButtons();
        displayInventoryItems();
    });

    // Frozen sort button event listeners
    sortFrozenNewestBtn.addEventListener('click', () => {
        frozenSortOrder = 'newest';
        updateFrozenSortButtons();
        displayFrozenItems();
    });

    sortFrozenOldestBtn.addEventListener('click', () => {
        frozenSortOrder = 'oldest';
        updateFrozenSortButtons();
        displayFrozenItems();
    });



    const updateSortButtons = () => {
        // Reset all sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.className = 'sort-btn bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors';
        });
        
        // Highlight active sort button
        if (currentSortOrder === 'newest') {
            sortNewestBtn.className = 'sort-btn bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-cyan-600 transition-colors';
        } else if (currentSortOrder === 'oldest') {
            sortOldestBtn.className = 'sort-btn bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-cyan-600 transition-colors';
        } else if (currentSortOrder === 'urgent') {
            sortUrgentBtn.className = 'sort-btn bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-cyan-600 transition-colors';
        }
    };

    const updateFrozenSortButtons = () => {
        // Reset all frozen sort buttons
        sortFrozenNewestBtn.className = 'sort-btn bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors';
        sortFrozenOldestBtn.className = 'sort-btn bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors';
        
        // Highlight active sort button
        if (frozenSortOrder === 'newest') {
            sortFrozenNewestBtn.className = 'sort-btn bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-cyan-600 transition-colors';
        } else if (frozenSortOrder === 'oldest') {
            sortFrozenOldestBtn.className = 'sort-btn bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-cyan-600 transition-colors';
        }
    };

    // Edit remains modal functions
    const openEditModal = async (item) => {
        currentEditItem = item;
        
        // Set modal content
        editItemImage.src = item.image;
        editItemName.textContent = item.name;
        editItemQuantity.textContent = `수량: ${item.quantity}`;
        
        // Calculate and set date info
        const addedAtDate = new Date(item.addedAt);
        const today = new Date();
        const addedDateOnly = new Date(addedAtDate.getFullYear(), addedAtDate.getMonth(), addedAtDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const timeDiff = todayDateOnly.getTime() - addedDateOnly.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        let formattedDate;
        if (daysDiff === 0) {
            formattedDate = "저장: 오늘";
        } else {
            formattedDate = `저장: ${daysDiff}일`;
        }
        editItemDate.textContent = formattedDate;
        
        // Set expiry info - hide if frozen
        if (item.frozen) {
            editItemExpiry.style.display = 'none';
        } else {
            editItemExpiry.style.display = 'block';
            if (item.expiryStatus) {
                editItemExpiry.textContent = item.expiryStatus;
                // 만료된 경우 진한 빨간색으로 표시
                if (item.expiryStatus.includes('D+')) {
                    editItemExpiry.className = 'text-sm text-red-700 font-medium';
                } else {
                    editItemExpiry.className = 'text-sm text-gray-500';
                }
            } else {
                editItemExpiry.textContent = '정보 없음';
                editItemExpiry.className = 'text-sm text-gray-500';
            }
        }
        
        // Set slider value and max
        const remainsPercent = Math.round(item.remains * 100);
        remainsSlider.max = 100; // 최대값은 항상 100%
        remainsSlider.value = remainsPercent; // 실제 남은 양으로 설정
        remainsValue.textContent = `${remainsPercent}%`;
        
        // Update progress bar
        const sliderProgress = document.getElementById('slider-progress');
        if (sliderProgress) {
            sliderProgress.style.width = `${remainsPercent}%`;
        }
        
        // Disable consume button initially
        consumeBtn.disabled = true;
        consumeBtn.style.opacity = '0.5';
        consumeBtn.style.cursor = 'not-allowed';
        
        // Set freeze button state based on frozen status
        if (item.frozen) {
            freezeBtn.disabled = true;
            freezeBtn.style.opacity = '0.5';
            freezeBtn.style.cursor = 'not-allowed';
            freezeBtn.textContent = '냉동중';
            
            // Set modal background to sky blue gradient for frozen items
            const modalContent = editRemainsModal.querySelector('.bg-white');
            modalContent.style.background = 'linear-gradient(135deg, #95BCFA 0%, #E6F4FD 50%, #F8FBFF 100%)';
        } else {
            freezeBtn.disabled = false;
            freezeBtn.style.opacity = '1';
            freezeBtn.style.cursor = 'pointer';
            freezeBtn.textContent = '냉동';
            
            // Reset modal background to white for non-frozen items
            const modalContent = editRemainsModal.querySelector('.bg-white');
            modalContent.style.background = 'white';
        }
        
        // Load history data
        await loadHistoryData(item.id);
        
        // Show modal
        editRemainsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeEditModalFunction = () => {
        editRemainsModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        currentEditItem = null;
        
        // Reset freeze button to default state
        freezeBtn.disabled = false;
        freezeBtn.style.opacity = '1';
        freezeBtn.style.cursor = 'pointer';
        freezeBtn.textContent = '냉동';
        
        // Reset expiry info display
        editItemExpiry.style.display = 'block';
        
        // Reset modal background to white
        const modalContent = editRemainsModal.querySelector('.bg-white');
        modalContent.style.background = 'white';
    };

    const loadHistoryData = async (itemId) => {
        try {
            const response = await fetch(`/api/inventory/${itemId}/history`);
            if (response.ok) {
                const data = await response.json();
                displayHistoryTable(data.history, data.addedAt);
                
                // Update storage info
                if (data.storageDesc) {
                    storageDesc.textContent = data.storageDesc;
                } else {
                    storageDesc.textContent = '정보 없음';
                }
                
                if (data.storageMethod) {
                    storageMethod.textContent = data.storageMethod;
                } else {
                    storageMethod.textContent = '정보 없음';
                }
            } else {
                console.error('Failed to load history data');
                displayHistoryTable([], null);
                storageDesc.textContent = '정보 없음';
                storageMethod.textContent = '정보 없음';
            }
        } catch (error) {
            console.error('Error loading history:', error);
            displayHistoryTable([], null);
            storageDesc.textContent = '정보 없음';
            storageMethod.textContent = '정보 없음';
        }
    };

    const displayHistoryTable = (history, addedAt) => {
        historyTableBody.innerHTML = '';
        
        // Helper function to get day of week in Korean
        const getDayOfWeek = (date) => {
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return days[date.getDay()];
        };
        
        // Add history items
        history.forEach(item => {
            const date = new Date(item.updateDate);
            const dayOfWeek = getDayOfWeek(date);
            const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayOfWeek})`;
            
            let usageText = '';
            if (item.waste) {
                usageText = '폐기';
            } else if (item.frozen) {
                usageText = '냉동';
            } else {
                const usage = Math.round((item.remainBefore - item.remainAfter) * 100);
                usageText = `${usage}%`;
            }
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100';
            row.innerHTML = `
                <td class="py-1 text-gray-700 text-center">${formattedDate}</td>
                <td class="py-1 text-gray-700 text-center">${usageText}</td>
            `;
            historyTableBody.appendChild(row);
        });
        
        // Add storage date at the bottom
        if (addedAt) {
            const date = new Date(addedAt);
            const dayOfWeek = getDayOfWeek(date);
            const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayOfWeek})`;
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-100';
            row.innerHTML = `
                <td class="py-1 text-gray-700 text-center">${formattedDate}</td>
                <td class="py-1 text-gray-700 text-center">저장</td>
            `;
            historyTableBody.appendChild(row);
        }
        
        // Adjust table height based on number of rows
        const totalRows = history.length + (addedAt ? 1 : 0);
        const historyTableContainer = document.getElementById('history-table-container');
        
        if (historyTableContainer) {
            if (totalRows <= 5) {
                // 5개 이하: 스크롤 없이 표시
                historyTableContainer.style.maxHeight = 'none';
                historyTableContainer.style.overflowY = 'hidden';
            } else {
                // 5개 초과: 스크롤 활성화 (최대 120px)
                historyTableContainer.style.maxHeight = '120px';
                historyTableContainer.style.overflowY = 'auto';
            }
        }
    };

    // Edit modal event listeners
    closeEditModal.addEventListener('click', closeEditModalFunction);
    
    // Close modal when clicking outside
    editRemainsModal.addEventListener('click', (event) => {
        if (event.target === editRemainsModal) {
            closeEditModalFunction();
        }
    });
    
    // Add hover effect for waste button
    wasteBtn.addEventListener('mouseenter', () => {
        wasteBtn.style.backgroundColor = '#374151'; // darker gray on hover
    });
    
    wasteBtn.addEventListener('mouseleave', () => {
        wasteBtn.style.backgroundColor = '#4b5563'; // original gray
    });
    
    // Slider change event
    remainsSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const originalRemains = Math.round(currentEditItem.remains * 100);
        
        // 현재 남은 양을 초과하지 않도록 제한
        if (value > originalRemains) {
            e.target.value = originalRemains;
            remainsValue.textContent = `${originalRemains}%`;
        } else {
            remainsValue.textContent = `${value}%`;
        }
        
        // Update progress bar immediately with current slider value
        const sliderProgress = document.getElementById('slider-progress');
        if (sliderProgress) {
            sliderProgress.style.width = `${e.target.value}%`;
        }
        
        // Enable/disable consume button based on slider change
        if (currentEditItem) {
            const currentValue = parseInt(e.target.value);
            
            if (currentValue !== originalRemains) {
                // 값이 실제 남은 양과 다르면 소비 버튼 활성화
                consumeBtn.disabled = false;
                consumeBtn.style.opacity = '1';
                consumeBtn.style.cursor = 'pointer';
            } else {
                // 값이 실제 남은 양과 같으면 소비 버튼 비활성화
                consumeBtn.disabled = true;
                consumeBtn.style.opacity = '0.5';
                consumeBtn.style.cursor = 'not-allowed';
            }
        }
    });

    // Consume button
    consumeBtn.addEventListener('click', async () => {
        if (!currentEditItem || consumeBtn.disabled) return;
        
        const newRemains = parseInt(remainsSlider.value) / 100;
        
        try {
            const response = await fetch(`/api/inventory/${currentEditItem.id}/update-remains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    remains: newRemains,
                    waste: false
                })
            });
            
            if (response.ok) {
                closeEditModalFunction();
                fetchInventory(); // Refresh inventory list
            } else {
                alert('업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating remains:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        }
    });

    // Freeze button
    freezeBtn.addEventListener('click', async () => {
        if (!currentEditItem) return;
        
        // Show confirmation dialog
        const confirmed = confirm('이 식재료를 냉동 처리하시겠습니까?');
        
        if (!confirmed) return; // User cancelled
        
        try {
            const response = await fetch(`/api/inventory/${currentEditItem.id}/freeze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                closeEditModalFunction();
                // Refresh appropriate list based on current tab
                if (currentTab === 'current') {
                    fetchInventory();
                } else if (currentTab === 'frozen') {
                    fetchFrozen();
                }
            } else {
                alert('냉동 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error freezing item:', error);
            alert('냉동 처리 중 오류가 발생했습니다.');
        }
    });

    // Waste button
    wasteBtn.addEventListener('click', async () => {
        if (!currentEditItem) return;
        
        // Show confirmation dialog
        const confirmed = confirm('상했나요? 나머지를 폐기 처리합니다.');
        
        if (!confirmed) return; // User cancelled
        
        try {
            const response = await fetch(`/api/inventory/${currentEditItem.id}/update-remains`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    remains: 0,
                    waste: true
                })
            });
            
            if (response.ok) {
                closeEditModalFunction();
                fetchInventory(); // Refresh inventory list
            } else {
                alert('업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating remains:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        }
    });

    // Inventory item click event delegation
    document.addEventListener('click', (event) => {
        const itemContainer = event.target.closest('[data-item-id]');
        if (itemContainer && !event.target.closest('.delete-inventory-item-btn')) {
            const itemId = parseInt(itemContainer.dataset.itemId);
            const item = currentInventoryItems.find(item => item.id === itemId);
            if (item) {
                openEditModal(item);
            }
        }
    });

    // Search functionality
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const closeSearchBtn = document.getElementById('close-search');
    const searchBtn = document.getElementById('search-btn');

    // Search button click event
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchContainer.classList.remove('hidden');
            searchInput.focus();
        });
    }

    // Close search button click event
    closeSearchBtn.addEventListener('click', () => {
        searchContainer.classList.add('hidden');
        searchInput.value = '';
        searchQuery = '';
        displayInventoryItems(); // Reset to show all items
    });

    // Search input event
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        displayInventoryItems();
    });

    // Filter items based on search query
    const filterItemsBySearch = (items) => {
        if (!searchQuery) return items;
        return items.filter(item => 
            item.name.toLowerCase().includes(searchQuery)
        );
    };
    
    // Shopping list management functions
    const addToShoppingList = async (itemName) => {
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
            
            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error === 'Item already exists in shopping list') {
                    // Item already exists, update its todo status to true
                    await updateShoppingListTodo(itemName, true);
                } else {
                    console.error('Failed to add item to shopping list:', errorData);
                }
            }
            
            // Update shopping badge after adding item
            updateShoppingBadge();
        } catch (error) {
            console.error('Error adding item to shopping list:', error);
        }
    };
    
    const removeFromShoppingList = async (itemName) => {
        try {
            // First, get the shopping list to find the item ID
            const response = await fetch('/api/shopping-list');
            const shoppingList = await response.json();
            
            const item = shoppingList.find(item => item.name === itemName);
            if (item) {
                // Update the item's todo status to false
                await updateShoppingListTodo(itemName, false);
            }
            
            // Update shopping badge after removing item
            updateShoppingBadge();
        } catch (error) {
            console.error('Error removing item from shopping list:', error);
        }
    };
    
    const updateShoppingListTodo = async (itemName, todo) => {
        try {
            // First, get the shopping list to find the item ID
            const response = await fetch('/api/shopping-list');
            const shoppingList = await response.json();
            
            const item = shoppingList.find(item => item.name === itemName);
            if (item) {
                // Update the item's todo status
                const updateResponse = await fetch('/api/shopping-list/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        itemId: item.id,
                        todo: todo
                    })
                });
                
                if (!updateResponse.ok) {
                    console.error('Failed to update shopping list item');
                }
            }
            
            // Update shopping badge after updating item
            updateShoppingBadge();
        } catch (error) {
            console.error('Error updating shopping list item:', error);
        }
    };

    // Shopping list button click event
    const shoppingListBtn = document.getElementById('shoppinglist-btn');
    if (shoppingListBtn) {
        shoppingListBtn.addEventListener('click', () => {
            window.location.href = '/shopping.html';
        });
    }

    // Initial fetch of inventory when the page loads
    fetchInventory();
    
    // Initialize sort button states
    updateSortButtons();
    updateFrozenSortButtons();
    
    // Update shopping badge on page load
    updateShoppingBadge();
});