import { useEffect, useState } from 'react'
import { Activity, Calendar, MapPin, Users } from 'lucide-react'
import { getGames, getTeams, Game, Team } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const GameAnalytics = () => {
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [gamesData, teamsData] = await Promise.all([
        getGames(selectedYear, selectedWeek, selectedTeam || undefined),
        getTeams(selectedYear)
      ])
      setGames(gamesData)
      setTeams(teamsData.sort((a, b) => a.school.localeCompare(b.school)))
      setLoading(false)
    }
    fetchData()
  }, [selectedYear, selectedWeek, selectedTeam])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const weeks = Array.from({ length: 15 }, (_, i) => i + 1)

  // Calculate stats
  const avgHomeScore = games.length > 0
    ? (games.reduce((sum, g) => sum + g.home_points, 0) / games.length).toFixed(1)
    : 0
  const avgAwayScore = games.length > 0
    ? (games.reduce((sum, g) => sum + g.away_points, 0) / games.length).toFixed(1)
    : 0
  const upsets = games.filter(g => g.away_points > g.home_points).length
  const blowouts = games.filter(g => Math.abs(g.home_points - g.away_points) >= 21).length

  // Score distribution data
  const scoreRanges = [
    { range: '0-10', count: 0 },
    { range: '11-20', count: 0 },
    { range: '21-30', count: 0 },
    { range: '31-40', count: 0 },
    { range: '41-50', count: 0 },
    { range: '50+', count: 0 },
  ]

  games.forEach(game => {
    const totalScore = game.home_points + game.away_points
    if (totalScore <= 10) scoreRanges[0].count++
    else if (totalScore <= 20) scoreRanges[1].count++
    else if (totalScore <= 30) scoreRanges[2].count++
    else if (totalScore <= 40) scoreRanges[3].count++
    else if (totalScore <= 50) scoreRanges[4].count++
    else scoreRanges[5].count++
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Game Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed analysis of games, scores, and matchups
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cfb-primary"
            >
              {weeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team (Optional)
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cfb-primary"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.school}>{team.school}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Home Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgHomeScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Road Wins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{upsets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Blowouts (21+)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{blowouts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Total Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreRanges}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="range" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Games List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Games</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : games.length > 0 ? (
            games.map((game) => (
              <div key={game.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    {/* Away Team */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-bold ${
                          game.away_points > game.home_points
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {game.away_team}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {game.away_conference}
                        </span>
                      </div>
                      <span className={`text-2xl font-bold ${
                        game.away_points > game.home_points
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {game.away_points}
                      </span>
                    </div>
                    {/* Home Team */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-bold ${
                          game.home_points > game.away_points
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {game.home_team}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {game.home_conference}
                        </span>
                      </div>
                      <span className={`text-2xl font-bold ${
                        game.home_points > game.away_points
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {game.home_points}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end space-y-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(game.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-1" />
                      {game.venue}
                    </div>
                    {game.attendance && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        {game.attendance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No games found for the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameAnalytics
