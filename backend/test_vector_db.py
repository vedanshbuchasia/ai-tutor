from qdrant_rag import qdrant_rag

TEST_QUERIES = [
    "What is the horizontal velocity component?",
    "How does gravity affect vertical motion at maximum height?",
    "Why is 45 degrees the best angle for maximum distance?",
    "What happens when there is air resistance or friction?"
]

def test_queries():
    print("=== Testing Qdrant Vector Database Semantic Retrieval ===")
    for q in TEST_QUERIES:
        print(f"\n[Query]: '{q}'")
        results = qdrant_rag.search(q, top_k=1)
        for r in results:
            payload = r["payload"]
            print(f"   * Top Match (Similarity Score: {r['score']}): [{payload['topic']}]")
            print(f"     - Grounded Text: {payload['text'][:120]}...")
            print(f"     - LaTeX Formula: {payload['math_latex']}")
            print(f"     - Keyframe Image: {payload['frame_to_display']}")

if __name__ == "__main__":
    test_queries()
