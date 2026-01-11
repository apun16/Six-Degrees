import logging
from typing import Optional, List, Tuple
from app.embedding_service import EmbeddingService
from app.semantic_graph import SemanticGraph
from app.word_database import WordDatabase

logger = logging.getLogger(__name__)

class GameService:
    # main service for game logic that integrates all components:
        # word database for valid words
        # embedding service for generating word vectors
        # semantic graph for finding paths between words

    def __init__(self, similarity_threshold: float = 0.4, word_file: Optional[str] = None):
        # init game service
        logger.info("Initializing game service...")

        # init components
        self.embedding_service = EmbeddingService()
        self.word_database = WordDatabase(word_file)
        self.semantic_graph = SemanticGraph(
            self.embedding_service,
            similarity_threshold=similarity_threshold
        )

        # pre-load common words into the graph for better performance
        self._preload_words()

        logger.info("Game service initialized successfully")

    def _preload_words(self, max_words: int = 200):
        # pre-load a subset of words into the semantic graph 
        # this creates the graph structure in advance
        all_words = self.word_database.get_all_words()
        words_to_load = all_words[:max_words]

        logger.info(f"Pre-loading {len(words_to_load)} words into semantic graph...")
        self.semantic_graph.add_words(words_to_load)
        logger.info("Pre-loading complete")

    def validate_word(self, word: str) -> bool:
        # validate a word
        return self.word_database.word_exists(word)

    def find_optimal_path(self, start_word: str, target_word: str, max_steps: int = 6) -> Optional[List[str]]:
        # find the optimal path between two words using BFS.
        if not self.validate_word(start_word):
            logger.warning(f"Start word '{start_word}' not in database")
            return None

        if not self.validate_word(target_word):
            logger.warning(f"Target word '{target_word}' not in database")
            return None

        # check words are in the graph
        if not self.semantic_graph.word_exists(start_word):
            self.semantic_graph.add_word(start_word)
        if not self.semantic_graph.word_exists(target_word):
            self.semantic_graph.add_word(target_word)

        # find path using BFS
        path = self.semantic_graph.bfs_path(start_word, target_word, max_steps)
        return path

    def validate_path(self, path: List[str]) -> Tuple[bool, Optional[str]]:
        # validate a player's path
        # path: list of words representing the player's path
        # returns a tuple of (is_valid, error_message)
        if not path or len(path) < 1:
            return False, "Path must contain at least 1 word"

        if len(path) > 7:  # 6 steps = 7 words
            return False, "Path exceeds maximum of 6 steps"

        # check for duplicates
        if len(path) != len(set(word.lower() for word in path)):
            return False, "Path contains duplicate words"

        # check if all words exist
        for word in path:
            if not self.validate_word(word):
                return False, f"Word '{word}' is not in the database"
        # check semantic connections
        for i in range(len(path) - 1):
            word1 = path[i].lower().strip()
            word2 = path[i + 1].lower().strip()

            if not self.semantic_graph.word_exists(word1):
                self.semantic_graph.add_word(word1)
            if not self.semantic_graph.word_exists(word2):
                self.semantic_graph.add_word(word2)

            # check if words are semantically connected
            if not self.semantic_graph.are_connected(word1, word2):
                similarity = self.semantic_graph.get_similarity(word1, word2)
                return False, f"Words '{word1}' and '{word2}' are not semantically connected (similarity: {similarity:.3f})"

        return True, None

    def get_word_similarity(self, word1: str, word2: str) -> float:
        # get the cosine similarity between two words
        return self.semantic_graph.get_similarity(word1, word2)

    def get_random_word_pair(self) -> Tuple[str, str]:
        # get a random pair of words that have a path between them
        import random

        # prefer words already in the graph to avoid cold start BFS problem
        words_in_graph = self.semantic_graph.get_all_words()
        all_words = self.word_database.get_all_words()

        # if we have words in the graph, use them preferentially
        candidate_words = words_in_graph if words_in_graph else all_words

        max_attempts = 100

        for _ in range(max_attempts):
            start_word = random.choice(candidate_words)
            target_word = random.choice(candidate_words)

            if start_word == target_word:
                continue
            if not self.semantic_graph.word_exists(start_word):
                self.semantic_graph.add_word(start_word)
            if not self.semantic_graph.word_exists(target_word):
                self.semantic_graph.add_word(target_word)

            # try to find a path
            path = self.semantic_graph.bfs_path(start_word, target_word, max_steps=6)
            if path:
                logger.debug(f"Found path pair: {start_word} -> {target_word} ({len(path)-1} steps)")
                return start_word, target_word

        # fallback: try with all words from database
        logger.warning("Could not find connected pair in pre-loaded words, trying all words...")
        for _ in range(20):
            start_word = random.choice(all_words)
            target_word = random.choice(all_words)

            if start_word == target_word:
                continue

            path = self.find_optimal_path(start_word, target_word, max_steps=6)
            if path:
                return start_word, target_word

        # last resort: return any two different words (may not have a path)
        logger.warning("Could not find connected word pair, returning random pair")
        return all_words[0], all_words[1] if len(all_words) > 1 else all_words[0]