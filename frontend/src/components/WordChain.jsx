import styles from './WordChain.module.css'

function WordChain({ startWord, endWord, chain, onRemoveWord }) {
  const allWords = [startWord, ...chain]
  
  return (
    <div className={styles.chain}>
      {allWords.map((word, index) => {
        const isChainWord = index > 0 && index < allWords.length
        const chainIndex = index - 1 // index in the chain array (not including start word)
        
        return (
          <div key={`${word}-${index}`} className={styles.step}>
            <div 
              className={`${styles.word} ${index === 0 ? styles.startWord : styles.chainWord}`}
              onClick={isChainWord && onRemoveWord ? () => onRemoveWord(chainIndex) : undefined}
              role={isChainWord ? 'button' : undefined}
              tabIndex={isChainWord ? 0 : undefined}
              title={isChainWord ? 'Click to remove' : undefined}
            >
              {word}
              {isChainWord && (
                <span className={styles.removeHint}>×</span>
              )}
            </div>
          
            {index < allWords.length - 1 && (
              <div className={styles.connector}>
                <div className={styles.line} />
                <span className={styles.stepNumber}>{index + 1}</span>
              </div>
            )}
          </div>
        )
      })}
      
      {chain.length > 0 && (
        <>
          <div className={styles.step}>
            <div className={styles.connector}>
              <div className={styles.lineDashed} />
              <span className={styles.stepNumber}>?</span>
            </div>
          </div>
          <div className={styles.step}>
            <div className={`${styles.word} ${styles.targetWord}`}>
              {endWord}
            </div>
          </div>
        </>
      )}
      
      {chain.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>○─○─○</span>
          <span className={styles.emptyText}>your chain will appear here</span>
          <span className={styles.emptyHint}>type a word to begin</span>
        </div>
      )}
    </div>
  )
}

export default WordChain