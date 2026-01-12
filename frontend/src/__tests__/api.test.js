import { api } from '../utils/api'

global.fetch = jest.fn()

describe('API Utility Functions', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('getNewGame', () => {
    test('should fetch new game successfully', async () => {
      const mockResponse = {
        success: true,
        startWord: 'CAT',
        targetWord: 'DOG',
      }

      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'application/json')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: mockHeaders,
      })

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ steps: 3 }),
        headers: mockHeaders,
      })

      const result = await api.getNewGame()

      expect(fetch).toHaveBeenCalled()
      expect(result.start_word).toBe('CAT')
      expect(result.end_word).toBe('DOG')
    })

    test('should handle API errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.getNewGame()).rejects.toThrow()
    })
  })

  describe('validateWord', () => {
    test('should validate word successfully', async () => {
      const mockResponse = {
        success: true,
        valid: true,
        word: 'DOG',
      }

      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'application/json')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: mockHeaders,
      })

      const result = await api.validateWord('DOG', [], 'CAT')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/game/validate'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('DOG'),
        })
      )
      expect(result.valid).toBe(true)
    })

    test('should handle validation errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Word not connected',
      }

      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'application/json')

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
        headers: mockHeaders,
      })

      await expect(api.validateWord('INVALID', [], 'CAT')).rejects.toThrow()
    })
  })

  describe('submitChain', () => {
    test('should submit chain successfully', async () => {
      const mockResponse = {
        success: true,
        score: 100,
        playerSteps: 2,
        algorithmSteps: 2,
        algorithmPath: ['CAT', 'ANIMAL', 'DOG'],
        valid: true,
      }

      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'application/json')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: mockHeaders,
      })

      const result = await api.submitChain(['ANIMAL'], 'CAT', 'DOG')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/game/submit'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('CAT'),
        })
      )
      expect(result.score).toBe(100)
      expect(result.valid).toBe(true)
    })

    test('should handle submission errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.submitChain([], 'CAT', 'DOG')).rejects.toThrow()
    })
  })

  describe('getHint', () => {
    test('should fetch hint successfully', async () => {
      const mockResponse = {
        success: true,
        hint: {
          word: 'ANIMAL',
          masked_word: 'A_____',
          word_length: 6,
          hint_level: 1,
          steps_remaining: 2,
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'application/json')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: mockHeaders,
      })

      const result = await api.getHint('CAT', 'DOG', [], 1)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/game/hint'),
        expect.any(Object)
      )
      expect(result.hint.word).toBe('ANIMAL')
      expect(result.hint.masked_word).toBe('A_____')
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(api.getNewGame()).rejects.toThrow(
        'Cannot connect to server'
      )
    })

    test('should handle non-JSON responses', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('content-type', 'text/html')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Not JSON')
        },
        headers: mockHeaders,
        text: async () => '<html>Error</html>',
      })

      await expect(api.getNewGame()).rejects.toThrow()
    })
  })
})