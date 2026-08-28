import os
import json
import sqlite3
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "user_profiles.db")

class UserProfile(BaseModel):
    user_id: str
    name: str = "Learner"
    mastery_score: int = 15 # 0 - 100%
    current_topic_index: int = 0
    completed_topics: List[str] = []
    doubts_logged: List[str] = []
    learning_style: str = "visual_intuitive" # "visual_intuitive" | "rigorous_mathematical"
    total_interactions: int = 0

class UserService:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(DB_PATH)

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    name TEXT,
                    mastery_score INTEGER,
                    current_topic_index INTEGER,
                    completed_topics TEXT,
                    doubts_logged TEXT,
                    learning_style TEXT,
                    total_interactions INTEGER
                )
            """)
            conn.commit()

    def get_or_create_user(self, user_id: str, name: str = "Learner") -> UserProfile:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return UserProfile(
                    user_id=row[0],
                    name=row[1],
                    mastery_score=row[2],
                    current_topic_index=row[3],
                    completed_topics=json.loads(row[4]),
                    doubts_logged=json.loads(row[5]),
                    learning_style=row[6],
                    total_interactions=row[7]
                )
            
            # Create new profile
            profile = UserProfile(user_id=user_id, name=name)
            cursor.execute("""
                INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                profile.user_id,
                profile.name,
                profile.mastery_score,
                profile.current_topic_index,
                json.dumps(profile.completed_topics),
                json.dumps(profile.doubts_logged),
                profile.learning_style,
                profile.total_interactions
            ))
            conn.commit()
            return profile

    def update_progress(
        self, 
        user_id: str, 
        topic_name: Optional[str] = None, 
        mastery_delta: int = 0,
        advance_topic: bool = False,
        doubt: Optional[str] = None
    ) -> UserProfile:
        profile = self.get_or_create_user(user_id)
        profile.mastery_score = max(0, min(100, profile.mastery_score + mastery_delta))
        profile.total_interactions += 1

        if topic_name and topic_name not in profile.completed_topics and advance_topic:
            profile.completed_topics.append(topic_name)
            profile.current_topic_index = min(4, profile.current_topic_index + 1)

        if doubt:
            profile.doubts_logged.append(doubt)

        with self._get_connection() as conn:
            conn.execute("""
                UPDATE users SET 
                    mastery_score = ?,
                    current_topic_index = ?,
                    completed_topics = ?,
                    doubts_logged = ?,
                    total_interactions = ?
                WHERE user_id = ?
            """, (
                profile.mastery_score,
                profile.current_topic_index,
                json.dumps(profile.completed_topics),
                json.dumps(profile.doubts_logged),
                profile.total_interactions,
                profile.user_id
            ))
            conn.commit()

        return profile

user_service = UserService()
