import { render, screen } from '@testing-library/react'
import Results from '../components/Results'

jest.mock('../styles/results.module.css', () => ({
  results: 'results',
  scoreSection: 'scoreSection',
  score: 'score',
  scoreLabel: 'scoreLabel',
  scoreEmoji: 'scoreEmoji',
  message: 'message',
  puzzle: 'puzzle',
  word: 'word',
  arrow: 'arrow',
  comparison: 'comparison',
  pathSection: 'pathSection',
  pathTitle: 'pathTitle',
  path: 'path',
  pathWord: 'pathWord',
  pathLength: 'pathLength',
  actions: 'actions',
}))

describe('Score Render Tests', () => {
  const mockOnPlayAgain = jest.fn()

  const defaultResult = {
    start_word: 'CAT',
    end_word: 'DOG',
    player_path: ['ANIMAL'],
    optimal_path: ['CAT', 'ANIMAL', 'DOG'],
    player_length: 2,
    optimal_length: 2,
    score: 100,
    valid: true,
  }

  beforeEach(() => {
    mockOnPlayAgain.mockClear()
  })

  test('should render perfect score (100)', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('PERFECT')).toBeInTheDocument()
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  test('should render "YOU BEAT THE ALGORITHM!" for score >= 110', () => {
    const result = {
      ...defaultResult,
      score: 110,
      player_length: 1,
      optimal_length: 2,
    }

    render(<Results result={result} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText('YOU BEAT THE ALGORITHM!')).toBeInTheDocument()
    expect(screen.getByText('🤖💥')).toBeInTheDocument()
  })

  test('should render score labels correctly for different scores', () => {
    const testCases = [
      { score: 95, expectedLabel: 'EXCELLENT' },
      { score: 85, expectedLabel: 'GREAT' },
      { score: 75, expectedLabel: 'GOOD' },
      { score: 65, expectedLabel: 'NICE' },
      { score: 55, expectedLabel: 'COMPLETED' },
      { score: 45, expectedLabel: 'TRY AGAIN' },
    ]

    testCases.forEach(({ score, expectedLabel }) => {
      const { unmount } = render(
        <Results
          result={{ ...defaultResult, score }}
          onPlayAgain={mockOnPlayAgain}
        />
      )
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
      unmount()
    })
  })

  test('should render "PATH NOT CONNECTED" for invalid paths', () => {
    const result = {
      ...defaultResult,
      valid: false,
      score: 0,
    }

    render(<Results result={result} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText('PATH NOT CONNECTED')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  test('should render "PARTIAL CREDIT" for broken paths with score > 0', () => {
    const result = {
      ...defaultResult,
      valid: false,
      score: 30,
    }

    render(<Results result={result} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText('PARTIAL CREDIT')).toBeInTheDocument()
  })

  test('should display player path correctly', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    const catElements = screen.getAllByText('CAT')
    const animalElements = screen.getAllByText('ANIMAL')
    const dogElements = screen.getAllByText('DOG')
    
    expect(catElements.length).toBeGreaterThan(0)
    expect(animalElements.length).toBeGreaterThan(0)
    expect(dogElements.length).toBeGreaterThan(0)
  })

  test('should display optimal path correctly', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    const optimalPath = defaultResult.optimal_path
    optimalPath.forEach((word) => {
      const elements = screen.getAllByText(word)
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  test('should display step counts correctly', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    const stepElements = screen.getAllByText(/2 step/)
    expect(stepElements.length).toBeGreaterThan(0)
  })

  test('should render comparison message correctly', () => {
    const result = {
      ...defaultResult,
      player_length: 3,
      optimal_length: 2,
    }

    render(<Results result={result} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText(/1 step.*longer than optimal/)).toBeInTheDocument()
  })

  test('should render "You matched the optimal path" when lengths match', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    expect(screen.getByText(/You matched the optimal path/)).toBeInTheDocument()
  })

  test('should call onPlayAgain when play again button is clicked', () => {
    render(<Results result={defaultResult} onPlayAgain={mockOnPlayAgain} />)

    const playAgainButton = screen.getByText(/play again/i)
    playAgainButton.click()

    expect(mockOnPlayAgain).toHaveBeenCalledTimes(1)
  })
})