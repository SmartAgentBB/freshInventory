from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
import sqlite3
import base64
from datetime import datetime
import io

import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

app = Flask(__name__)
DATABASE = 'foodItems.db'

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set.")
genai.configure(api_key=GEMINI_API_KEY)

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        # Create foodItems table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS foodItems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image BLOB,
                quantity INTEGER NOT NULL,
                remains REAL NOT NULL,
                addedAt TEXT NOT NULL,
                storageId INTEGER,
                storageDays INTEGER,
                frozen BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (storageId) REFERENCES storageInfo (id)
            );
        ''')
        
        # Create storageInfo table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS storageInfo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name TEXT UNIQUE NOT NULL,
                storageDays INTEGER NOT NULL,
                storageDesc TEXT NOT NULL,
                storageMethod TEXT NOT NULL
            );
        ''')
        
        # Create history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                foodItemId INTEGER NOT NULL,
                updateDate TEXT NOT NULL,
                remainBefore REAL NOT NULL,
                remainAfter REAL NOT NULL,
                waste BOOLEAN NOT NULL,
                frozen BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (foodItemId) REFERENCES foodItems (id)
            );
        ''')
        
        # Create cookBook table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cookBook (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insertDate TEXT NOT NULL,
                title TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                time TEXT NOT NULL,
                Youtube_query TEXT NOT NULL,
                bookmark BOOLEAN DEFAULT FALSE,
                cart BOOLEAN DEFAULT FALSE
            );
        ''')
        
        # Create shoppingList table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shoppingList (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insertDate TEXT NOT NULL,
                updateDate TEXT NOT NULL,
                name TEXT NOT NULL,
                todo BOOLEAN DEFAULT TRUE,
                memo TEXT
            );
        ''')
        
        # Insert storageInfo data from CSV
        insert_storage_info_data(cursor)
        
        # Migrate existing inventory table to add new columns if they don't exist
        migrate_inventory_table(cursor)
        
        db.commit()
        db.close()

def migrate_inventory_table(cursor):
    """Migrate from old inventory table to new foodItems table if needed"""
    try:
        # Check if old inventory table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'")
        old_table_exists = cursor.fetchone()
        
        if old_table_exists:
            print("Migrating from inventory table to foodItems table...")
            
            # Create new foodItems table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS foodItems (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    image BLOB,
                    quantity INTEGER NOT NULL,
                    remains REAL NOT NULL,
                    addedAt TEXT NOT NULL,
                    storageId INTEGER,
                    storageDays INTEGER,
                    FOREIGN KEY (storageId) REFERENCES storageInfo (id)
                )
            """)
            
            # Copy data from old table to new table
            cursor.execute("""
                INSERT INTO foodItems (id, name, image, quantity, remains, addedAt, storageId, storageDays)
                SELECT id, name, image, quantity, remains, addedAt, storageId, storageDays
                FROM inventory
            """)
            
            # Check if history table has old column name and migrate if needed
            cursor.execute("PRAGMA table_info(history)")
            history_columns = [column[1] for column in cursor.fetchall()]
            
            if 'inventoryId' in history_columns:
                # Rename inventoryId column to foodItemId
                cursor.execute("ALTER TABLE history RENAME COLUMN inventoryId TO foodItemId")
                print("Renamed inventoryId to foodItemId in history table")
            
            # Update history table foreign key references
            cursor.execute("""
                UPDATE history 
                SET foodItemId = (
                    SELECT fi.id 
                    FROM foodItems fi 
                    WHERE fi.id = history.foodItemId
                )
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE inventory")
            print("Migration completed successfully!")
        else:
            # Check if storageId column exists in foodItems table
            cursor.execute("PRAGMA table_info(foodItems)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'storageId' not in columns:
                cursor.execute("ALTER TABLE foodItems ADD COLUMN storageId INTEGER")
                print("Added storageId column to foodItems table")
            
            if 'storageDays' not in columns:
                cursor.execute("ALTER TABLE foodItems ADD COLUMN storageDays INTEGER")
                print("Added storageDays column to foodItems table")
            
            if 'frozen' not in columns:
                cursor.execute("ALTER TABLE foodItems ADD COLUMN frozen BOOLEAN DEFAULT FALSE")
                print("Added frozen column to foodItems table")
            
            # Check if history table has frozen column
            cursor.execute("PRAGMA table_info(history)")
            history_columns = [column[1] for column in cursor.fetchall()]
            
            if 'frozen' not in history_columns:
                cursor.execute("ALTER TABLE history ADD COLUMN frozen BOOLEAN DEFAULT FALSE")
                print("Added frozen column to history table")
            
    except Exception as e:
        print(f"Migration error: {e}")

def insert_storage_info_data(cursor):
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM storageInfo")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print("StorageInfo data already exists, skipping insertion.")
        return
    
    # Storage info data from CSV
    storage_data = [
        ("기타", "두부", 7, "5~7일", "물에 담가 밀폐용기에 넣어 냉장 보관. 매일 물을 갈아주면 더 오래 보관 가능합니다."),
        ("야채", "콩나물", 5, "3~5일", "씻지 않은 상태로 물기를 제거하고 밀폐용기에 담아 냉장 보관하세요. 빛을 차단하면 더 신선하게 유지됩니다."),
        ("야채", "숙주나물", 4, "2~4일", "콩나물보다 쉽게 무르므로, 씻지 않고 밀폐용기에 담아 냉장 보관 후 가급적 빨리 소비하세요."),
        ("야채", "고구마", 30, "2~4주", "10~15°C의 서늘하고 어두운 곳에 신문지로 감싸 보관하세요. (냉장 보관 시 맛이 변질될 수 있습니다)"),
        ("야채", "감자", 30, "2~4주", "빛이 없는 서늘하고 통풍이 잘 되는 곳에 보관하세요. 사과와 함께 두면 싹 나는 것을 억제합니다. (냉장 보관 금지)"),
        ("야채", "양파", 60, "1~2개월", "껍질째 망에 넣어 건조하고 서늘한 곳에 보관하세요. 깐 양파는 밀폐용기에 담아 냉장 보관합니다."),
        ("야채", "마늘", 60, "1~2개월", "통마늘은 망에 넣어 서늘하고 건조한 곳에 보관하고, 깐 마늘이나 다진 마늘은 냉장 또는 냉동 보관하세요."),
        ("야채", "파", 14, "1~2주", "뿌리 부분을 젖은 키친타월로 감싸 세워서 냉장 보관하세요. 장기 보관 시 용도에 맞게 썰어서 냉동 보관합니다."),
        ("야채", "생강", 21, "2~3주", "흙이 묻은 채로 신문지에 싸서 서늘한 곳에 두거나, 껍질을 벗겨 다지거나 편으로 썰어 냉동 보관하세요."),
        ("야채", "오이", 7, "5~7일", "키친타월로 하나씩 감싸 비닐 팩에 넣어 세워서 냉장 보관하세요. 물기 제거가 중요합니다."),
        ("야채", "가지", 7, "5~7일", "저온에 약하므로 신문지에 싸서 서늘한 실온에 보관하고, 오래 보관할 경우에만 냉장 보관하세요."),
        ("야채", "호박", 7, "5~7일", "(애호박 기준) 키친타월이나 신문지로 감싸 냉장 보관하고, 자른 단면은 랩으로 밀봉하세요."),
        ("야채", "옥수수", 3, "2~3일", "껍질째 비닐 팩에 넣어 냉장 보관하세요. 시간이 지날수록 당도가 떨어지므로 빨리 소비하거나 쪄서 냉동 보관합니다."),
        ("야채", "상추", 7, "5~7일", "씻지 않은 상태로 키친타월에 감싸 비닐 팩에 넣어 세워서 냉장 보관하면 더 신선합니다."),
        ("야채", "깻잎", 7, "5~7일", "물기를 제거하고 키친타월에 감싸 밀폐용기에 넣어 냉장 보관하세요."),
        ("야채", "쌈채소", 5, "3~5일", "상추와 유사하게 보관하되, 여러 종류가 섞여 있어 더 빨리 시들 수 있으니 가급적 빨리 소비하세요."),
        ("야채", "고추", 14, "1~2주", "물기 없이 키친타월에 감싸 밀폐용기나 비닐 팩에 넣어 냉장 보관하세요."),
        ("야채", "피망", 10, "7~10일", "낱개로 키친타월에 감싸 비닐 팩에 넣어 냉장 보관하세요. 꼭지 부분이 마르지 않게 유지하는 것이 좋습니다."),
        ("야채", "파프리카", 10, "7~10일", "낱개로 키친타월에 감싸 비닐 팩에 넣어 냉장 보관하세요. 꼭지 부분이 마르지 않게 유지하는 것이 좋습니다."),
        ("야채", "시금치", 5, "3~5일", "흙이 묻은 채로 젖은 신문지에 감싸 뿌리가 아래로 가도록 세워서 냉장 보관하세요."),
        ("야채", "부추", 7, "5~7일", "씻지 않고 신문지에 싸서 냉장 보관하세요. 물기가 닿으면 쉽게 무르므로 주의해야 합니다."),
        ("야채", "나물", 4, "2~4일", "(일반적인 나물류) 시금치/부추와 유사하게 보관하며, 데쳐서 냉장/냉동하면 더 오래 보관 가능합니다."),
        ("야채", "양배추", 21, "2~3주", "사용한 만큼 잘라내고 남은 부분은 랩으로 완전히 감싸 냉장 보관하세요. 심지를 제거하면 더 오래 보관할 수 있습니다."),
        ("야채", "양상추", 10, "7~10일", "겉잎을 떼지 않고 랩으로 감싸거나 비닐 팩에 넣어 냉장 보관하세요."),
        ("야채", "브로콜리", 7, "5~7일", "살짝 데쳐서 물기를 제거한 후 밀폐용기에 담아 냉장/냉동 보관하거나, 생으로 보관 시 물에 적신 키친타월로 감싸 냉장 보관합니다."),
        ("야채", "당근", 21, "2~3주", "흙이 묻은 채로 키친타월에 감싸 냉장 보관하고, 씻었다면 물기를 완전히 말린 후 보관하세요."),
        ("야채", "우엉", 14, "1~2주", "흙이 묻은 채로 신문지에 싸서 서늘한 곳이나 냉장 보관하세요."),
        ("야채", "연근", 10, "7~10일", "흙이 묻은 채로 신문지에 싸서 냉장 보관하고, 껍질을 벗겼다면 식초물에 담가 냉장 보관합니다."),
        ("야채", "마", 21, "2~3주", "흙이 묻은 채로 신문지에 싸서 서늘하고 어두운 곳에 보관하세요. 자른 단면은 랩으로 감싸 냉장 보관합니다."),
        ("야채", "버섯", 7, "5~7일", "습기에 약하므로 키친타월에 감싸거나 종이봉투에 넣어 씻지 않고 냉장 보관하세요."),
        ("야채", "배추", 14, "1~2주", "신문지로 전체를 감싸 뿌리가 아래로 가도록 세워서 서늘한 곳이나 냉장 보관하세요."),
        ("야채", "무", 14, "1~2주", "잎(무청)은 영양분을 뺏어가므로 잘라내고, 신문지에 싸서 냉장 보관하세요."),
        ("야채", "아스파라거스", 5, "3~5일", "밑동을 살짝 잘라낸 후 젖은 키친타월로 감싸 비닐 팩에 넣어 세워서 냉장 보관하세요."),
        ("기타", "인삼", 14, "1~2주", "이끼나 젖은 신문지에 싸서 비닐 팩에 넣어 냉장 보관하세요."),
        ("야채", "더덕", 14, "1~2주", "흙이 묻은 채로 신문지에 싸서 서늘한 곳이나 냉장 보관하세요."),
        ("과일", "사과", 21, "1~3주", "다른 과일/채소와 분리하여 비닐 팩에 넣어 냉장 보관하세요. (에틸렌 가스 방출)"),
        ("과일", "배", 10, "7~10일", "신문지에 감싸 비닐 팩에 넣어 냉장 보관하세요."),
        ("과일", "감귤", 14, "1~2주", "겹치지 않게 서늘한 실온에 두거나, 옅은 소금물에 헹궈 물기를 말린 후 냉장 보관하세요."),
        ("과일", "만감류", 14, "1~2주", "(한라봉, 천혜향 등) 감귤과 동일하게 보관하세요."),
        ("과일", "수박", 7, "통째로 1주, 자른 후 3~5일", "통 수박은 서늘한 실온에 보관하고, 자른 후에는 단면을 랩으로 밀봉하여 반드시 냉장 보관하세요."),
        ("과일", "멜론", 5, "후숙 후 3~5일", "꼭지 반대편을 눌러 부드러워질 때까지 실온 후숙 후, 랩으로 싸서 냉장 보관하세요."),
        ("과일", "참외", 7, "5~7일", "키친타월이나 신문지에 싸서 비닐 팩에 넣어 냉장 보관하세요."),
        ("과일", "토마토", 10, "5~10일", "꼭지를 아래로 향하게 하여 실온 보관하세요. 완숙 후에는 냉장 보관이 가능합니다."),
        ("과일", "딸기", 4, "2~4일", "꼭지를 떼지 않고 씻지 않은 상태로 겹치지 않게 밀폐용기에 담아 냉장 보관하세요."),
        ("과일", "키위", 28, "후숙 후 2~4주", "단단하면 실온에서 후숙시키고, 익은 후에는 냉장 보관하세요."),
        ("과일", "블루베리", 10, "7~10일", "씻지 않은 상태로 밀폐용기에 담아 냉장 보관하고, 먹기 직전에 씻으세요."),
        ("과일", "포도", 14, "1~2주", "씻지 않은 상태로 종이봉투나 키친타월에 감싸 냉장 보관하세요."),
        ("과일", "자두", 5, "후숙 후 3~5일", "단단하면 실온에서 후숙시키고, 익은 후에는 냉장 보관하세요."),
        ("과일", "복숭아", 5, "후숙 후 3~5일", "단단하면 실온에서 후숙시키고, 익은 후에는 키친타월에 감싸 냉장 보관하세요."),
        ("과일", "감", 7, "5~7일", "단단감은 실온 보관 가능하며, 홍시(연시)는 냉장 보관하세요."),
        ("기타", "곶감", 180, "3~6개월", "밀폐용기에 담아 냉동 보관하세요."),
        ("과일", "바나나", 7, "3~7일", "실온에 보관하세요. 꼭지 부분을 랩으로 감싸면 숙성을 지연시킬 수 있습니다. (냉장 보관 금지)"),
        ("과일", "파인애플", 5, "후숙 후 3~5일", "잎 부분을 아래로 향하게 하여 실온 보관하면 당도가 고루 퍼집니다. 후숙 후 잘라서 냉장 보관하세요."),
        ("과일", "오렌지", 21, "2~3주", "서늘한 실온 또는 냉장 보관하세요."),
        ("과일", "자몽", 21, "2~3주", "오렌지와 동일하게 보관하세요."),
        ("과일", "레몬", 28, "3~4주", "낱개로 랩이나 비닐 팩에 싸서 냉장 보관하면 수분 증발을 막을 수 있습니다."),
        ("과일", "망고", 5, "후숙 후 3~5일", "검은 반점이 생길 때까지 실온에서 후숙시킨 후 냉장 보관하세요."),
        ("과일", "체리", 7, "5~7일", "씻지 않은 상태로 밀폐용기에 담아 냉장 보관하세요."),
        ("과일", "석류", 21, "2~3주", "통째로 서늘한 실온이나 냉장 보관하세요."),
        ("과일", "아보카도", 5, "후숙 후 3~5일", "단단하면 실온에서 후숙시키고, 익은 후에는 냉장 보관하세요.")
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO storageInfo (category, name, storageDays, storageDesc, storageMethod)
        VALUES (?, ?, ?, ?, ?)
    ''', storage_data)
    
    print(f"Inserted {len(storage_data)} storage info records.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cooking.html')
def cooking():
    return render_template('cooking.html')

@app.route('/shopping.html')
def shopping():
    return render_template('shopping.html')

@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory('img', filename)

@app.route('/api/cooking-inventory', methods=['GET'])
def get_cooking_inventory():
    """Get inventory items for cooking page (excluding fruits, sorted by urgency)"""
    db = get_db()
    cursor = db.cursor()
    
    # Join foodItems with storageInfo to get category information
    # Get non-frozen items with remains > 0 (for display)
    cursor.execute("""
        SELECT f.id, f.name, f.quantity, f.remains, f.addedAt, f.storageDays, f.frozen
        FROM foodItems f
        LEFT JOIN storageInfo s ON f.storageId = s.id
        WHERE f.remains > 0 AND (s.category != '과일' OR s.category IS NULL)
        ORDER BY f.addedAt DESC
    """)
    items = cursor.fetchall()
    db.close()
    
    inventory_list = []
    current_date = datetime.now()
    
    for item in items:
        item_dict = dict(item)
        
        # 소비기한 계산 (임박순 정렬을 위해)
        if item_dict['storageDays'] and item_dict['addedAt']:
            try:
                added_date = datetime.fromisoformat(item_dict['addedAt'])
                days_passed = (current_date - added_date).days
                remaining_days = item_dict['storageDays'] - days_passed
                item_dict['remainingDays'] = remaining_days
                
                # 긴급도 비율 계산 (임박순 정렬용)
                if remaining_days < 0:
                    # 만료된 경우, 권장 소비기한 대비 얼마나 초과했는지 계산
                    item_dict['urgencyRatio'] = remaining_days / item_dict['storageDays']  # 음수 값
                else:
                    # 만료되지 않은 경우, 남은 비율 계산
                    item_dict['urgencyRatio'] = remaining_days / item_dict['storageDays']
                
                # expiryColor 계산 (기존 재고 목록과 동일한 로직)
                if remaining_days > 0:
                    # 색상 계산 (10단계 그라데이션)
                    ratio = remaining_days / item_dict['storageDays']
                    if ratio >= 0.9:
                        item_dict['expiryColor'] = "green-500"  # 90-100%
                    elif ratio >= 0.8:
                        item_dict['expiryColor'] = "green-400"  # 80-89%
                    elif ratio >= 0.7:
                        item_dict['expiryColor'] = "green-300"  # 70-79%
                    elif ratio >= 0.6:
                        item_dict['expiryColor'] = "yellow-400"  # 60-69%
                    elif ratio >= 0.5:
                        item_dict['expiryColor'] = "yellow-500"  # 50-59%
                    elif ratio >= 0.4:
                        item_dict['expiryColor'] = "orange-400"  # 40-49%
                    elif ratio >= 0.3:
                        item_dict['expiryColor'] = "orange-500"  # 30-39%
                    elif ratio >= 0.2:
                        item_dict['expiryColor'] = "red-400"  # 20-29%
                    elif ratio >= 0.1:
                        item_dict['expiryColor'] = "red-500"  # 10-19%
                    else:
                        item_dict['expiryColor'] = "red-600"  # 0-9%
                else:
                    expired_days = abs(remaining_days)  # 만료된 일수
                    item_dict['expiryColor'] = "red-700"  # 진한 빨간색
                    
            except:
                item_dict['remainingDays'] = None
                item_dict['urgencyRatio'] = 0
                item_dict['expiryColor'] = "gray-400"
        else:
            item_dict['remainingDays'] = None
            item_dict['urgencyRatio'] = 0
            item_dict['expiryColor'] = "gray-400"
        
        inventory_list.append(item_dict)
    
    # 일반 재료와 냉동 재료를 분리
    normal_items = [item for item in inventory_list if not item.get('frozen', False)]
    frozen_items = [item for item in inventory_list if item.get('frozen', False)]
    
    # 일반 재료는 임박순 정렬, 냉동 재료는 추가일 순 정렬
    normal_items.sort(key=lambda x: x['urgencyRatio'])
    frozen_items.sort(key=lambda x: x['urgencyRatio'])
    
    # 일반 재료를 먼저, 냉동 재료를 나중에 배치
    sorted_inventory_list = normal_items + frozen_items
    
    # 중복 제거 및 최대 10개까지 표시
    unique_names = []
    unique_items = []
    for item in sorted_inventory_list:
        if item['name'] not in unique_names:
            unique_names.append(item['name'])
            unique_items.append(item)
            if len(unique_items) >= 10:
                break
    
    # 총 종류 수 계산 (중복 제거)
    all_unique_names = list(set([item['name'] for item in inventory_list]))
    total_count = len(all_unique_names)
    
    return jsonify({
        'items': unique_items[:10],  # 최대 10개
        'displayNames': [item['name'] for item in unique_items[:10]],
        'totalCount': total_count
    })

@app.route('/api/cooking-recommend', methods=['POST'])
def get_cooking_recommendations():
    """Get AI cooking recommendations based on available ingredients"""
    try:
        db = get_db()
        cursor = db.cursor()
        current_date = datetime.now()
        
        # Get all available ingredients (non-frozen and frozen)
        cursor.execute("""
            SELECT f.id, f.name, f.quantity, f.remains, f.addedAt, f.storageDays, f.frozen
            FROM foodItems f
            LEFT JOIN storageInfo s ON f.storageId = s.id
            WHERE f.remains > 0 AND (s.category != '과일' OR s.category IS NULL)
            ORDER BY f.addedAt DESC
        """)
        items = cursor.fetchall()
        db.close()
        
        ingredients_list = []
        
        for item in items:
            item_dict = dict(item)
            
            # Calculate priority based on expiry and frozen status
            priority = "보통"  # default for frozen items
            
            if not item_dict['frozen']:
                # Calculate urgency for non-frozen items
                if item_dict['storageDays'] and item_dict['addedAt']:
                    try:
                        added_date = datetime.fromisoformat(item_dict['addedAt'])
                        days_passed = (current_date - added_date).days
                        remaining_days = item_dict['storageDays'] - days_passed
                        
                        if remaining_days < 0:
                            # Expired items - highest priority
                            priority = "높음"
                        elif remaining_days <= 2:
                            # Expiring soon (within 2 days) - high priority
                            priority = "높음"
                        elif remaining_days <= 5:
                            # Expiring soon (within 5 days) - medium priority
                            priority = "보통"
                        else:
                            # Still fresh - low priority
                            priority = "낮음"
                    except:
                        priority = "보통"
            
            ingredients_list.append({
                "name": item_dict['name'],
                "priority": priority
            })
        
        # Remove duplicates while keeping the highest priority
        unique_ingredients = {}
        for ingredient in ingredients_list:
            name = ingredient['name']
            priority = ingredient['priority']
            
            if name not in unique_ingredients:
                unique_ingredients[name] = ingredient
            else:
                # If already exists, keep the higher priority
                existing_priority = unique_ingredients[name]['priority']
                if priority == "높음" or (priority == "보통" and existing_priority == "낮음"):
                    unique_ingredients[name] = ingredient
        
        ingredients_data = list(unique_ingredients.values())
        
        # 재료 이름에서 괄호 부가 정보 제거하는 함수
        def clean_ingredient_name(ingredient_name):
            import re
            # 괄호와 그 안의 내용을 제거 (예: "두부 (선택사항)" -> "두부")
            return re.sub(r'\s*\([^)]*\)', '', ingredient_name).strip()
        
        # 재료 이름 정리
        cleaned_ingredients_data = []
        for ingredient in ingredients_data:
            cleaned_ingredient = ingredient.copy()
            cleaned_ingredient['name'] = clean_ingredient_name(ingredient['name'])
            cleaned_ingredients_data.append(cleaned_ingredient)
        
        # Create prompt for AI
        ingredients_json = json.dumps(cleaned_ingredients_data, ensure_ascii=False, indent=2)
        
        prompt = f"""당신은 30년차 요리연구가입니다. 

가지고 있는 식재료와 우선순위는 다음과 같습니다.
{ingredients_json}

위 식재료를 활용하여 만들 수 있는 요리를 3~5개 정도 추천해 주세요. 
추천 요리는 우선순위가 높은 식재료를 최대한 활용하는 요리들로 구성해주세요.

각 요리에 대해 다음 정보를 포함하여 JSON 형식으로 응답해 주세요.
1. 요리 제목 (key: "title")
2. 필요한 재료 (key: "ingredients", array of strings)
3. 난이도 (key: "difficulty", value: "쉬움", "보통", "어려움")
4. 예상 소요 시간 (key: "time", value: "30분 이내", "1시간 이내", "1시간 이상")
5. YouTube 검색어 (key: "Youtube_query")

YouTube 검색어는 해당 요리의 조리법을 찾을 수 있는 적절한 검색어로 작성해주세요. 
예시: "시금치 애호박 볶음 조리법", "돼지고기 된장찌개 만드는법" 등

요리를 선택할 수 있도록 여러 가지 옵션을 제시하는 형식으로 결과를 출력해주세요.

JSON 형식으로만 응답해주세요."""
        
        # Call Gemini AI
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(prompt)
        
        # Parse AI response
        response_text = response.text.strip()
        if response_text.startswith('```json') and response_text.endswith('```'):
            response_text = response_text[7:-3].strip()
        
        recommendations = json.loads(response_text)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'ingredients': ingredients_data
        })
        
    except Exception as e:
        print(f"Error getting cooking recommendations: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, name, quantity, remains, addedAt, image, storageDays, frozen FROM foodItems WHERE remains > 0 AND frozen = 0 ORDER BY addedAt DESC")
    items = cursor.fetchall()
    db.close()
    
    inventory_list = []
    current_date = datetime.now()
    
    for item in items:
        item_dict = dict(item)
        
        # 소비기한 계산
        if item_dict['storageDays'] and item_dict['addedAt']:
            try:
                added_date = datetime.fromisoformat(item_dict['addedAt'])
                days_passed = (current_date - added_date).days
                remaining_days = item_dict['storageDays'] - days_passed
                
                if remaining_days > 0:
                    item_dict['remainingDays'] = remaining_days
                    item_dict['expiryStatus'] = f"D-{remaining_days}일"
                    
                    # 색상 계산 (10단계 그라데이션)
                    ratio = remaining_days / item_dict['storageDays']
                    if ratio >= 0.9:
                        item_dict['expiryColor'] = "green-500"  # 90-100%
                    elif ratio >= 0.8:
                        item_dict['expiryColor'] = "green-400"  # 80-89%
                    elif ratio >= 0.7:
                        item_dict['expiryColor'] = "green-300"  # 70-79%
                    elif ratio >= 0.6:
                        item_dict['expiryColor'] = "yellow-400"  # 60-69%
                    elif ratio >= 0.5:
                        item_dict['expiryColor'] = "yellow-500"  # 50-59%
                    elif ratio >= 0.4:
                        item_dict['expiryColor'] = "orange-400"  # 40-49%
                    elif ratio >= 0.3:
                        item_dict['expiryColor'] = "orange-500"  # 30-39%
                    elif ratio >= 0.2:
                        item_dict['expiryColor'] = "red-400"  # 20-29%
                    elif ratio >= 0.1:
                        item_dict['expiryColor'] = "red-500"  # 10-19%
                    else:
                        item_dict['expiryColor'] = "red-600"  # 0-9%
                else:
                    item_dict['remainingDays'] = 0
                    expired_days = abs(remaining_days)  # 만료된 일수
                    item_dict['expiryStatus'] = f"D+{expired_days}일"
                    item_dict['expiryColor'] = "red-700"  # 진한 빨간색
            except:
                item_dict['remainingDays'] = None
                item_dict['expiryStatus'] = "계산 불가"
                item_dict['expiryColor'] = "gray-400"
        else:
            item_dict['remainingDays'] = None
            item_dict['expiryStatus'] = "D-?일"
            item_dict['expiryColor'] = "gray-400"
        
        if item_dict['image']:
            # 이미지가 이미 base64 문자열인지 확인
            if isinstance(item_dict['image'], bytes):
                item_dict['image'] = item_dict['image'].decode('utf-8')
            # base64 문자열이 아니면 'data:image/jpeg;base64,' 접두사 추가
            if not item_dict['image'].startswith('data:'):
                item_dict['image'] = 'data:image/jpeg;base64,' + item_dict['image']
        
        inventory_list.append(item_dict)

    return jsonify(inventory_list)

@app.route('/api/frozen', methods=['GET'])
def get_frozen():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, name, quantity, remains, addedAt, image, storageDays, frozen FROM foodItems WHERE remains > 0 AND frozen = 1 ORDER BY addedAt DESC")
    items = cursor.fetchall()
    db.close()
    
    frozen_list = []
    current_date = datetime.now()
    
    for item in items:
        item_dict = dict(item)
        
        # 소비기한 계산
        if item_dict['storageDays'] and item_dict['addedAt']:
            try:
                added_date = datetime.fromisoformat(item_dict['addedAt'])
                days_passed = (current_date - added_date).days
                remaining_days = item_dict['storageDays'] - days_passed
                
                if remaining_days > 0:
                    item_dict['remainingDays'] = remaining_days
                    item_dict['expiryStatus'] = f"D-{remaining_days}일"
                    
                    # 색상 계산 (10단계 그라데이션)
                    ratio = remaining_days / item_dict['storageDays']
                    if ratio >= 0.9:
                        item_dict['expiryColor'] = "green-500"  # 90-100%
                    elif ratio >= 0.8:
                        item_dict['expiryColor'] = "green-400"  # 80-89%
                    elif ratio >= 0.7:
                        item_dict['expiryColor'] = "green-300"  # 70-79%
                    elif ratio >= 0.6:
                        item_dict['expiryColor'] = "yellow-400"  # 60-69%
                    elif ratio >= 0.5:
                        item_dict['expiryColor'] = "yellow-500"  # 50-59%
                    elif ratio >= 0.4:
                        item_dict['expiryColor'] = "orange-400"  # 40-49%
                    elif ratio >= 0.3:
                        item_dict['expiryColor'] = "orange-500"  # 30-39%
                    elif ratio >= 0.2:
                        item_dict['expiryColor'] = "red-400"  # 20-29%
                    elif ratio >= 0.1:
                        item_dict['expiryColor'] = "red-500"  # 10-19%
                    else:
                        item_dict['expiryColor'] = "red-600"  # 0-9%
                else:
                    item_dict['remainingDays'] = 0
                    expired_days = abs(remaining_days)  # 만료된 일수
                    item_dict['expiryStatus'] = f"D+{expired_days}일"
                    item_dict['expiryColor'] = "red-700"  # 진한 빨간색
            except:
                item_dict['remainingDays'] = None
                item_dict['expiryStatus'] = "계산 불가"
                item_dict['expiryColor'] = "gray-400"
        else:
            item_dict['remainingDays'] = None
            item_dict['expiryStatus'] = "D-?일"
            item_dict['expiryColor'] = "gray-400"
        
        if item_dict['image']:
            # 이미지가 이미 base64 문자열인지 확인
            if isinstance(item_dict['image'], bytes):
                item_dict['image'] = item_dict['image'].decode('utf-8')
            # base64 문자열이 아니면 'data:image/jpeg;base64,' 접두사 추가
            if not item_dict['image'].startswith('data:'):
                item_dict['image'] = 'data:image/jpeg;base64,' + item_dict['image']
        
        frozen_list.append(item_dict)

    return jsonify(frozen_list)

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    data = request.get_json()
    image_data_url = data.get('image')

    if not image_data_url:
        return jsonify({'error': 'No image data provided.'}), 400

    try:
        # Extract base64 string from data URL
        header, base64_string = image_data_url.split(',', 1)
        image_bytes = base64.b64decode(base64_string)

        # Get actual image dimensions for coordinate scaling
        pil_image = Image.open(io.BytesIO(image_bytes))
        image_width, image_height = pil_image.size

        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        image_part = {
            'mime_type': header.split(':')[1].split(';')[0],
            'data': image_bytes
        }
        
        prompt = '''Analyze the provided image and identify all food ingredients. For each ingredient, provide its Korean name and an estimated quantity (e.g., 3 apples, 2 onions).

Detect the 2d bounding boxes of objects in the image. Return normalized bounding box coordinates in the format [y1, x1, y2, x2] where coordinates are scaled from 0 to 1000.

For each detected food ingredient, provide:
1. Korean name
2. Estimated quantity  
3. Bounding box coordinates as [y1, x1, y2, x2] (normalized 0-1000 scale)

Return results as JSON array. Example format:
[
    {
        "name": "오이", 
        "quantity": 3, 
        "box_2d": [100, 200, 400, 500]
    },
    {
        "name": "양파", 
        "quantity": 2, 
        "box_2d": [300, 100, 600, 400]
    }
]

Return just the JSON array, no additional text.'''
        
        response = model.generate_content([prompt, image_part])
        
        # Attempt to parse the response as JSON. Gemini might return text with JSON inside.
        try:
            # Clean the response text to ensure it's valid JSON
            # This is a common issue with LLM outputs, they might include markdown or extra text
            json_string = response.text.strip()
            if json_string.startswith('```json') and json_string.endswith('```'):
                json_string = json_string[7:-3].strip()
            
            items = json.loads(json_string)
            
            # Process and validate bounding box coordinates
            print(f"AI returned {len(items)} items for image size: {image_width}x{image_height}")
            processed_items = []
            
            for i, item in enumerate(items):
                print(f"  Item {i+1}: {item.get('name', 'Unknown')}")
                
                if 'box_2d' in item:
                    # Process normalized coordinates from Gemini (0-1000 scale)
                    box_2d = item['box_2d']
                    print(f"    Raw box_2d from AI: {box_2d}")
                    
                    if len(box_2d) == 4:
                        # Gemini returns [y1, x1, y2, x2] in normalized coordinates (0-1000)
                        y1, x1, y2, x2 = box_2d
                        
                        # Scale normalized coordinates (0-1000) to actual image dimensions
                        y1 = y1 / 1000 * image_height
                        x1 = x1 / 1000 * image_width
                        y2 = y2 / 1000 * image_height
                        x2 = x2 / 1000 * image_width
                        
                        # Ensure coordinates are in correct order
                        if x1 > x2:
                            x1, x2 = x2, x1  # Swap x-coordinates if needed
                        if y1 > y2:
                            y1, y2 = y2, y1  # Swap y-coordinates if needed
                            
                        # Convert to [x, y, width, height] format for frontend
                        x = int(x1)
                        y = int(y1)
                        width = int(x2 - x1)
                        height = int(y2 - y1)
                        
                        # Validate coordinates are within image bounds
                        if x >= 0 and y >= 0 and x + width <= image_width and y + height <= image_height:
                            item['boundingBox'] = [x, y, width, height]
                            print(f"    ✅ Processed bounding box: [x={x}, y={y}, w={width}, h={height}]")
                            print(f"    Area: {width * height} pixels")
                        else:
                            print(f"    ❌ WARNING: Bounding box out of bounds, skipping")
                            item['boundingBox'] = None
                    else:
                        print(f"    ❌ ERROR: Invalid box_2d format (expected 4 values, got {len(box_2d)})")
                        item['boundingBox'] = None
                        
                    # Remove the raw box_2d from the response
                    del item['box_2d']
                else:
                    print(f"    ❌ ERROR: No box_2d provided")
                    item['boundingBox'] = None
                
                processed_items.append(item)
            
            items = processed_items
                    
        except json.JSONDecodeError:
            print(f"AI response not valid JSON: {response.text}")
            return jsonify({'error': 'AI response could not be parsed. Please try again.', 'raw_response': response.text}), 500

        # Get storage info for each detected item
        db = get_db()
        cursor = db.cursor()
        
        items_with_storage = []
        for item in items:
            # Search for storage info by name
            cursor.execute("SELECT id, storageDays, storageDesc FROM storageInfo WHERE name = ?", (item['name'],))
            storage_info = cursor.fetchone()
            
            if storage_info:
                item['storageId'] = storage_info['id']
                item['storageDays'] = storage_info['storageDays']
                item['storageDesc'] = storage_info['storageDesc']
            else:
                item['storageId'] = None
                item['storageDays'] = None
                item['storageDesc'] = None
            
            items_with_storage.append(item)
        
        db.close()
        
        return jsonify({'items': items_with_storage})

    except Exception as e:
        print(f"Error during AI analysis: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-items', methods=['POST'])
def save_items():
    data = request.get_json()
    items = data.get('items')

    if not items:
        return jsonify({'error': 'No items to save.'}), 400

    db = get_db()
    cursor = db.cursor()
    current_time = datetime.now().isoformat()

    for item in items:
        name = item.get('name')
        quantity = item.get('quantity')
        image = item.get('image') # This should be the base64 thumbnail

        if not all([name, quantity, image]):
            continue # Skip invalid items

        storageId = item.get('storageId')
        storageDays = item.get('storageDays')
        
        # If storageId is None, try to get or create storage info
        if storageId is None:
            storageId, storageDays = get_or_create_storage_info(cursor, name)
        
        cursor.execute("INSERT INTO foodItems (name, image, quantity, remains, addedAt, storageId, storageDays) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (name, image.encode('utf-8'), quantity, 1.0, current_time, storageId, storageDays))
    
    db.commit()
    db.close()
    return jsonify({'message': 'Items saved successfully!'}), 200

def get_or_create_storage_info(cursor, item_name):
    """Get existing storage info or create new one using AI"""
    # First, try to find existing storage info
    cursor.execute("SELECT id, storageDays FROM storageInfo WHERE name = ?", (item_name,))
    existing = cursor.fetchone()
    
    if existing:
        return existing['id'], existing['storageDays']
    
    # If not found, create new storage info using AI
    try:
        storage_info = create_storage_info_with_ai(item_name)
        if storage_info:
            cursor.execute("""
                INSERT INTO storageInfo (category, name, storageDays, storageDesc, storageMethod)
                VALUES (?, ?, ?, ?, ?)
            """, (
                storage_info['category'],
                storage_info['name'],
                storage_info['storageDays'],
                storage_info['storageDesc'],
                storage_info['storageMethod']
            ))
            
            # Get the newly created storage info ID
            cursor.execute("SELECT id, storageDays FROM storageInfo WHERE name = ?", (item_name,))
            new_storage = cursor.fetchone()
            return new_storage['id'], new_storage['storageDays']
    except Exception as e:
        print(f"Error creating storage info for {item_name}: {e}")
    
    # Return None if failed to create
    return None, None

def create_storage_info_with_ai(item_name):
    """Use AI to create storage info for unknown items"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        
        prompt = f'''다음 식재료에 대한 보관 정보를 제공해주세요: "{item_name}"

다음 형식으로 JSON 응답을 제공해주세요:
{{
    "category": "카테고리 (예: 야채, 과일, 기타)",
    "name": "{item_name}",
    "storageDays": 숫자 (일 단위),
    "storageDesc": "권장 소비기간 (25자 이내로 간결하게 작성, 예: 5~7일)",
    "storageMethod": "상세한 보관 방법 설명 (200자 이내로 간결하게 작성)"
}}

예시:
- 야채류: 냉장 보관, 키친타월 사용, 밀폐용기 등
- 과일류: 실온/냉장 보관, 에틸렌 가스 고려 등
- 기타: 냉장/냉동 보관, 특별한 보관 조건 등

주의사항:
- storageDesc는 25자 이내로 간결하게 작성 (예: "5~7일", "1~2주", "3~4일")
- storageMethod는 200자 이내로 간결하고 핵심적인 보관 방법만 설명
- 불필요한 설명은 제외하고 실용적인 정보만 포함

JSON 형식으로만 응답해주세요.'''

        response = model.generate_content(prompt)
        
        # Parse JSON response
        json_string = response.text.strip()
        if json_string.startswith('```json') and json_string.endswith('```'):
            json_string = json_string[7:-3].strip()
        
        storage_info = json.loads(json_string)
        
        # Validate required fields
        required_fields = ['category', 'name', 'storageDays', 'storageDesc', 'storageMethod']
        if all(field in storage_info for field in required_fields):
            return storage_info
        else:
            print(f"Invalid storage info response for {item_name}")
            return None
            
    except Exception as e:
        print(f"Error getting AI storage info for {item_name}: {e}")
        return None

@app.route('/api/inventory/<int:item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM foodItems WHERE id = ?", (item_id,))
        db.commit()
        db.close()
        
        if cursor.rowcount > 0:
            return jsonify({'message': 'Item deleted successfully!'}), 200
        else:
            return jsonify({'error': 'Item not found.'}), 404
    except Exception as e:
        print(f"Error deleting item: {e}")
        return jsonify({'error': 'Failed to delete item.'}), 500

@app.route('/api/inventory/<int:item_id>/update-remains', methods=['POST'])
def update_inventory_remains(item_id):
    try:
        data = request.get_json()
        new_remains = data.get('remains')
        waste = data.get('waste', False)
        
        if new_remains is None or not (0 <= new_remains <= 1):
            return jsonify({'error': 'Invalid remains value. Must be between 0 and 1.'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Get current remains value
        cursor.execute("SELECT remains FROM foodItems WHERE id = ?", (item_id,))
        result = cursor.fetchone()
        
        if not result:
            db.close()
            return jsonify({'error': 'Item not found.'}), 404
        
        remain_before = result['remains']
        current_time = datetime.now().isoformat()
        
        # Update inventory remains
        cursor.execute("UPDATE foodItems SET remains = ? WHERE id = ?", (new_remains, item_id))
        
        # Insert into history table
        cursor.execute("""
            INSERT INTO history (foodItemId, updateDate, remainBefore, remainAfter, waste)
            VALUES (?, ?, ?, ?, ?)
        """, (item_id, current_time, remain_before, new_remains, waste))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Remains updated successfully!'}), 200
        
    except Exception as e:
        print(f"Error updating remains: {e}")
        return jsonify({'error': 'Failed to update remains.'}), 500

@app.route('/api/inventory/<int:item_id>/freeze', methods=['POST'])
def freeze_inventory_item(item_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get current item info
        cursor.execute("SELECT remains FROM foodItems WHERE id = ?", (item_id,))
        result = cursor.fetchone()
        
        if not result:
            db.close()
            return jsonify({'error': 'Item not found.'}), 404
        
        remain_before = result['remains']
        current_time = datetime.now().isoformat()
        
        # Update foodItems to frozen
        cursor.execute("UPDATE foodItems SET frozen = 1 WHERE id = ?", (item_id,))
        
        # Insert into history table with frozen = 1
        cursor.execute("""
            INSERT INTO history (foodItemId, updateDate, remainBefore, remainAfter, waste, frozen)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (item_id, current_time, remain_before, remain_before, False, True))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Item frozen successfully!'}), 200
        
    except Exception as e:
        print(f"Error freezing item: {e}")
        return jsonify({'error': 'Failed to freeze item.'}), 500

@app.route('/api/inventory/<int:item_id>/history', methods=['GET'])
def get_inventory_history(item_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get history data
        cursor.execute("""
            SELECT updateDate, remainBefore, remainAfter, waste, frozen
            FROM history 
            WHERE foodItemId = ? 
            ORDER BY updateDate DESC
        """, (item_id,))
        history_items = cursor.fetchall()
        
        # Get inventory added date and storage info
        cursor.execute("""
            SELECT i.addedAt, s.storageDesc, s.storageMethod
            FROM foodItems i
            LEFT JOIN storageInfo s ON i.storageId = s.id
            WHERE i.id = ?
        """, (item_id,))
        inventory_result = cursor.fetchone()
        
        db.close()
        
        if not inventory_result:
            return jsonify({'error': 'Item not found.'}), 404
        
        # Convert to list of dictionaries
        history_list = []
        for item in history_items:
            history_list.append({
                'updateDate': item['updateDate'],
                'remainBefore': item['remainBefore'],
                'remainAfter': item['remainAfter'],
                'waste': item['waste'],
                'frozen': item['frozen']
            })
        
        return jsonify({
            'history': history_list,
            'addedAt': inventory_result['addedAt'],
            'storageDesc': inventory_result['storageDesc'],
            'storageMethod': inventory_result['storageMethod']
        }), 200
        
    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({'error': 'Failed to fetch history.'}), 500

@app.route('/api/inventory/history', methods=['GET'])
def get_all_history():
    """Get all consumed items (remains = 0) with their consumption statistics"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get all consumed items (remains = 0) with their history
        cursor.execute("""
            SELECT 
                i.id,
                i.name,
                i.quantity,
                i.addedAt,
                h.updateDate as consumedAt,
                h.remainBefore,
                h.remainAfter,
                h.waste
            FROM foodItems i
            LEFT JOIN history h ON i.id = h.foodItemId
            WHERE i.remains = 0
            ORDER BY h.updateDate DESC
        """)
        
        items = cursor.fetchall()
        db.close()
        
        # Group by item and calculate statistics
        item_stats = {}
        for item in items:
            item_id = item['id']
            if item_id not in item_stats:
                item_stats[item_id] = {
                    'id': item_id,
                    'name': item['name'],
                    'quantity': item['quantity'],
                    'addedAt': item['addedAt'],
                    'consumedAt': item['consumedAt'],
                    'totalUsed': 0,
                    'totalWasted': 0
                }
            
            # Calculate usage from history
            if item['remainBefore'] is not None and item['remainAfter'] is not None:
                usage = item['remainBefore'] - item['remainAfter']
                if item['waste']:
                    item_stats[item_id]['totalWasted'] += usage
                else:
                    item_stats[item_id]['totalUsed'] += usage
        
        # Convert to list
        history_items = list(item_stats.values())
        
        return jsonify(history_items), 200
        
    except Exception as e:
        print(f"Error fetching all history: {e}")
        return jsonify({'error': 'Failed to fetch history.'}), 500

# CookBook API endpoints
@app.route('/api/cookbook', methods=['POST'])
def add_to_cookbook():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'ingredients', 'difficulty', 'time', 'youtube_query']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if recipe already exists
        cursor.execute('''
            SELECT id FROM cookBook 
            WHERE title = ? AND Youtube_query = ?
        ''', (data['title'], data['youtube_query']))
        
        existing_recipe = cursor.fetchone()
        
        if existing_recipe:
            # Update existing recipe
            cursor.execute('''
                UPDATE cookBook 
                SET bookmark = ?, cart = ?
                WHERE id = ?
            ''', (data.get('bookmark', False), data.get('cart', False), existing_recipe['id']))
            
            recipe_id = existing_recipe['id']
        else:
            # Insert new recipe
            cursor.execute('''
                INSERT INTO cookBook (insertDate, title, ingredients, difficulty, time, Youtube_query, bookmark, cart)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                data['title'],
                json.dumps(data['ingredients']),  # Store ingredients as JSON string
                data['difficulty'],
                data['time'],
                data['youtube_query'],
                data.get('bookmark', False),
                data.get('cart', False)
            ))
            
            recipe_id = cursor.lastrowid
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'id': recipe_id,
            'message': 'Recipe saved to cookbook'
        })
        
    except Exception as e:
        print(f"Error adding to cookbook: {e}")
        return jsonify({'error': 'Failed to save recipe'}), 500

@app.route('/api/cookbook/bookmark', methods=['POST'])
def toggle_bookmark():
    try:
        data = request.get_json()
        
        if 'title' not in data or 'youtube_query' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if recipe exists
        cursor.execute('''
            SELECT id, bookmark FROM cookBook 
            WHERE title = ? AND Youtube_query = ?
        ''', (data['title'], data['youtube_query']))
        
        existing_recipe = cursor.fetchone()
        
        if existing_recipe:
            # Toggle bookmark status
            new_bookmark_status = not existing_recipe['bookmark']
            cursor.execute('''
                UPDATE cookBook 
                SET bookmark = ?
                WHERE id = ?
            ''', (new_bookmark_status, existing_recipe['id']))
            
            db.commit()
            db.close()
            
            return jsonify({
                'success': True,
                'bookmark': new_bookmark_status,
                'message': f'Bookmark {"added" if new_bookmark_status else "removed"}'
            })
        else:
            db.close()
            return jsonify({'error': 'Recipe not found'}), 404
        
    except Exception as e:
        print(f"Error toggling bookmark: {e}")
        return jsonify({'error': 'Failed to toggle bookmark'}), 500

@app.route('/api/cookbook/cart', methods=['POST'])
def toggle_cart():
    try:
        data = request.get_json()
        
        if 'title' not in data or 'youtube_query' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if recipe exists
        cursor.execute('''
            SELECT id, cart FROM cookBook 
            WHERE title = ? AND Youtube_query = ?
        ''', (data['title'], data['youtube_query']))
        
        existing_recipe = cursor.fetchone()
        
        if existing_recipe:
            # Toggle cart status
            new_cart_status = not existing_recipe['cart']
            cursor.execute('''
                UPDATE cookBook 
                SET cart = ?
                WHERE id = ?
            ''', (new_cart_status, existing_recipe['id']))
            
            db.commit()
            db.close()
            
            return jsonify({
                'success': True,
                'cart': new_cart_status,
                'message': f'Cart {"added" if new_cart_status else "removed"}'
            })
        else:
            db.close()
            return jsonify({'error': 'Recipe not found'}), 404
        
    except Exception as e:
        print(f"Error toggling cart: {e}")
        return jsonify({'error': 'Failed to toggle cart'}), 500

@app.route('/api/all-inventory', methods=['GET'])
def get_all_inventory():
    """Get all inventory items including those with remains = 0"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT id, name, quantity, remains, addedAt, storageDays, frozen, image FROM foodItems ORDER BY addedAt DESC")
        items = cursor.fetchall()
        db.close()
        
        inventory_list = []
        for item in items:
            item_dict = dict(item)
            
            # 이미지 처리 (기존 inventory 엔드포인트와 동일한 로직)
            if item_dict['image']:
                # 이미지가 이미 base64 문자열인지 확인
                if isinstance(item_dict['image'], bytes):
                    item_dict['image'] = item_dict['image'].decode('utf-8')
                # base64 문자열이 아니면 'data:image/jpeg;base64,' 접두사 추가
                if not item_dict['image'].startswith('data:'):
                    item_dict['image'] = 'data:image/jpeg;base64,' + item_dict['image']
            
            inventory_list.append(item_dict)
        
        return jsonify(inventory_list)
        
    except Exception as e:
        print(f"Error getting all inventory: {e}")
        return jsonify({'error': 'Failed to get all inventory'}), 500

@app.route('/api/shopping-list', methods=['GET'])
def get_shopping_list():
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get all shopping list entries
        cursor.execute('''
            SELECT id, insertDate, updateDate, name, todo, memo
            FROM shoppingList
            ORDER BY updateDate DESC
        ''')
        
        shopping_records = cursor.fetchall()
        
        # Convert to list of dictionaries
        shopping_list = []
        for record in shopping_records:
            shopping_list.append({
                'id': record['id'],
                'insertDate': record['insertDate'],
                'updateDate': record['updateDate'],
                'name': record['name'],
                'todo': bool(record['todo']),
                'memo': record['memo']
            })
        
        db.close()
        return jsonify(shopping_list)
        
    except Exception as e:
        print(f"Error getting shopping list: {e}")
        return jsonify({'error': 'Failed to get shopping list'}), 500

@app.route('/api/shopping-list', methods=['POST'])
def update_shopping_list():
    try:
        data = request.get_json()
        
        if 'ingredients' not in data or 'recipeTitle' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        current_date = datetime.now().isoformat()
        
        # Get existing shopping list items
        cursor.execute('SELECT name FROM shoppingList WHERE todo = 1')
        existing_items = [row['name'] for row in cursor.fetchall()]
        
        # Process each ingredient
        for ingredient in data['ingredients']:
            # Remove checkmark if present
            clean_name = ingredient.replace('✓ ', '').strip()
            
            if clean_name in existing_items:
                # Update existing item
                cursor.execute('''
                    UPDATE shoppingList 
                    SET updateDate = ?, memo = ?
                    WHERE name = ? AND todo = 1
                ''', (current_date, data['recipeTitle'], clean_name))
            else:
                # Insert new item
                cursor.execute('''
                    INSERT INTO shoppingList (insertDate, updateDate, name, todo, memo)
                    VALUES (?, ?, ?, ?, ?)
                ''', (current_date, current_date, clean_name, True, data['recipeTitle']))
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping list updated successfully'})
        
    except Exception as e:
        print(f"Error updating shopping list: {e}")
        return jsonify({'error': 'Failed to update shopping list'}), 500

@app.route('/api/shopping-list/update', methods=['POST'])
def update_shopping_list_detailed():
    try:
        data = request.get_json()
        
        if 'ingredients' not in data or 'recipeTitle' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        current_date = datetime.now().isoformat()
        
        # Process each ingredient with todo status
        for ingredient_data in data['ingredients']:
            name = ingredient_data['name']
            todo = ingredient_data['todo']
            memo = ingredient_data.get('memo')
            
            # Check if item already exists
            cursor.execute('SELECT id FROM shoppingList WHERE name = ?', (name,))
            existing_item = cursor.fetchone()
            
            if existing_item:
                # Update existing item
                cursor.execute('''
                    UPDATE shoppingList 
                    SET updateDate = ?, todo = ?, memo = ?
                    WHERE name = ?
                ''', (current_date, todo, memo, name))
            else:
                # Insert new item
                cursor.execute('''
                    INSERT INTO shoppingList (insertDate, updateDate, name, todo, memo)
                    VALUES (?, ?, ?, ?, ?)
                ''', (current_date, current_date, name, todo, memo))
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping list updated successfully'})
        
    except Exception as e:
        print(f"Error updating shopping list: {e}")
        return jsonify({'error': 'Failed to update shopping list'}), 500

@app.route('/api/shopping-list/toggle', methods=['POST'])
def toggle_shopping_item():
    try:
        data = request.get_json()
        
        if 'itemId' not in data or 'todo' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        item_id = data['itemId']
        todo = data['todo']
        
        db = get_db()
        cursor = db.cursor()
        
        current_date = datetime.now().isoformat()
        
        # Update the item's todo status
        cursor.execute('''
            UPDATE shoppingList 
            SET updateDate = ?, todo = ?
            WHERE id = ?
        ''', (current_date, todo, item_id))
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'error': 'Item not found'}), 404
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping item updated successfully'})
        
    except Exception as e:
        print(f"Error toggling shopping item: {e}")
        return jsonify({'error': 'Failed to update shopping item'}), 500

@app.route('/api/shopping-list/update-item', methods=['POST'])
def update_shopping_item():
    try:
        data = request.get_json()
        
        if 'itemId' not in data:
            return jsonify({'error': 'Missing itemId field'}), 400
        
        item_id = data['itemId']
        name = data.get('name')
        memo = data.get('memo')
        
        if not name and not memo:
            return jsonify({'error': 'At least one field (name or memo) must be provided'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        current_date = datetime.now().isoformat()
        
        # Build update query dynamically
        update_fields = ['updateDate = ?']
        update_values = [current_date]
        
        if name is not None:
            update_fields.append('name = ?')
            update_values.append(name)
        
        if memo is not None:
            update_fields.append('memo = ?')
            update_values.append(memo)
        
        update_values.append(item_id)
        
        query = f'''
            UPDATE shoppingList 
            SET {', '.join(update_fields)}
            WHERE id = ?
        '''
        
        cursor.execute(query, update_values)
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'error': 'Item not found'}), 404
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping item updated successfully'})
        
    except Exception as e:
        print(f"Error updating shopping item: {e}")
        return jsonify({'error': 'Failed to update shopping item'}), 500

@app.route('/api/shopping-list/<int:item_id>', methods=['DELETE'])
def delete_shopping_item(item_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Delete the item
        cursor.execute('DELETE FROM shoppingList WHERE id = ?', (item_id,))
        
        if cursor.rowcount == 0:
            db.close()
            return jsonify({'error': 'Item not found'}), 404
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping item deleted successfully'})
        
    except Exception as e:
        print(f"Error deleting shopping item: {e}")
        return jsonify({'error': 'Failed to delete shopping item'}), 500

@app.route('/api/shopping-list/add', methods=['POST'])
def add_shopping_item():
    try:
        data = request.get_json()
        
        if 'name' not in data:
            return jsonify({'error': 'Missing name field'}), 400
        
        name = data['name'].strip()
        if not name:
            return jsonify({'error': 'Name cannot be empty'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        current_date = datetime.now().isoformat()
        
        # Check if item already exists with todo=true (active shopping item)
        cursor.execute('SELECT id FROM shoppingList WHERE name = ? AND todo = ?', (name, True))
        existing_item = cursor.fetchone()
        
        if existing_item:
            db.close()
            return jsonify({'error': '이미 쇼핑 목록에 있는 재료입니다'}), 409
        
        # Insert new item
        cursor.execute('''
            INSERT INTO shoppingList (insertDate, updateDate, name, todo, memo)
            VALUES (?, ?, ?, ?, ?)
        ''', (current_date, current_date, name, True, None))
        
        db.commit()
        db.close()
        
        return jsonify({'success': True, 'message': 'Shopping item added successfully'})
        
    except Exception as e:
        print(f"Error adding shopping item: {e}")
        return jsonify({'error': 'Failed to add shopping item'}), 500

@app.route('/api/shopping-list/count', methods=['GET'])
def get_shopping_list_count():
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) as count FROM shoppingList 
            WHERE todo = TRUE
        ''')
        
        result = cursor.fetchone()
        count = result['count'] if result else 0
        
        db.close()
        return jsonify({'count': count})
        
    except Exception as e:
        print(f"Error getting shopping list count: {e}")
        return jsonify({'error': 'Failed to get shopping list count'}), 500

@app.route('/api/cookbook', methods=['GET'])
def get_cookbook():
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get all cookbook entries
        cursor.execute('''
            SELECT id, insertDate, title, ingredients, difficulty, time, Youtube_query, bookmark, cart
            FROM cookBook
            ORDER BY insertDate DESC
        ''')
        
        cookbook_records = cursor.fetchall()
        
        # Convert to list of dictionaries
        cookbook_list = []
        for record in cookbook_records:
            cookbook_list.append({
                'id': record['id'],
                'insertDate': record['insertDate'],
                'title': record['title'],
                'ingredients': json.loads(record['ingredients']),  # Parse JSON string back to list
                'difficulty': record['difficulty'],
                'time': record['time'],
                'youtube_query': record['Youtube_query'],
                'bookmark': bool(record['bookmark']),
                'cart': bool(record['cart'])
            })
        
        db.close()
        return jsonify(cookbook_list)
        
    except Exception as e:
        print(f"Error getting cookbook: {e}")
        return jsonify({'error': 'Failed to get cookbook'}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
