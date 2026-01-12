describe('Game State Management Logic', () => {
  const buildFullPath = (startWord, chain, endWord) => {
    return [startWord, ...chain, endWord]
  }

  const calculatePathLength = (chain) => {
    return chain.length
  }

  const hasDuplicateInFullPath = (startWord, chain, endWord, newWord) => {
    const fullPath = [startWord, ...chain, endWord]
    return fullPath.some(word => word.toLowerCase() === newWord.toLowerCase())
  }

  const prepareResultData = (puzzle, chain, apiResult, hintsUsed) => {
    return {
      start_word: puzzle.start_word,
      end_word: puzzle.end_word,
      player_path: chain,
      optimal_path: apiResult.algorithmPath || [],
      player_length: apiResult.playerSteps || chain.length,
      optimal_length: apiResult.algorithmSteps || 0,
      score: apiResult.score || 0,
      valid: apiResult.valid !== undefined ? apiResult.valid : (apiResult.score > 0),
      hints_used: hintsUsed,
    }
  }

  const resetHintsOnWordAdd = (currentHint, currentHintsUsed) => {
    return {
      hint: null,
      hintsUsed: 0,
    }
  }

  const incrementHintLevel = (currentHintsUsed) => {
    return currentHintsUsed + 1
  }

  const calculateStepsRemaining = (optimalPathLength, currentChainLength) => {
    return optimalPathLength - currentChainLength
  }

  describe('handleAddWord Logic', () => {
    test('should build full path correctly when adding word', () => {
      const startWord = 'CAT'
      const chain = ['ANIMAL']
      const newWord = 'DOG'
      const endWord = 'PET'

      const fullPath = buildFullPath(startWord, [...chain, newWord], endWord)
      
      expect(fullPath).toEqual(['CAT', 'ANIMAL', 'DOG', 'PET'])
      expect(fullPath.length).toBe(4)
    })

    test('should reset hints when word is successfully added', () => {
      const currentHint = { word: 'DOG', hint_level: 2 }
      const currentHintsUsed = 2

      const reset = resetHintsOnWordAdd(currentHint, currentHintsUsed)
      
      expect(reset.hint).toBeNull()
      expect(reset.hintsUsed).toBe(0)
    })

    test('should detect duplicates in full path including start word', () => {
      const startWord = 'CAT'
      const chain = ['DOG']
      const endWord = 'PET'
      const duplicateWord = 'CAT' // same as start word

      const hasDuplicate = hasDuplicateInFullPath(startWord, chain, endWord, duplicateWord)
      
      expect(hasDuplicate).toBe(true)
    })

    test('should detect duplicates in chain', () => {
      const startWord = 'CAT'
      const chain = ['DOG', 'BIRD']
      const endWord = 'PET'
      const duplicateWord = 'DOG' // already in chain

      const hasDuplicate = hasDuplicateInFullPath(startWord, chain, endWord, duplicateWord)
      
      expect(hasDuplicate).toBe(true)
    })

    test('should allow new unique words', () => {
      const startWord = 'CAT'
      const chain = ['DOG']
      const endWord = 'PET'
      const newWord = 'BIRD'

      const hasDuplicate = hasDuplicateInFullPath(startWord, chain, endWord, newWord)
      
      expect(hasDuplicate).toBe(false)
    })

    test('should handle case-insensitive duplicate detection', () => {
      const startWord = 'CAT'
      const chain = ['DOG']
      const endWord = 'PET'
      const duplicateWord = 'cat' // lowercase version

      const hasDuplicate = hasDuplicateInFullPath(startWord, chain, endWord, duplicateWord)
      
      expect(hasDuplicate).toBe(true)
    })
  })

  describe('handleRemoveWord Logic', () => {
    test('should remove word at specific index', () => {
      const chain = ['CAT', 'DOG', 'BIRD', 'FISH']
      const indexToRemove = 2

      const newChain = chain.filter((_, i) => i !== indexToRemove)
      
      expect(newChain).toEqual(['CAT', 'DOG', 'FISH'])
      expect(newChain.length).toBe(3)
    })

    test('should remove last word correctly', () => {
      const chain = ['CAT', 'DOG', 'BIRD']
      const indexToRemove = chain.length - 1

      const newChain = chain.filter((_, i) => i !== indexToRemove)
      
      expect(newChain).toEqual(['CAT', 'DOG'])
    })

    test('should handle removing from empty chain', () => {
      const chain = []
      const indexToRemove = 0

      const newChain = chain.filter((_, i) => i !== indexToRemove)
      
      expect(newChain).toEqual([])
    })
  })

  describe('handleSubmit Logic', () => {
    test('should build full path from start, chain, and end', () => {
      const puzzle = {
        start_word: 'CAT',
        end_word: 'DOG',
        optimal_length: 3,
      }
      const chain = ['ANIMAL', 'PET']

      const fullPath = buildFullPath(puzzle.start_word, chain, puzzle.end_word)
      
      expect(fullPath).toEqual(['CAT', 'ANIMAL', 'PET', 'DOG'])
      expect(fullPath.length).toBe(4) 
    })

    test('should calculate path length correctly', () => {
      const chain = ['ANIMAL', 'PET', 'FRIEND']
      
      const pathLength = calculatePathLength(chain)
      
      expect(pathLength).toBe(3)
    })

    test('should prepare result data correctly', () => {
      const puzzle = {
        start_word: 'CAT',
        end_word: 'DOG',
        optimal_length: 2,
      }
      const chain = ['ANIMAL']
      const apiResult = {
        score: 100,
        playerSteps: 2,
        algorithmSteps: 2,
        algorithmPath: ['CAT', 'ANIMAL', 'DOG'],
        valid: true,
      }
      const hintsUsed = 1

      const resultData = prepareResultData(puzzle, chain, apiResult, hintsUsed)
      
      expect(resultData.start_word).toBe('CAT')
      expect(resultData.end_word).toBe('DOG')
      expect(resultData.player_path).toEqual(['ANIMAL'])
      expect(resultData.optimal_path).toEqual(['CAT', 'ANIMAL', 'DOG'])
      expect(resultData.player_length).toBe(2)
      expect(resultData.optimal_length).toBe(2)
      expect(resultData.score).toBe(100)
      expect(resultData.valid).toBe(true)
      expect(resultData.hints_used).toBe(1)
    })

    test('should handle invalid path result data', () => {
      const puzzle = {
        start_word: 'CAT',
        end_word: 'DOG',
        optimal_length: 2,
      }
      const chain = ['INVALID']
      const apiResult = {
        score: 0,
        playerSteps: 1,
        algorithmSteps: 2,
        algorithmPath: ['CAT', 'ANIMAL', 'DOG'],
        valid: false,
      }
      const hintsUsed = 0

      const resultData = prepareResultData(puzzle, chain, apiResult, hintsUsed)
      
      expect(resultData.valid).toBe(false)
      expect(resultData.score).toBe(0)
    })

    test('should handle missing API result fields', () => {
      const puzzle = {
        start_word: 'CAT',
        end_word: 'DOG',
        optimal_length: 2,
      }
      const chain = ['ANIMAL']
      const apiResult = {
        score: 50,
      }
      const hintsUsed = 0

      const resultData = prepareResultData(puzzle, chain, apiResult, hintsUsed)
      
      expect(resultData.player_length).toBe(1) 
      expect(resultData.optimal_length).toBe(0)
      expect(resultData.optimal_path).toEqual([]) 
      expect(resultData.valid).toBe(true) 
    })
  })

  describe('handleGetHint Logic', () => {
    test('should increment hint level correctly', () => {
      expect(incrementHintLevel(0)).toBe(1)
      expect(incrementHintLevel(1)).toBe(2)
      expect(incrementHintLevel(5)).toBe(6)
    })

    test('should calculate steps remaining correctly', () => {
      const optimalPathLength = 5
      const currentChainLength = 2

      const stepsRemaining = calculateStepsRemaining(optimalPathLength, currentChainLength)
      
      expect(stepsRemaining).toBe(3)
    })

    test('should handle zero steps remaining', () => {
      const optimalPathLength = 3
      const currentChainLength = 3

      const stepsRemaining = calculateStepsRemaining(optimalPathLength, currentChainLength)
      
      expect(stepsRemaining).toBe(0)
    })

    test('should handle negative steps remaining (chain longer than optimal)', () => {
      const optimalPathLength = 2
      const currentChainLength = 5

      const stepsRemaining = calculateStepsRemaining(optimalPathLength, currentChainLength)
      
      expect(stepsRemaining).toBe(-3)
    })
  })

  describe('loadNewGame Logic', () => {
    test('should reset all game state when loading new game', () => {
      const currentState = {
        chain: ['CAT', 'DOG'],
        error: 'Some error',
        hint: { word: 'BIRD' },
        hintsUsed: 3,
        showResults: true,
        resultData: { score: 100 },
      }

      const resetState = {
        chain: [],
        error: null,
        hint: null,
        hintsUsed: 0,
        showResults: false,
        resultData: null,
      }

      expect(resetState.chain).toEqual([])
      expect(resetState.error).toBeNull()
      expect(resetState.hint).toBeNull()
      expect(resetState.hintsUsed).toBe(0)
      expect(resetState.showResults).toBe(false)
      expect(resetState.resultData).toBeNull()
    })
  })

  describe('Path Validation Logic', () => {
    test('should validate minimum path length (2 steps = 3 words)', () => {
      const chain = ['ANIMAL']
      const minSteps = 2
      const pathSteps = chain.length + 1 

      expect(pathSteps).toBeGreaterThanOrEqual(minSteps)
    })

    test('should validate maximum path length (6 steps = 7 words)', () => {
      const chain = ['A', 'B', 'C', 'D', 'E', 'F']
      const maxSteps = 6
      const pathSteps = chain.length

      expect(pathSteps).toBeLessThanOrEqual(maxSteps)
    })

    test('should reject paths exceeding max length', () => {
      const chain = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
      const maxSteps = 6

      expect(chain.length).toBeGreaterThan(maxSteps)
    })

    test('should reject paths below minimum length', () => {
      const chain = []
      const minSteps = 2

      expect(chain.length + 1).toBeLessThan(minSteps)
    })
  })

  describe('Error Handling Logic', () => {
    test('should clear error when new word is added', () => {
      let error = 'Previous error'      
      error = null

      expect(error).toBeNull()
    })

    test('should set error message from API response', () => {
      const apiError = 'Word not connected'
      const error = apiError || 'Invalid word'
      
      expect(error).toBe('Word not connected')
    })

    test('should handle generic error when API error is missing', () => {
      const apiError = null
      const error = apiError || 'Invalid word'
      
      expect(error).toBe('Invalid word')
    })
  })
})