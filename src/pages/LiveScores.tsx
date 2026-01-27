import { useEffect, useState } from 'react'
import { Clock, Calendar, MapPin, Users, RefreshCw } from 'lucide-react'
import { getGames, Game } from '../services/api'

const LiveScores = () => {
  const [games, setGames] = useState<Game[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchGames = async () => {
    setLoading(true)
    const gamesData = await getGames(selectedYear, selectedWeek)
    // Sort games by date
    const sortedGames = gamesData.sort((a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    setGames(sortedGames)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchGames()
  }, [selectedYear, selectedWeek])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const weeks = Array.from({ length: 15 }, (_, i) => i + 1)

  // Group games by date
  const gamesByDate: Record<string, Game[]> = {}
  games.forEach(game => {
    const date = new Date(game.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!gamesByDate[date]) {
      gamesByDate[date] = []
    }
    gamesByDate[date].push(game)
  })

  const getGameStatus = (game: Game) => {
    const now = new Date()
    const gameDate = new Date(game.start_date)

    if (game.home_points > 0 || game.away_points > 0) {
      return 'Final'
    } else if (gameDate > now) {
      return gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return 'Scheduled'
    }
  }

  const isGameFinal = (game: Game) => {
    return game.home_points > 0 || game.away_points > 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Live Scores & Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time scores and upcoming games
          </p>
        </div>
        <button
          onClick={fetchGames}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-cfb-primary hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scores-season" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
              id="scores-season"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cfb-primary"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="scores-week" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week
            </label>
            <select
              id="scores-week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cfb-primary"
            >
              {weeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Games</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{games.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {games.filter(g => isGameFinal(g)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {games.filter(g => !isGameFinal(g)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {games.filter(g => g.attendance).length > 0
                  ? Math.round(games.reduce((sum, g) => sum + (g.attendance || 0), 0) / games.filter(g => g.attendance).length).toLocaleString()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Games by Date */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(gamesByDate).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(gamesByDate).map(([date, dateGames]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                  {date}
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dateGames.map((game) => {
                  const isFinal = isGameFinal(game)
                  const winner = isFinal
                    ? game.home_points > game.away_points
                      ? 'home'
                      : 'away'
                    : null

                  return (
                    <div key={game.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Teams and Scores */}
                        <div className="flex-1">
                          {/* Away Team */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <span className={`text-lg font-bold ${
                                winner === 'away'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {game.away_team}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                {game.away_conference}
                              </span>
                            </div>
                            <span className={`text-2xl font-bold ml-4 ${
                              winner === 'away'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {isFinal ? game.away_points : '-'}
                            </span>
                          </div>

                          {/* Home Team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <span className={`text-lg font-bold ${
                                winner === 'home'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {game.home_team}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                {game.home_conference}
                              </span>
                            </div>
                            <span className={`text-2xl font-bold ml-4 ${
                              winner === 'home'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {isFinal ? game.home_points : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Game Info */}
                        <div className="lg:ml-8 lg:w-64 space-y-2">
                          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            isFinal
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                          }`}>
                            {getGameStatus(game)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                            <span className="truncate">{game.venue}</span>
                          </div>
                          {game.attendance && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                              {game.attendance.toLocaleString()} attendance
                            </div>
                          )}
                          {game.excitement_index && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                              Excitement: {game.excitement_index.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-500 dark:text-gray-400">
            No games found for Week {selectedWeek} of the {selectedYear} season
          </p>
        </div>
      )}
    </div>
  )
}

export default LiveScores
