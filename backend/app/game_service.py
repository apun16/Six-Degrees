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

    def __init__(self, similarity_threshold: float = 0.49, word_file: Optional[str] = None):
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

    def _preload_words(self, max_words: int = 400):
        # pre-load words into the semantic graph for better connectivity
        # increased to 400 for better variety while maintaining speed
        # uses random sampling to ensure diverse word selection
        import random
        all_words = self.word_database.get_all_words()
        
        # Use random sampling instead of first N words for better variety
        if len(all_words) > max_words:
            words_to_load = random.sample(all_words, max_words)
        else:
            words_to_load = all_words

        logger.info(f"Pre-loading {len(words_to_load)} diverse words into semantic graph...")
        self.semantic_graph.add_words(words_to_load)
        logger.info(f"Pre-loading complete. Graph now has {len(self.semantic_graph.get_all_words())} words")

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

        # Paths must be between 2-6 steps
        # Steps = words - 1 (start -> word1 -> word2 -> ... -> end)
        # 2 steps = 3 words (start -> w1 -> end)
        # 6 steps = 7 words (start -> w1 -> w2 -> w3 -> w4 -> w5 -> w6 -> end)
        steps = len(path) - 1
        
        if steps < 2:
            return False, "Path must have at least 2 steps (3 words)"
        
        if steps > 6:
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
    
    def calculate_score(self, player_path: List[str], start_word: str, target_word: str) -> Tuple[int, str, Optional[List[str]]]:
        # calculate score based on player path vs algorithm's optimal path
        # returns: (score, message, algorithm_path)
        
        # Always find optimal path first (even if player path is invalid)
        algorithm_path = self.find_optimal_path(start_word, target_word, max_steps=6)
        
        # validate player path
        is_valid, error_msg = self.validate_path(player_path)
        if not is_valid:
            # Return optimal path even when player path is invalid
            return 0, error_msg, algorithm_path
        
        # check that path starts and ends correctly
        if player_path[0].lower().strip() != start_word.lower().strip():
            return 0, f"Path must start with '{start_word}'", algorithm_path
        
        if player_path[-1].lower().strip() != target_word.lower().strip():
            return 0, f"Path must end with '{target_word}'", algorithm_path
        
        # get algorithm's optimal path
        algorithm_path = self.find_optimal_path(start_word, target_word, max_steps=6)
        
        if algorithm_path is None:
            # algorithm couldn't find a path, but player did - give bonus points
            player_steps = len(player_path) - 1
            return 120, "Beat the algorithm! (No algorithm path found)", algorithm_path
        
        # calculate steps (path length - 1)
        player_steps = len(player_path) - 1
        algorithm_steps = len(algorithm_path) - 1
        
        # calculate score based on difference
        step_difference = player_steps - algorithm_steps
        
        if step_difference < 0:
            # player beat the algorithm!
            score = 120
            message = f"🤖 Beat the algorithm! ({player_steps} steps vs {algorithm_steps} steps)"
        elif step_difference == 0:
            # perfect path - same as algorithm
            score = 100
            message = f"🎯 Perfect path! ({player_steps} steps)"
        elif step_difference == 1:
            # +1 extra step
            score = 90
            message = f"+1 extra step ({player_steps} steps vs {algorithm_steps} steps)"
        elif step_difference == 2:
            # +2 extra steps
            score = 80
            message = f"+2 extra steps ({player_steps} steps vs {algorithm_steps} steps)"
        elif step_difference == 3:
            # +3 extra steps
            score = 60
            message = f"+3 extra steps ({player_steps} steps vs {algorithm_steps} steps)"
        else:
            # completed but longer path
            score = 50
            message = f"Completed ({player_steps} steps vs {algorithm_steps} steps)"
        
        return score, message, algorithm_path

    def get_random_word_pair(self) -> Tuple[str, str]:
        # get a random pair of words that have a path between them (2-6 steps)
        # optimized for speed: prefer pre-loaded words, but allow fallback
        import random

        # prefer words already in the graph (pre-loaded) for speed
        words_in_graph = self.semantic_graph.get_all_words()
        all_words = self.word_database.get_all_words()
        
        if not words_in_graph:
            # fallback if graph is empty
            words_in_graph = all_words[:100]

        # Try with pre-loaded words first (fast)
        max_attempts = 40
        for _ in range(max_attempts):
            start_word = random.choice(words_in_graph)
            target_word = random.choice(words_in_graph)

            if start_word == target_word:
                continue

            # both words are already in graph, so BFS should be fast
            path = self.semantic_graph.bfs_path(start_word, target_word, max_steps=6)
            if path:
                steps = len(path) - 1
                # Only accept paths with 2-6 steps
                if 2 <= steps <= 6:
                    logger.debug(f"Found path pair: {start_word} -> {target_word} ({steps} steps)")
                    return start_word, target_word

        # fallback: try with all words (slower but more variety)
        # only do this if pre-loaded words didn't work
        logger.debug("Trying fallback with all words for more variety...")
        for _ in range(20):
            start_word = random.choice(all_words)
            target_word = random.choice(all_words)

            if start_word == target_word:
                continue
            
            # ensure words are in graph (will add if not)
            if not self.semantic_graph.word_exists(start_word):
                self.semantic_graph.add_word(start_word)
            if not self.semantic_graph.word_exists(target_word):
                self.semantic_graph.add_word(target_word)

            path = self.semantic_graph.bfs_path(start_word, target_word, max_steps=6)
            if path:
                steps = len(path) - 1
                if 2 <= steps <= 6:
                    return start_word, target_word

        # last resort: return a known good pair
        common_pairs = [
            ('cat', 'dog'), ('cat', 'animal'), ('dog', 'pet'),
            ('bird', 'animal'), ('tree', 'plant'), ('flower', 'plant'),
            ('car', 'vehicle'), ('house', 'building'), ('book', 'read'),
            ('happy', 'joy'), ('sad', 'emotion'), ('red', 'color')
        ]
        
        for start, target in common_pairs:
            if self.validate_word(start) and self.validate_word(target):
                # Ensure in graph
                if not self.semantic_graph.word_exists(start):
                    self.semantic_graph.add_word(start)
                if not self.semantic_graph.word_exists(target):
                    self.semantic_graph.add_word(target)
                    
                path = self.semantic_graph.bfs_path(start, target, max_steps=6)
                if path:
                    steps = len(path) - 1
                    if 2 <= steps <= 6:
                        return start, target
        
        # final fallback
        logger.warning("Could not find connected word pair, returning random pair")
        return all_words[0], all_words[1] if len(all_words) > 1 else all_words[0]