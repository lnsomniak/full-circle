import sqlite3
import os

def setup_database():
    """create the listening history database with proper schema"""
    
    db_path = "listening_history.db"
    
    # connects and creates
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # creates play table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plays (
            played_at TEXT PRIMARY KEY,
            track_id TEXT NOT NULL,
            track_name TEXT NOT NULL,
            artist_names TEXT NOT NULL
        )
    """)
    
    # create metadata table to track last sync
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    
    # create index on track_id for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_track_id ON plays(track_id)
    """)
    
    conn.commit()
    conn.close()
    
    print(f"✓ database setup complete: {db_path}")
    print(f"  - plays table: stores each play with timestamp")
    print(f"  - sync_metadata table: tracks last sync time")
    print(f"  - index on track_id for fast lookups")

if __name__ == "__main__":
    setup_database()
