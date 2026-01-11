import os
import json
from typing import List, Set, Optional
import logging

logger = logging.getLogger(__name__)

class WordDatabase:
    # manages database of valid words for the game and can 
    # load words from a file or use a default set
    
    def __init__(self, word_file: Optional[str] = None):
        # init word database
        # word_file: optional path to a JSON file containing word list

        self.words: Set[str] = set()
        self.word_file = word_file
        
        if word_file and os.path.exists(word_file):
            self.load_from_file(word_file)
        else:
            # init with a default set of common words
            self._initialize_default_words()
    
    def _initialize_default_words(self):
        # init with default set of common, semantically rich words
        default_words = [
            # Nature & Environment
            'ocean', 'wave', 'beach', 'sand', 'water', 'river', 'lake', 'mountain', 'forest', 'tree',
            'flower', 'grass', 'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind',
            
            # Animals
            'bird', 'fish', 'dog', 'cat', 'horse', 'lion', 'tiger', 'elephant', 'whale', 'shark',
            'eagle', 'owl', 'bear', 'wolf', 'rabbit', 'mouse', 'snake', 'spider', 'butterfly', 'bee',
            
            # Music & Sound
            'music', 'song', 'sound', 'voice', 'piano', 'guitar', 'violin', 'drum', 'note', 'melody',
            'rhythm', 'harmony', 'concert', 'orchestra', 'singer', 'composer', 'keyboard', 'key',
            
            # Colours
            'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray',
            'brown', 'gold', 'silver', 'color', 'paint', 'brush', 'canvas', 'art', 'picture',
            
            # Emotions
            'love', 'hate', 'joy', 'sadness', 'fear', 'anger', 'peace', 'war', 'hope', 'dream',
            'heart', 'soul', 'mind', 'spirit', 'emotion', 'feeling', 'thought', 'idea', 'concept',
            
            # Objects & Tools
            'key', 'door', 'window', 'house', 'home', 'room', 'chair', 'table', 'book', 'paper',
            'pen', 'pencil', 'computer', 'phone', 'car', 'bike', 'road', 'bridge', 'building',
            
            # Food
            'apple', 'bread', 'cake', 'chocolate', 'coffee', 'tea', 'fruit', 'vegetable', 'rice',
            'meat', 'fish', 'soup', 'salad', 'pizza', 'burger', 'sandwich', 'cheese', 'milk',
            
            # Actions & Movement
            'run', 'walk', 'jump', 'fly', 'swim', 'dance', 'sing', 'play', 'work', 'rest',
            'sleep', 'wake', 'eat', 'drink', 'read', 'write', 'speak', 'listen', 'see', 'watch',
            
            # Time & Space
            'time', 'day', 'night', 'morning', 'evening', 'week', 'month', 'year', 'season',
            'spring', 'summer', 'fall', 'winter', 'space', 'earth', 'planet', 'world', 'country',
            
            # Abstract Concepts
            'freedom', 'justice', 'truth', 'beauty', 'wisdom', 'knowledge', 'power', 'strength',
            'weakness', 'courage', 'honor', 'respect', 'trust', 'faith', 'belief', 'doubt',
            
            # Technology
            'computer', 'internet', 'network', 'data', 'information', 'code', 'program', 'software',
            'hardware', 'screen', 'keyboard', 'mouse', 'button', 'click', 'link', 'website',
            
            # Family & Relationships
            'family', 'parent', 'child', 'mother', 'father', 'brother', 'sister', 'friend', 'enemy',
            'neighbor', 'teacher', 'student', 'doctor', 'patient', 'person', 'people', 'human',
            
            # Body & Health
            'body', 'head', 'eye', 'ear', 'nose', 'mouth', 'hand', 'finger', 'foot', 'leg',
            'arm', 'heart', 'brain', 'blood', 'bone', 'muscle', 'skin', 'hair', 'tooth',
            
            # Sports & Games
            'game', 'sport', 'ball', 'team', 'player', 'coach', 'win', 'lose', 'score', 'goal',
            'race', 'competition', 'champion', 'victory', 'defeat', 'match', 'tournament',
            
            # Science & Learning
            'science', 'math', 'physics', 'chemistry', 'biology', 'history', 'language', 'word',
            'letter', 'number', 'equation', 'theory', 'experiment', 'research', 'study', 'learn',
            
            # More abstract connections
            'fire', 'flame', 'heat', 'light', 'dark', 'shadow', 'bright', 'dim', 'warm', 'cold',
            'hot', 'ice', 'freeze', 'melt', 'solid', 'liquid', 'gas', 'energy', 'force', 'motion'
        ]
        
        self.words = {word.lower().strip() for word in default_words}
        logger.info(f"Initialized with {len(self.words)} default words")
    
    def load_from_file(self, file_path: str):
        # load words from a JSON file
        # file_path: path to JSON file containing word list
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    self.words = {word.lower().strip() for word in data}
                elif isinstance(data, dict) and 'words' in data:
                    self.words = {word.lower().strip() for word in data['words']}
                else:
                    raise ValueError("Invalid JSON format")
            
            logger.info(f"Loaded {len(self.words)} words from {file_path}")
        except Exception as e:
            logger.error(f"Error loading words from file: {e}")
            self._initialize_default_words()
    
    def save_to_file(self, file_path: str):
        # save words to a JSON file
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump({'words': sorted(list(self.words))}, f, indent=2)
            logger.info(f"Saved {len(self.words)} words to {file_path}")
        except Exception as e:
            logger.error(f"Error saving words to file: {e}")
    
    def add_word(self, word: str) -> bool:
        # Add a word to the database
        # returns True if word was added, False if it already existed
        word_lower = word.lower().strip()
        if word_lower not in self.words:
            self.words.add(word_lower)
            return True
        return False
    
    def word_exists(self, word: str) -> bool:
        # check if a word exists in the database.
        # returns True if word exists, False otherwise
        return word.lower().strip() in self.words
    
    def get_all_words(self) -> List[str]:
        # get all words in the database as a sorted list
        return sorted(list(self.words))
    
    def get_random_words(self, count: int) -> List[str]:
        # get a random sample of words from the database
        # returns a list of random words
        import random
        words_list = list(self.words)
        return random.sample(words_list, min(count, len(words_list)))
    
    def get_word_count(self) -> int:
        # get the total number of words in the database
        return len(self.words)