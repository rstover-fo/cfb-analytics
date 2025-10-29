import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TeamRankings from './pages/TeamRankings'
import GameAnalytics from './pages/GameAnalytics'
import PlayerStats from './pages/PlayerStats'
import ConferenceComparison from './pages/ConferenceComparison'
import AdvancedMetrics from './pages/AdvancedMetrics'
import LiveScores from './pages/LiveScores'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <Router>
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rankings" element={<TeamRankings />} />
          <Route path="/games" element={<GameAnalytics />} />
          <Route path="/players" element={<PlayerStats />} />
          <Route path="/conferences" element={<ConferenceComparison />} />
          <Route path="/metrics" element={<AdvancedMetrics />} />
          <Route path="/scores" element={<LiveScores />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
