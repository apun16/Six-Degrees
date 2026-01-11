import numpy as np
from typing import List, Dict, Set, Optional, Tuple
from collections import defaultdict, deque
import logging
from app.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

class SemanticGraph:
    # words are nodes and edges represent semantic connections
    # edges are implicit - created dynamically based on cosine similarity threshold

    def __init__(self, embedding_service: EmbeddingService, similarity_threshold: float = 0.4):
        # init semantic graph
        # embedding_service: service for generating word embeddings
        # similarity_threshold: minimum cosine similarity for words to be considered connected
        # default 0.4 provides more logical connections for all-MiniLM-L6-v2
        
        self.embedding_service = embedding_service
        self.similarity_threshold = similarity_threshold
        
        # word storage: word -> embedding vector
        self.word_embeddings: Dict[str, np.ndarray] = {}
        
        # graph structure: word -> set of connected words (neighbors)
        # built dynamically based on similarity
        self.graph: Dict[str, Set[str]] = defaultdict(set)
        
        # cache for similarity calculations
        self.similarity_cache: Dict[Tuple[str, str], float] = {}
    
    def add_word(self, word: str) -> np.ndarray:
        # add a word to the graph and generate its embedding
        # word: word to add (normalized to lowercase)
        # returns the embedding vector for the word

        word_lower = word.lower().strip()
        
        # if word already exists, return its embedding
        if word_lower in self.word_embeddings:
            return self.word_embeddings[word_lower]
        
        # generate embedding for the new word
        embedding = self.embedding_service.encode_word(word_lower)
        self.word_embeddings[word_lower] = embedding
        
        # find semantic neighbors and create edges
        self._update_connections(word_lower)
        
        logger.debug(f"Added word: {word_lower}")
        return embedding
    
    def add_words(self, words: List[str]) -> Dict[str, np.ndarray]:
        # add multiple words to the graph at once
        # optimized batch processing for better performance
        # returns a dictionary mapping words to their embeddings

        # normalize and filter out duplicates and existing words
        words_to_add = []
        for word in words:
            word_lower = word.lower().strip()
            if word_lower not in self.word_embeddings:
                words_to_add.append(word_lower)
        
        if not words_to_add:
            return {word.lower().strip(): self.word_embeddings[word.lower().strip()] for word in words}
        
        # batch generate embeddings for all new words
        embeddings_batch = self.embedding_service.encode(words_to_add)
        
        # store embeddings
        embeddings = {}
        for word, embedding in zip(words_to_add, embeddings_batch):
            self.word_embeddings[word] = embedding
            embeddings[word] = embedding
        
        # batch update connections using vectorized operations
        self._batch_update_connections(words_to_add)
        
        return embeddings
    
    def _update_connections(self, new_word: str):
        # update graph connections for a newly added word
        # creates edges to all existing words that meet the similarity threshold
        new_embedding = self.word_embeddings[new_word]
        
        # get all existing words and their embeddings
        existing_words = [w for w in self.word_embeddings.keys() if w != new_word]
        if not existing_words:
            return

        existing_embeddings = np.array([self.word_embeddings[w] for w in existing_words])
        
        # embeddings are already normalized -> cosine similarity is dot product
        similarities = np.dot(existing_embeddings, new_embedding)
        mask = similarities >= self.similarity_threshold
        
        # bidirectional edges
        for idx, word in enumerate(existing_words):
            if mask[idx]:
                self.graph[new_word].add(word)
                self.graph[word].add(new_word)
    
    def _batch_update_connections(self, new_words: List[str]):
        # batch update connections for multiple new words
        if not new_words:
            return
        
        # get all existing words (before adding new ones)
        existing_words = [w for w in self.word_embeddings.keys() if w not in new_words]
        
        if not existing_words:
            # if no existing words, just connect new words to each other
            new_embeddings = np.array([self.word_embeddings[w] for w in new_words])
            similarities = np.dot(new_embeddings, new_embeddings.T)
            
            for i, word1 in enumerate(new_words):
                for j, word2 in enumerate(new_words):
                    if i != j and similarities[i, j] >= self.similarity_threshold:
                        self.graph[word1].add(word2)
                        self.graph[word2].add(word1)
            return        
        new_embeddings = np.array([self.word_embeddings[w] for w in new_words])
        existing_embeddings = np.array([self.word_embeddings[w] for w in existing_words])
        
        # calculate all similarities at once: (new_words, existing_words)
        similarities_matrix = np.dot(new_embeddings, existing_embeddings.T)
        
        # create edges between new words and existing words
        for i, new_word in enumerate(new_words):
            mask = similarities_matrix[i] >= self.similarity_threshold
            for j, existing_word in enumerate(existing_words):
                if mask[j]:
                    self.graph[new_word].add(existing_word)
                    self.graph[existing_word].add(new_word)
        
        # connect new words to each other
        new_similarities = np.dot(new_embeddings, new_embeddings.T)
        for i, word1 in enumerate(new_words):
            for j, word2 in enumerate(new_words):
                if i < j and new_similarities[i, j] >= self.similarity_threshold:
                    self.graph[word1].add(word2)
                    self.graph[word2].add(word1)
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        # calculate cosine similarity between two embedding vectors.
        # cosine similarity score between -1 and 1 (typically 0 to 1 for normalized embeddings)
        return float(np.dot(vec1, vec2))
    
    def get_similarity(self, word1: str, word2: str) -> float:
        # get cosine similarity between two words
        word1_lower = word1.lower().strip()
        word2_lower = word2.lower().strip()
        
        cache_key = tuple(sorted([word1_lower, word2_lower]))
        if cache_key in self.similarity_cache:
            return self.similarity_cache[cache_key]
        
        # check if both words exist
        if word1_lower not in self.word_embeddings:
            self.add_word(word1_lower)
        if word2_lower not in self.word_embeddings:
            self.add_word(word2_lower)
        
        # calculate similarity
        similarity = self.cosine_similarity(
            self.word_embeddings[word1_lower],
            self.word_embeddings[word2_lower]
        )
        
        # cache the result
        self.similarity_cache[cache_key] = similarity
        return similarity
    
    def are_connected(self, word1: str, word2: str) -> bool:
        # check if two words are semantically connected
        # similarity >= threshold
        similarity = self.get_similarity(word1, word2)
        return similarity >= self.similarity_threshold
    
    def get_neighbors(self, word: str) -> Set[str]:
        # get all semantic neighbors of a word.
        word_lower = word.lower().strip()
        if word_lower not in self.word_embeddings:
            self.add_word(word_lower)
        
        return self.graph.get(word_lower, set())
    
    def word_exists(self, word: str) -> bool:
        return word.lower().strip() in self.word_embeddings
    
    def get_all_words(self) -> List[str]:
        return list(self.word_embeddings.keys())
    
    def bfs_path(self, start_word: str, target_word: str, max_steps: int = 6) -> Optional[List[str]]:
        # find the shortest path between two words using BFS.           
        start = start_word.lower().strip()
        target = target_word.lower().strip()
        
        # Ensure both words exist
        if not self.word_exists(start):
            self.add_word(start)
        if not self.word_exists(target):
            self.add_word(target)
        
        # If words are the same
        if start == target:
            return [start]
        
        # BFS to find shortest path
        queue = deque([(start, [start])])
        visited = {start}
        
        while queue:
            current_word, path = queue.popleft()
            
            # Check if we've exceeded max steps
            steps_taken = len(path) - 1
            if steps_taken > max_steps:
                continue
            
            # get neighbors
            neighbors = self.get_neighbors(current_word)
            
            for neighbor in neighbors:
                if neighbor == target:
                    # found target!
                    return path + [neighbor]
                
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        
        # no path found within max_steps
        return None