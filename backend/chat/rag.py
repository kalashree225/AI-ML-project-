import math
from papers.models import DocumentChunk
from papers.tasks import generate_mock_embedding

def search_chunks_numpy(query, org_id, top_k=5):
    """
    In-memory vector search using NumPy (No-Docker fallback for pgvector).
    1. Fetches all chunks for the given org.
    2. Calculates cosine similarity against the query embedding.
    3. Returns top K chunks.
    """
    # In a real system, we'd embed the query using OpenAI here.
    query_embedding = generate_mock_embedding()

    # Demo mode: Search all chunks regardless of organization
    chunks = DocumentChunk.objects.exclude(embedding__isnull=True)
    
    if not chunks.exists():
        return []

    chunk_data = []
    embeddings_list = []

    for chunk in chunks:
        if chunk.embedding:
            chunk_data.append(chunk)
            embeddings_list.append(chunk.embedding)
            
    if not embeddings_list:
        return []

    # Compute dot product manually
    def cosine_similarity(vec1, vec2):
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))
        if norm_a == 0 or norm_b == 0:
            return 0
        return dot_product / (norm_a * norm_b)

    similarities = []
    for i, emb in enumerate(embeddings_list):
        sim = cosine_similarity(query_embedding, emb)
        similarities.append((i, sim))

    # Sort by similarity descending
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_indices = [idx for idx, sim in similarities[:top_k]]

    results = []
    for idx, sim in similarities[:top_k]:
        results.append({
            'chunk': chunk_data[idx],
            'score': sim
        })
        
    return results
