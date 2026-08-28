import os
import re
import math
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
QDRANT_PATH = os.path.join(DATA_DIR, "qdrant_db")
COLLECTION_NAME = "kinematics_kb"

# Core domain terms
DOMAIN_VOCAB = [
    "horizontal", "velocity", "constant", "vx", "cos", "theta", "zero", "acceleration", "ax",
    "vertical", "gravity", "gravitational", "vy", "sin", "apex", "height", "maximum", "peak", "deceleration", "ay",
    "time", "flight", "landing", "period", "total",
    "range", "distance", "45", "degrees", "optimal", "angle", "complementary", "30", "60",
    "air", "resistance", "drag", "aerodynamic", "friction", "density", "terminal",
    "vector", "decomposition", "component", "position", "independent", "dimension", "2d", "projectile", "motion"
]

VECTOR_DIM = len(DOMAIN_VOCAB)

def tokenize(text: str) -> List[str]:
    return re.findall(r'\b[a-z0-9_]+\b', text.lower())

class QdrantVectorRAG:
    def __init__(self):
        os.makedirs(QDRANT_PATH, exist_ok=True)
        self.client = QdrantClient(path=QDRANT_PATH)
        self._ensure_collection()

    def _ensure_collection(self):
        collections = [c.name for c in self.client.get_collections().collections]
        if COLLECTION_NAME in collections:
            self.client.delete_collection(collection_name=COLLECTION_NAME)
        self.client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE)
        )

    def compute_embedding(self, text: str) -> List[float]:
        tokens = tokenize(text)
        token_set = set(tokens)
        vec = [0.0] * VECTOR_DIM
        
        for idx, term in enumerate(DOMAIN_VOCAB):
            count = tokens.count(term)
            if count > 0:
                vec[idx] = 1.0 + math.log(count)
            elif any(term in tok for tok in token_set):
                vec[idx] = 0.5

        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        else:
            vec = [1.0 / math.sqrt(VECTOR_DIM)] * VECTOR_DIM
        return vec

    def upsert_chunks(self, chunks: List[Dict[str, Any]]):
        points = []
        for idx, chunk in enumerate(chunks):
            embedding = self.compute_embedding(f"{chunk.get('topic', '')} {chunk.get('text', '')}")
            points.append(PointStruct(
                id=idx,
                vector=embedding,
                payload={
                    "topic": chunk.get("topic", "Kinematics"),
                    "text": chunk.get("text", ""),
                    "math_latex": chunk.get("math_latex", ""),
                    "frame_to_display": chunk.get("frame", "frame_000.jpg"),
                    "params": chunk.get("params", {"velocity": 25, "angle": 45, "gravity": 9.8})
                }
            ))
        self.client.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"Upserted {len(points)} vectors into Qdrant collection '{COLLECTION_NAME}' (dim={VECTOR_DIM}).")

    def search(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_vector = self.compute_embedding(query)
        hits = self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=top_k
        ).points
        results = []
        for hit in hits:
            results.append({
                "score": round(float(hit.score), 4),
                "payload": hit.payload
            })
        return results

qdrant_rag = QdrantVectorRAG()
