# API routes for the game
from flask import Blueprint, jsonify, request
from app.game_service import GameService
import logging

logger = logging.getLogger(__name__)

game_bp = Blueprint('game', __name__)

# Initialize game service (singleton pattern)
_game_service = None

def get_game_service():
    # lazy initialization of game service
    global _game_service
    if _game_service is None:
        _game_service = GameService()
    return _game_service


@game_bp.route('/health', methods=['GET'])
def health_check():
    # game health check
    return jsonify({'status': 'ok'}), 200

@game_bp.route('/game/new', methods=['GET'])
def new_game():
    # get a new game with random word pair
    try:
        game_service = get_game_service()
        start_word, target_word = game_service.get_random_word_pair()
        
        return jsonify({
            'success': True,
            'startWord': start_word,
            'targetWord': target_word
        }), 200
    except Exception as e:
        logger.error(f"Error creating new game: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/game/path', methods=['POST'])
def get_optimal_path():
    # get the algorithm's optimal path between two words
    try:
        data = request.get_json()
        start_word = data.get('startWord')
        target_word = data.get('targetWord')
        max_steps = data.get('maxSteps', 6)
        
        if not start_word or not target_word:
            return jsonify({
                'success': False,
                'error': 'startWord and targetWord are required'
            }), 400
        
        game_service = get_game_service()
        path = game_service.find_optimal_path(start_word, target_word, max_steps)
        
        if path is None:
            return jsonify({
                'success': False,
                'error': 'No path found within max steps',
                'path': None,
                'steps': None
            }), 404
        
        return jsonify({
            'success': True,
            'path': path,
            'steps': len(path) - 1
        }), 200
    except Exception as e:
        logger.error(f"Error finding path: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/game/validate', methods=['POST'])
def validate_word_in_chain():
    # validate a word in the chain (check if it can be added to current path)
    try:
        data = request.get_json()
        word = data.get('word')
        current_path = data.get('currentPath', [])
        start_word = data.get('startWord')
        
        if not word:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'Word is required'
            }), 400
        
        game_service = get_game_service()
        
        # validate word exists
        if not game_service.validate_word(word):
            return jsonify({
                'success': True,
                'valid': False,
                'error': f"Word '{word}' is not in the database"
            }), 200
        
        # if no current path, word is valid (it's the first word)
        if not current_path or len(current_path) == 0:
            return jsonify({
                'success': True,
                'valid': True,
                'message': 'Word is valid'
            }), 200
        
        # check if word is duplicate
        if word.lower().strip() in [w.lower().strip() for w in current_path]:
            return jsonify({
                'success': True,
                'valid': False,
                'error': 'Word already used in path'
            }), 200
        
        # check semantic connection with last word in path
        last_word = current_path[-1].lower().strip()
        word_lower = word.lower().strip()
        
        # ensure words are in graph
        if not game_service.semantic_graph.word_exists(last_word):
            game_service.semantic_graph.add_word(last_word)
        if not game_service.semantic_graph.word_exists(word_lower):
            game_service.semantic_graph.add_word(word_lower)
        
        # check if semantically connected
        is_connected = game_service.semantic_graph.are_connected(last_word, word_lower)
        
        if is_connected:
            similarity = game_service.semantic_graph.get_similarity(last_word, word_lower)
            return jsonify({
                'success': True,
                'valid': True,
                'message': 'Word is valid and connected',
                'similarity': similarity
            }), 200
        else:
            similarity = game_service.semantic_graph.get_similarity(last_word, word_lower)
            return jsonify({
                'success': True,
                'valid': False,
                'error': f"Word '{word}' is not semantically connected to '{current_path[-1]}'",
                'similarity': similarity
            }), 200
    except Exception as e:
        logger.error(f"Error validating word: {e}")
        return jsonify({
            'success': False,
            'valid': False,
            'error': str(e)
        }), 500


@game_bp.route('/game/score', methods=['POST'])
def calculate_score():
    # calculate score for a player's path
    try:
        data = request.get_json()
        path = data.get('path', [])
        start_word = data.get('startWord')
        target_word = data.get('targetWord')
        
        if not path or not isinstance(path, list):
            return jsonify({
                'success': False,
                'error': 'Path must be a non-empty array'
            }), 400
        
        if not start_word or not target_word:
            return jsonify({
                'success': False,
                'error': 'startWord and targetWord are required'
            }), 400
        
        game_service = get_game_service()
        score, message, algorithm_path = game_service.calculate_score(path, start_word, target_word)
        
        if score == 0 and algorithm_path is None:
            # validation error
            return jsonify({
                'success': True,
                'score': 0,
                'message': message,
                'valid': False,
                'algorithmPath': None,
                'playerSteps': len(path) - 1,
                'algorithmSteps': None
            }), 200
        
        algorithm_steps = len(algorithm_path) - 1 if algorithm_path else None
        
        return jsonify({
            'success': True,
            'score': score,
            'message': message,
            'valid': True,
            'algorithmPath': algorithm_path,
            'playerSteps': len(path) - 1,
            'algorithmSteps': algorithm_steps
        }), 200
    except Exception as e:
        logger.error(f"Error calculating score: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/game/submit', methods=['POST'])
def submit_chain():
    # submit completed chain (alias for /game/score)
    # same functionality as calculate_score
    return calculate_score()


@game_bp.route('/word/validate', methods=['POST'])
def validate_word():
    # validate if a word exists in the database
    try:
        data = request.get_json()
        word = data.get('word')
        
        if not word:
            return jsonify({
                'success': False,
                'error': 'Word is required'
            }), 400
        
        game_service = get_game_service()
        exists = game_service.validate_word(word)
        
        return jsonify({
            'success': True,
            'word': word,
            'exists': exists
        }), 200
    except Exception as e:
        logger.error(f"Error validating word: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/word/similarity', methods=['POST'])
def get_similarity():
    # get similarity between two words
    try:
        data = request.get_json()
        word1 = data.get('word1')
        word2 = data.get('word2')
        
        if not word1 or not word2:
            return jsonify({
                'success': False,
                'error': 'word1 and word2 are required'
            }), 400
        
        game_service = get_game_service()
        similarity = game_service.get_word_similarity(word1, word2)
        
        return jsonify({
            'success': True,
            'word1': word1,
            'word2': word2,
            'similarity': similarity,
            'connected': similarity >= game_service.semantic_graph.similarity_threshold
        }), 200
    except Exception as e:
        logger.error(f"Error getting similarity: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/game/hint', methods=['GET'])
def get_hint():
    # get hint for current puzzle
    try:
        start_word = request.args.get('startWord')
        target_word = request.args.get('targetWord')
        current_path = request.args.get('currentPath', '')
        
        if not start_word or not target_word:
            return jsonify({
                'success': False,
                'error': 'startWord and targetWord are required as query parameters'
            }), 400
        
        game_service = get_game_service()
        
        # get optimal path
        optimal_path = game_service.find_optimal_path(start_word, target_word, max_steps=6)
        
        if optimal_path is None:
            return jsonify({
                'success': False,
                'error': 'No path found for this puzzle',
                'hint': None
            }), 404
        
        # parse current path if provided
        current_words = []
        if current_path:
            current_words = [w.strip() for w in current_path.split(',') if w.strip()]
        
        # determine hint based on current progress
        if not current_words or len(current_words) == 0:
            # no progress yet - hint: next word from optimal path
            hint_word = optimal_path[1] if len(optimal_path) > 1 else None
            hint_type = 'next_word'
            message = f"Try connecting '{start_word}' to a word related to '{hint_word}'"
        elif current_words[-1].lower() == target_word.lower():
            # already at target
            hint_word = None
            hint_type = 'complete'
            message = "You've reached the target word!"
        else:
            # find where we are in optimal path
            last_word = current_words[-1].lower()
            hint_word = None
            hint_type = 'next_word'
            
            # find next word in optimal path
            for i, word in enumerate(optimal_path):
                if word.lower() == last_word and i < len(optimal_path) - 1:
                    hint_word = optimal_path[i + 1]
                    message = f"Try connecting '{last_word}' to '{hint_word}'"
                    break
            
            # if not found in optimal path, suggest a semantic neighbor
            if not hint_word:
                neighbors = list(game_service.semantic_graph.get_neighbors(last_word))
                if neighbors:
                    # find neighbor closest to target
                    best_neighbor = None
                    best_similarity = -1
                    for neighbor in neighbors[:10]:  # check first 10 neighbors
                        sim = game_service.get_word_similarity(neighbor, target_word)
                        if sim > best_similarity:
                            best_similarity = sim
                            best_neighbor = neighbor
                    hint_word = best_neighbor
                    message = f"Try a word related to '{last_word}' that's closer to '{target_word}'"
                else:
                    hint_word = optimal_path[1] if len(optimal_path) > 1 else None
                    message = f"Continue towards '{target_word}'"
        
        return jsonify({
            'success': True,
            'hint': {
                'word': hint_word,
                'type': hint_type,
                'message': message,
                'optimalPathLength': len(optimal_path) - 1
            }
        }), 200
    except Exception as e:
        logger.error(f"Error getting hint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@game_bp.route('/stats', methods=['GET'])
def get_stats():
    # get game statistics
    try:
        game_service = get_game_service()
        
        # get basic stats
        total_words = game_service.word_database.get_word_count()
        words_in_graph = len(game_service.semantic_graph.get_all_words())
        
        return jsonify({
            'success': True,
            'stats': {
                'totalWords': total_words,
                'wordsInGraph': words_in_graph,
                'similarityThreshold': game_service.semantic_graph.similarity_threshold,
                'embeddingModel': game_service.embedding_service.model_name,
                'embeddingDimension': game_service.embedding_service.get_embedding_dim()
            }
        }), 200
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
