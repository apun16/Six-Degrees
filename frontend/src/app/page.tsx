'use client'

import { useState } from 'react'
import Landing from '../components/landing'
import GitHubIcon from '../components/GitHubIcon' 
import styles from '../components/page.module.css'

export default function Page() {
  const [started, setStarted] = useState(false)

  const handleHelpClick = () => {
    console.log('Help clicked!')
  }

  const handleNewGame = () => {
    console.log('New game started!')
  }

  return (
    <div className={styles.app}>
      {started ? (
        <>
          <header className={styles.header}>
            <div className={styles.inner}>
              <button 
                className={styles.iconBtn} 
                onClick={handleHelpClick}
                aria-label="How to Play"
              >
                ?
              </button>
              <button 
                className={styles.iconBtn} 
                onClick={handleNewGame}
                aria-label="New game"
              >
                ↻
              </button>
            </div>
          </header>

          <main className={styles.main}>
            {/* Game content goes here */}
          </main>

          <footer className={styles.footer}>
            <span className={styles.footerText}>
              connect two words in 6 steps or less
            </span>
            <div className={styles.footerMeta}>
              <span className={styles.copyright}>© 2026</span>
              <a 
                href="https://github.com/apun16/6-Degrees" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.githubLink}
                aria-label="View source code on GitHub"
              >
                <GitHubIcon size={18} />
              </a>
            </div>
          </footer>
        </>
      ) : (
        <Landing onPlay={() => setStarted(true)} />
      )}
    </div>
  )
}