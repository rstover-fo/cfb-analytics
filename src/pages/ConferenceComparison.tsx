import { useEffect, useState } from 'react'
import { BarChart3, Trophy, TrendingUp } from 'lucide-react'
import { getTeamRecords, getConferences, TeamRecord } from '../services/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const ConferenceComparison = () => {
  const [records, setRecords] = useState<TeamRecord[]>([])
  const [conferences, setConferences] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [recordsData, conferencesData] = await Promise.all([
        getTeamRecords(selectedYear),
        getConferences()
      ])
      setRecords(recordsData)
      setConferences(conferencesData.filter(c => c !== 'FBS Independents'))
      setLoading(false)
    }
    fetchData()
  }, [selectedYear])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  // Calculate conference stats
  const conferenceStats = conferences.map(conf => {
    const confTeams = records.filter(r => r.conference === conf)
    const totalGames = confTeams.reduce((sum, t) => sum + t.total.games, 0)
    const totalWins = confTeams.reduce((sum, t) => sum + t.total.wins, 0)
    const winPercentage = totalGames > 0 ? (totalWins / totalGames) * 100 : 0
    const avgWins = confTeams.length > 0 ? totalWins / confTeams.length : 0

    return {
      conference: conf,
      teams: confTeams.length,
      totalWins,
      totalGames,
      winPercentage,
      avgWins
    }
  }).filter(stat => stat.teams > 0)

  // Sort by win percentage
  const sortedStats = [...conferenceStats].sort((a, b) => b.winPercentage - a.winPercentage)

  // Data for charts
  const COLORS = ['#1e3a8a', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Conference Comparison</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare performance across different conferences
        </p>
      </div>

      {/* Year Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="max-w-xs">
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
      </div>

      {/* Quick Stats */}
      {!loading && sortedStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-yellow-100">Top Conference</p>
                <p className="text-xl font-bold">{sortedStats[0].conference}</p>
              </div>
            </div>
            <div className="text-3xl font-bold">{sortedStats[0].winPercentage.toFixed(1)}%</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Total Conferences</p>
                <p className="text-xl font-bold">Tracked</p>
              </div>
            </div>
            <div className="text-3xl font-bold">{conferences.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-green-100">Average Win Rate</p>
                <p className="text-xl font-bold">All Conferences</p>
              </div>
            </div>
            <div className="text-3xl font-bold">
              {(sortedStats.reduce((sum, s) => sum + s.winPercentage, 0) / sortedStats.length).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && sortedStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win Percentage Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Win Percentage by Conference
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sortedStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                <YAxis dataKey="conference" type="category" width={100} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="winPercentage" radius={[0, 8, 8, 0]}>
                  {sortedStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Teams Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Teams Distribution
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={sortedStats}
                  dataKey="teams"
                  nameKey="conference"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.conference.split(' ')[0]}: ${entry.teams}`}
                >
                  {sortedStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Conference Stats Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conference Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Conference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Teams
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Wins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Games
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Wins/Team
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : sortedStats.length > 0 ? (
                sortedStats.map((stat, index) => (
                  <tr key={stat.conference} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index < 3 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {stat.conference}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stat.teams}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {stat.totalWins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stat.totalGames}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {stat.winPercentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cfb-primary to-blue-700 h-2 rounded-full"
                              style={{ width: `${stat.winPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {stat.avgWins.toFixed(1)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No conference data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ConferenceComparison
