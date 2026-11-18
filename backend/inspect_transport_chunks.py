import sqlite3

conn = sqlite3.connect('backend/copilot.db')
cur = conn.cursor()
cur.execute("""
    SELECT d.id, d.name, d.filename, c.chunk_index, c.text 
    FROM documents d 
    JOIN document_chunks c ON d.id = c.document_id 
    WHERE d.category LIKE '%Transport%' OR d.name LIKE '%Bus%' OR d.name LIKE '%Day Scholars%'
""")
rows = cur.fetchall()
print(f"Total Transport / Bus / Day Scholar chunks: {len(rows)}")
for r in rows:
    print(f"\n=== Doc: {r[1]} ({r[2]}) | Chunk {r[3]} ===")
    print(r[4][:400])
conn.close()
