import { useEffect, useState } from 'react'
import { Users, Trophy, TrendingUp } from 'lucide-react'
import { getPlayerSeasonStats, getTeams, PlayerSeasonStat, Team } from '../services/api'

const PlayerStats = () => {
  const [players, setPlayers] = useState<PlayerSeasonStat[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('passing')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [playersData, teamsData] = await Promise.all([
        getPlayerSeasonStats(selectedYear, selectedCategory, selectedTeam || undefined),
        getTeams(selectedYear)
      ])
      setPlayers(playersData.slice(0, 50)) // Limit to top 50
      setTeams(teamsData.sort((a, b) => a.school.localeCompare(b.school)))
      setLoading(false)
    }
    fetchData()
  }, [selectedYear, selectedCategory, selectedTeam])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const categories = [
    { value: 'passing', label: 'Passing' },
    { value: 'rushing', label: 'Rushing' },
    { value: 'receiving', label: 'Receiving' },
    { value: 'defensive', label: 'Defense' },
    { value: 'kicking', label: 'Kicking' },
  ]

  const getStatLabel = (statType: string) => {
    const labels: Record<string, string> = {
      'YDS': 'Yards',
      'TD': 'Touchdowns',
      'INT': 'Interceptions',
      'ATT': 'Attempts',
      'COMP': 'Completions',
      'REC': 'Receptions',
      'LONG': 'Long',
      'AVG': 'Average',
    }
    return labels[statType] || statType
  }

  // Group players by stat type
  const groupedPlayers: Record<string, PlayerSeasonStat[]> = {}
  players.forEach(player => {
    if (!groupedPlayers[player.statType]) {
      groupedPlayers[player.statType] = []
    }
    groupedPlayers[player.statType].push(player)
  })

  // Get top performers for cards
  const topYards = players.filter(p => p.statType === 'YDS').sort((a, b) => b.stat - a.stat)[0]
  const topTDs = players.filter(p => p.statType === 'TD').sort((a, b) => b.stat - a.stat)[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Player Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Individual player performance and season leaders
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="players-season" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
              id="players-season"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="players-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="players-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="players-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team (Optional)
            </label>
            <select
              id="players-team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.school}>{team.school}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top Performers Cards */}
      {!loading && (topYards || topTDs) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topYards && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Leading in Yards</p>
                  <p className="text-2xl font-bold">{topYards.player}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">{topYards.team}</span>
                <span className="text-3xl font-bold">{topYards.stat.toFixed(0)}</span>
              </div>
            </div>
          )}

          {topTDs && (
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-green-100">Leading in Touchdowns</p>
                  <p className="text-2xl font-bold">{topTDs.player}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-100">{topTDs.team}</span>
                <span className="text-3xl font-bold">{topTDs.stat.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Player Stats Tables */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : Object.keys(groupedPlayers).length > 0 ? (
        Object.entries(groupedPlayers).map(([statType, statPlayers]) => (
          <div key={statType} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {getStatLabel(statType)} Leaders
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Conference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {getStatLabel(statType)}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {statPlayers.slice(0, 20).map((player, index) => (
                    <tr key={`${player.player}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index < 3 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {player.player}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {player.team}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                          {player.conference}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {player.stat.toFixed(statType === 'AVG' ? 2 : 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-500 dark:text-gray-400">
            No player statistics found for the selected filters
          </p>
        </div>
      )}
    </div>
  )
}

export default PlayerStats
