import { useState } from 'react'
import './App.css'

let artworkPool = null

async function getPool() {
  if (artworkPool) return artworkPool
  const res = await fetch(
    'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&isPublicDomain=true&q=painting'
  )
  const { objectIDs } = await res.json()
  artworkPool = objectIDs
  return artworkPool
}

async function fetchRandomArtwork(banned) {
  const pool = await getPool()

  for (let attempt = 0; attempt < 5; attempt++) {
    const randomId = pool[Math.floor(Math.random() * pool.length)]
    const res = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomId}`
    )
    const art = await res.json()

    if (!art.primaryImageSmall) continue

    const vals = [art.artistDisplayName, art.medium, art.period, art.culture]
    if (vals.every(v => !v || !banned.has(v))) {
      return art
    }
  }
  return null
}

export default function App() {
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(false)
  const [banned, setBanned] = useState(new Set())

  const discover = async () => {
    setLoading(true)
    const result = await fetchRandomArtwork(banned)
    if (result) {
      setArtwork(result)
    }
    setLoading(false)
  } 
  const toggleBan = (value) => {
    if(!value) return 
    setBanned(prev => {
      const next = new Set(prev)
      if(next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  return (
    <div className="app">
      <h1>ArtStyles</h1>
      <button className="discover-btn" onClick={discover} disabled={loading}>
        {loading ? 'Discovering' : 'Discover'}
      </button>
      {artwork && (
        <div className="artwork-card">
          <img
            src={artwork.primaryImageSmall}
            alt={artwork.title}
          />
          <div className="artwork-info">
            <h2>{artwork.title}</h2>
            <button className={banned.has(artwork.artistDisplayName) ? 'banned' : ''} onClick={() => toggleBan(artwork.artistDisplayName)}>
              Artist: {artwork.artistDisplayName}
            </button>
            <button className={banned.has(artwork.medium) ? 'banned' : ''} onClick={() => toggleBan(artwork.medium)}>
              Medium: {artwork.medium}
            </button>
            <button className={banned.has(artwork.period) ? 'banned' : ''} onClick={() => toggleBan(artwork.period)}>
              Period: {artwork.period}
            </button>
            <button className={banned.has(artwork.culture) ? 'banned' : ''} onClick={() => toggleBan(artwork.culture)}>
              Culture: {artwork.culture}
            </button>
          </div>
        </div>
      )}
      <div className="ban-section">
        <h3>Ban List</h3>
      <div className="ban-list">
        {[...banned].map(val => (
          <button className="ban-chip" key={val} onClick={() => toggleBan(val)}>
            {val} x
        </button>
      ))}
      </div>
      </div>
    </div>
  )
}
