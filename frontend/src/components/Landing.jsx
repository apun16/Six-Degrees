'use client'

import { useState, useEffect } from 'react'
import styles from '../styles/landing.module.css'

const SAMPLE_CHAINS = [
  'HEART → LOVE → FAMILY → HOME → HOUSE',
  'STAR → NIGHT → MOON → TIDE → OCEAN',
  'FIRE → HEAT → SUN → STAR → SPACE',
  'MUSIC → SONG → ROOSTER → BIRD → FLY',
  'OCEAN → WAVE → BEACH → SAND → SANDAL',
  'ART → CANVAS → PAINTING → AUCTION → BID',
];
const NODES = [
  // Left 
  { x: 5, y: 10 },
  { x: 15, y: 20 },
  { x: 8, y: 35 }, 
  { x: 20, y: 45 }, 
  { x: 5, y: 55 }, 
  { x: 15, y: 65 }, 
  { x: 8, y: 80 },
  { x: 22, y: 90 },
  // Right 
  { x: 95, y: 12 },
  { x: 85, y: 22 }, 
  { x: 92, y: 38 },
  { x: 80, y: 48 }, 
  { x: 95, y: 58 },  
  { x: 85, y: 68 }, 
  { x: 92, y: 82 },
  { x: 78, y: 92 },  
  // Top 
  { x: 35, y: 5 }, 
  { x: 65, y: 8 }, 
  // Bottom 
  { x: 40, y: 95 }, 
  { x: 58, y: 92 },  
]

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7],
  [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  [8, 10], [9, 11], [10, 12], [11, 13], [12, 14], [13, 15],
  [1, 16], [16, 17], [17, 9],
  [7, 18], [18, 19], [19, 15],
  [0, 16], [8, 17], [6, 18], [14, 19],
]

function Landing({ onPlay }) {
  const [isVisible, setIsVisible] = useState(false)
  const [chainIndex, setChainIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setChainIndex(prev => (prev + 1) % SAMPLE_CHAINS.length)
        setIsFading(false)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`${styles.landing} ${isVisible ? styles.visible : ''}`}>
      <svg className={styles.network} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {CONNECTIONS.map(([from, to], i) => (
          <line
            key={`line-${i}`}
            x1={NODES[from].x}
            y1={NODES[from].y}
            x2={NODES[to].x}
            y2={NODES[to].y}
            className={styles.networkLine}
            style={{ '--delay': `${(i * 0.05)}s` }}
          />
        ))}
        {NODES.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r="0.8"
            className={styles.networkNode}
            style={{ '--delay': `${(i * 0.03)}s` }}
          />
        ))}
      </svg>
      <div className={styles.content}>
        <div className={styles.logo}>
          <span className={styles.six}>6</span>
          <span className={styles.degree}>°</span>
        </div>
        
        <h1 className={styles.title}>degrees</h1>
        
        <p className={styles.tagline}>
          connect any two words in six steps
        </p>
        
        <p className={styles.description}>
          every word links to another. find the path.
        </p>

        <button className={styles.playBtn} onClick={onPlay}>
          <span className={styles.playText}>play</span>
          <span className={styles.playArrow}>→</span>
        </button>
        
        <div className={styles.hint}>
          <span className={styles.hintIcon}>○</span>
          <span className={`${styles.hintText} ${isFading ? styles.fading : ''}`}>
            {SAMPLE_CHAINS[chainIndex]}
          </span>
          <span className={styles.hintIcon}>○</span>
        </div>
      </div>
    </div>
  )
}

export default Landing