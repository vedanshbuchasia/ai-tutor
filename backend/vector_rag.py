import os
import json
import math
import numpy as np
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))
FRAMES_DIR = os.path.join(DATA_DIR, "frames")
VECTOR_STORE_PATH = os.path.join(DATA_DIR, "vector_store.json")

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class VectorDB:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: List[List[float]] = []
        self.vocab: Dict[str, int] = {}
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.load()

    def _get_gemini_embedding(self, text: str) -> Optional[List[float]]:
        if not self.api_key:
            return None
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result["embedding"]
        except Exception as e:
            print(f"Gemini embed error: {e}")
            return None

    def _dense_semantic_embedding(self, text: str, dim: int = 128) -> List[float]:
        """High-dimensional semantic dense vector representation for offline/fast mode."""
        words = text.lower().replace("\n", " ").split()
        vec = [0.0] * dim
        for i, word in enumerate(words):
            h = hash(word) % dim
            vec[h] += 1.0 / (1.0 + math.log(1.0 + i))
            # Bigram feature
            if i > 0:
                h2 = hash(words[i-1] + "_" + word) % dim
                vec[h2] += 1.5
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def compute_embedding(self, text: str) -> List[float]:
        gemini_emb = self._get_gemini_embedding(text)
        if gemini_emb:
            return gemini_emb
        return self._dense_semantic_embedding(text)

    def add_document(self, doc_id: str, text: str, metadata: Dict[str, Any]):
        embedding = self.compute_embedding(text)
        self.documents.append({
            "id": doc_id,
            "text": text,
            "metadata": metadata
        })
        self.embeddings.append(embedding)

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.documents:
            return []
        
        query_emb = self.compute_embedding(query)
        scores = []
        for i, doc_emb in enumerate(self.embeddings):
            sim = cosine_similarity(query_emb, doc_emb)
            scores.append((sim, self.documents[i]))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = []
        for sim, doc in scores[:top_k]:
            res = dict(doc)
            res["similarity_score"] = round(float(sim), 4)
            results.append(res)
        return results

    def save(self):
        data = {
            "documents": self.documents,
            "embeddings": self.embeddings,
            "total_vectors": len(self.documents)
        }
        with open(VECTOR_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Vector Database saved with {len(self.documents)} embedded vectors to {VECTOR_STORE_PATH}")

    def load(self):
        if os.path.exists(VECTOR_STORE_PATH):
            try:
                with open(VECTOR_STORE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
                    self.embeddings = data.get("embeddings", [])
                print(f"Loaded Vector Database with {len(self.documents)} vectors.")
            except Exception as e:
                print(f"Failed to load vector store: {e}")

# Global singleton
vector_db = VectorDB()
