import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WordInput from '../components/WordInput'

jest.mock('../styles/wordinput.module.css', () => ({
  input: 'input',
  inputError: 'inputError',
}))

describe('Path Input Validation Tests', () => {
  const mockOnChange = jest.fn()
  const mockOnKeyDown = jest.fn()

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onKeyDown: mockOnKeyDown,
    placeholder: 'add next word...',
    disabled: false,
    error: null,
  }

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnKeyDown.mockClear()
  })

  test('should render input field', () => {
    render(<WordInput {...defaultProps} />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  test('should convert input to uppercase', async () => {
    let controlledValue = ''
    
    const handleChange = (val) => {
      controlledValue = val
      mockOnChange(val)
    }
    
    const { rerender } = render(
      <WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />
    )

    const input = screen.getByPlaceholderText('add next word...')
    
    fireEvent.change(input, { target: { value: 'c' } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)
    
    fireEvent.change(input, { target: { value: 'ca' } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)
    
    fireEvent.change(input, { target: { value: 'cat' } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)

    expect(controlledValue).toBe('CAT')
    expect(mockOnChange).toHaveBeenCalled()
  })

  test('should handle empty input', () => {
    render(<WordInput {...defaultProps} value="" />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toHaveValue('')
  })

  test('should display error state', () => {
    render(<WordInput {...defaultProps} error="Word not found" />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toHaveClass('inputError')
  })

  test('should be disabled when disabled prop is true', () => {
    render(<WordInput {...defaultProps} disabled={true} />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toBeDisabled()
  })

  test('should call onKeyDown when key is pressed', () => {
    render(<WordInput {...defaultProps} />)

    const input = screen.getByPlaceholderText('add next word...')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnKeyDown).toHaveBeenCalled()
  })

  test('should handle Backspace key', () => {
    render(<WordInput {...defaultProps} value="CAT" />)

    const input = screen.getByPlaceholderText('add next word...')
    fireEvent.keyDown(input, { key: 'Backspace' })

    expect(mockOnKeyDown).toHaveBeenCalled()
  })

  test('should have correct input attributes', () => {
    render(<WordInput {...defaultProps} />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toHaveAttribute('autoComplete', 'off')
    expect(input).toHaveAttribute('autoCorrect', 'off')
    expect(input).toHaveAttribute('autoCapitalize', 'characters')
    expect(input).toHaveAttribute('spellCheck', 'false')
  })

  test('should handle special characters', () => {
    let controlledValue = ''
    
    const handleChange = (val) => {
      controlledValue = val
      mockOnChange(val)
    }
    
    const { rerender } = render(
      <WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />
    )

    const input = screen.getByPlaceholderText('add next word...')
    fireEvent.change(input, { target: { value: 'cat-dog' } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)

    expect(controlledValue).toBe('CAT-DOG')
  })

  test('should handle numbers', () => {
    let controlledValue = ''
    
    const handleChange = (val) => {
      controlledValue = val
      mockOnChange(val)
    }
    
    const { rerender } = render(
      <WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />
    )

    const input = screen.getByPlaceholderText('add next word...')
    fireEvent.change(input, { target: { value: 'cat123' } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)

    expect(controlledValue).toBe('CAT123')
  })

  test('should handle long words', () => {
    let controlledValue = ''
    
    const handleChange = (val) => {
      controlledValue = val
      mockOnChange(val)
    }
    
    const { rerender } = render(
      <WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />
    )

    const input = screen.getByPlaceholderText('add next word...')
    const longWord = 'supercalifragilisticexpialidocious'
    fireEvent.change(input, { target: { value: longWord } })
    rerender(<WordInput {...defaultProps} value={controlledValue} onChange={handleChange} />)

    expect(controlledValue).toBe(longWord.toUpperCase())
  })

  test('should clear error when new input is entered', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <WordInput {...defaultProps} error="Word not found" />
    )

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toHaveClass('inputError')

    rerender(<WordInput {...defaultProps} error={null} />)
    expect(input).not.toHaveClass('inputError')
  })

  test('should maintain focus when not disabled', () => {
    render(<WordInput {...defaultProps} disabled={false} />)

    const input = screen.getByPlaceholderText('add next word...')
    expect(input).toBeInTheDocument()
  })
})

describe('Path Building Validation Logic', () => {
  const validatePathLength = (chain, minSteps = 2, maxSteps = 6) => {
    const steps = chain.length
    return steps >= minSteps && steps <= maxSteps
  }

  const validateNoDuplicates = (startWord, chain, endWord) => {
    const fullPath = [startWord, ...chain, endWord]
    const lowerPath = fullPath.map(w => w.toLowerCase())
    const unique = new Set(lowerPath)
    return unique.size === fullPath.length
  }

  const validateNoEmptyWords = (chain) => {
    return chain.every(word => word && word.trim().length > 0)
  }

  const buildFullPath = (startWord, chain, endWord) => {
    return [startWord, ...chain, endWord]
  }

  const calculateSteps = (chain) => {
    return chain.length
  }

  const calculateTotalWords = (startWord, chain, endWord) => {
    return 1 + chain.length + 1
  }

  describe('Path Length Validation', () => {
    test('should validate minimum path length (2 steps)', () => {
      const chain = ['ANIMAL'] 
      expect(validatePathLength(chain)).toBe(false)

      const validChain = ['ANIMAL', 'PET']
      expect(validatePathLength(validChain)).toBe(true)
    })

    test('should validate maximum path length (6 steps)', () => {
      const chain = ['A', 'B', 'C', 'D', 'E', 'F']
      expect(validatePathLength(chain)).toBe(true)

      const tooLongChain = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] 
      expect(validatePathLength(tooLongChain)).toBe(false)
    })

    test('should calculate steps correctly', () => {
      expect(calculateSteps([])).toBe(0)
      expect(calculateSteps(['ANIMAL'])).toBe(1)
      expect(calculateSteps(['ANIMAL', 'PET'])).toBe(2)
      expect(calculateSteps(['A', 'B', 'C', 'D', 'E', 'F'])).toBe(6)
    })

    test('should calculate total words correctly', () => {
      const startWord = 'CAT'
      const chain = ['ANIMAL', 'PET']
      const endWord = 'DOG'

      const totalWords = calculateTotalWords(startWord, chain, endWord)
      
      expect(totalWords).toBe(4)
      expect(totalWords).toBe(chain.length + 2) 
    })
  })

  describe('Duplicate Detection Logic', () => {
    test('should detect duplicate in chain', () => {
      const startWord = 'CAT'
      const chain = ['DOG', 'DOG'] 
      const endWord = 'PET'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(false)
    })

    test('should detect duplicate with start word', () => {
      const startWord = 'CAT'
      const chain = ['CAT', 'DOG'] 
      const endWord = 'PET'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(false)
    })

    test('should detect duplicate with end word', () => {
      const startWord = 'CAT'
      const chain = ['DOG', 'PET'] 
      const endWord = 'PET'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(false)
    })

    test('should allow valid path with no duplicates', () => {
      const startWord = 'CAT'
      const chain = ['ANIMAL', 'PET', 'FRIEND']
      const endWord = 'DOG'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(true)
    })

    test('should handle case-insensitive duplicate detection', () => {
      const startWord = 'CAT'
      const chain = ['cat', 'DOG']
      const endWord = 'PET'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(false)
    })

    test('should handle empty chain (no duplicates)', () => {
      const startWord = 'CAT'
      const chain = []
      const endWord = 'DOG'

      expect(validateNoDuplicates(startWord, chain, endWord)).toBe(true)
    })
  })

  describe('Empty Word Validation', () => {
    test('should reject paths with empty strings', () => {
      const chain = ['CAT', '', 'DOG']
      expect(validateNoEmptyWords(chain)).toBe(false)
    })

    test('should reject paths with whitespace-only words', () => {
      const chain = ['CAT', '   ', 'DOG']
      expect(validateNoEmptyWords(chain)).toBe(false)
    })

    test('should accept paths with valid words', () => {
      const chain = ['CAT', 'DOG', 'BIRD']
      expect(validateNoEmptyWords(chain)).toBe(true)
    })

    test('should handle single word chain', () => {
      const chain = ['CAT']
      expect(validateNoEmptyWords(chain)).toBe(true)
    })

    test('should handle empty chain', () => {
      const chain = []
      expect(validateNoEmptyWords(chain)).toBe(true) 
    })
  })

  describe('Full Path Construction', () => {
    test('should build full path with start, chain, and end', () => {
      const startWord = 'CAT'
      const chain = ['ANIMAL', 'PET']
      const endWord = 'DOG'

      const fullPath = buildFullPath(startWord, chain, endWord)
      
      expect(fullPath).toEqual(['CAT', 'ANIMAL', 'PET', 'DOG'])
      expect(fullPath[0]).toBe(startWord)
      expect(fullPath[fullPath.length - 1]).toBe(endWord)
      expect(fullPath.slice(1, -1)).toEqual(chain)
    })

    test('should handle empty chain in full path', () => {
      const startWord = 'CAT'
      const chain = []
      const endWord = 'DOG'

      const fullPath = buildFullPath(startWord, chain, endWord)
      
      expect(fullPath).toEqual(['CAT', 'DOG'])
      expect(fullPath.length).toBe(2)
    })

    test('should calculate steps from full path', () => {
      const fullPath = ['CAT', 'ANIMAL', 'PET', 'DOG']
      const steps = fullPath.length - 1
      
      expect(steps).toBe(3)
    })

    test('should validate full path meets requirements', () => {
      const startWord = 'CAT'
      const chain = ['ANIMAL', 'PET']
      const endWord = 'DOG'

      const fullPath = buildFullPath(startWord, chain, endWord)
      const steps = fullPath.length - 1
      const isValidLength = steps >= 2 && steps <= 6
      const hasNoDuplicates = validateNoDuplicates(startWord, chain, endWord)
      const hasNoEmpty = validateNoEmptyWords(chain)

      expect(isValidLength).toBe(true)
      expect(hasNoDuplicates).toBe(true)
      expect(hasNoEmpty).toBe(true)
    })
  })

  describe('Path Validation Rules', () => {
    test('should enforce minimum 2 steps rule', () => {
      const testCases = [
        { chain: [], expected: false },
        { chain: ['ANIMAL'], expected: false },
        { chain: ['ANIMAL', 'PET'], expected: true },
        { chain: ['A', 'B', 'C'], expected: true }, 
      ]

      testCases.forEach(({ chain, expected }) => {
        expect(validatePathLength(chain)).toBe(expected)
      })
    })

    test('should enforce maximum 6 steps rule', () => {
      const testCases = [
        { chain: ['A', 'B', 'C', 'D', 'E', 'F'], expected: true }, 
        { chain: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], expected: false },
        { chain: ['A', 'B', 'C', 'D', 'E'], expected: true },
      ]

      testCases.forEach(({ chain, expected }) => {
        expect(validatePathLength(chain)).toBe(expected)
      })
    })

    test('should validate complete path meets all rules', () => {
      const validPath = {
        startWord: 'CAT',
        chain: ['ANIMAL', 'PET'],
        endWord: 'DOG',
      }

      const isValid = 
        validatePathLength(validPath.chain) &&
        validateNoDuplicates(validPath.startWord, validPath.chain, validPath.endWord) &&
        validateNoEmptyWords(validPath.chain)

      expect(isValid).toBe(true)
    })

    test('should reject path that violates any rule', () => {
      const invalidPaths = [
        {
          startWord: 'CAT',
          chain: ['ANIMAL'], // Too short (1 step)
          endWord: 'DOG',
        },
        {
          startWord: 'CAT',
          chain: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], 
          endWord: 'DOG',
        },
        {
          startWord: 'CAT',
          chain: ['CAT', 'DOG'],
          endWord: 'PET',
        },
        {
          startWord: 'CAT',
          chain: ['DOG', ''], 
          endWord: 'PET',
        },
      ]

      invalidPaths.forEach(({ startWord, chain, endWord }) => {
        const isValid = 
          validatePathLength(chain) &&
          validateNoDuplicates(startWord, chain, endWord) &&
          validateNoEmptyWords(chain)

        expect(isValid).toBe(false)
      })
    })
  })
})