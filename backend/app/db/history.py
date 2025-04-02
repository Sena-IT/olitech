import sqlite3
from datetime import datetime
import json
from typing import List, Dict, Any, Optional

DB_FILE = "conversation_history.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='conversation_history'")
    table_exists = cursor.fetchone() is not None
    if table_exists:
        cursor.execute("DELETE FROM conversation_history")
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='conversation_history'")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            user_response TEXT,
            system_response TEXT
        )
    ''')
    print("Database initialized and truncated")
    conn.commit()
    conn.close()

def save_history(thread_id: str, user_response: Optional[Any] = None, system_response: Optional[Any] = None) -> None:
    timestamp = datetime.now().isoformat()
    user_response_json = json.dumps(user_response) if user_response is not None else None
    system_response_json = json.dumps(system_response) if system_response is not None else None

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO conversation_history (thread_id, timestamp, user_response, system_response)
        VALUES (?, ?, ?, ?)
    ''', (thread_id, timestamp, user_response_json, system_response_json))
    conn.commit()
    conn.close()

def get_history(thread_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    if thread_id:
        cursor.execute('''
            SELECT thread_id, timestamp, user_response, system_response FROM conversation_history
            WHERE thread_id = ?
            ORDER BY timestamp ASC
        ''', (thread_id,))
    else:
        cursor.execute('''
            SELECT thread_id, timestamp, user_response, system_response FROM conversation_history
            ORDER BY timestamp ASC
        ''')
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        user_response = None
        system_response = None
        if row[2]:
            try:
                user_response = json.loads(row[2])
            except json.JSONDecodeError as e:
                print(f"Failed to parse user_response for thread_id={row[0]}, timestamp={row[1]}: {row[2]}, error: {e}")
                user_response = {"message": row[2]}
        if row[3]:
            try:
                system_response = json.loads(row[3])
            except json.JSONDecodeError as e:
                print(f"Failed to parse system_response for thread_id={row[0]}, timestamp={row[1]}: {row[3]}, error: {e}")
                system_response = {"message": row[3]}
        history.append({"thread_id": row[0], "timestamp": row[1], "user_response": user_response, "system_response": system_response})
    return history

init_db()