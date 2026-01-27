import { useEffect, useState } from 'react'
import { TrendingUp, Activity, Target, Zap } from 'lucide-react'
import { getAdvancedStats, getTeams, AdvancedStat, Team } from '../services/api'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const AdvancedMetrics = () => {
  const [stats, setStats] = useState<AdvancedStat[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedTeam, setSelectedTeam] = useState('')
  const [metricView, setMetricView] = useState<'offense' | 'defense'>('offense')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [statsData, teamsData] = await Promise.all([
        getAdvancedStats(selectedYear, selectedTeam || undefined),
        getTeams(selectedYear)
      ])
      setStats(statsData.filter(s => s.offense && s.defense))
      setTeams(teamsData.sort((a, b) => a.school.localeCompare(b.school)))
      setLoading(false)
    }
    fetchData()
  }, [selectedYear, selectedTeam])

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  // Prepare scatter plot data
  const scatterData = stats.map(stat => ({
    team: stat.team,
    conference: stat.conference,
    offensePPA: stat.offense?.ppa || 0,
    defensePPA: stat.defense?.ppa || 0,
    offenseSuccessRate: (stat.offense?.successRate || 0) * 100,
    defenseSuccessRate: (stat.defense?.successRate || 0) * 100,
    offenseExplosiveness: stat.offense?.explosiveness || 0,
    defenseExplosiveness: stat.defense?.explosiveness || 0,
  }))

  // Calculate rankings
  const offensiveLeaders = [...stats]
    .filter(s => s.offense)
    .sort((a, b) => (b.offense?.ppa || 0) - (a.offense?.ppa || 0))
    .slice(0, 10)

  const defensiveLeaders = [...stats]
    .filter(s => s.defense)
    .sort((a, b) => (a.defense?.ppa || 0) - (b.defense?.ppa || 0))
    .slice(0, 10)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="font-bold mb-2">{data.team}</p>
          <p className="text-sm text-gray-300">{data.conference}</p>
          <div className="mt-2 space-y-1 text-sm tabular-nums">
            <p>PPA:&nbsp;{data[metricView === 'offense' ? 'offensePPA' : 'defensePPA'].toFixed(3)}</p>
            <p>Success Rate:&nbsp;{data[metricView === 'offense' ? 'offenseSuccessRate' : 'defenseSuccessRate'].toFixed(1)}%</p>
            <p>Explosiveness:&nbsp;{data[metricView === 'offense' ? 'offenseExplosiveness' : 'defenseExplosiveness'].toFixed(3)}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Advanced Metrics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          EPA, Success Rate, Explosiveness, and other advanced analytics
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="metrics-season" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
              id="metrics-season"
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
            <label htmlFor="metrics-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team (Optional)
            </label>
            <select
              id="metrics-team"
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

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View
            </legend>
            <div className="flex space-x-2" role="group" aria-label="Metric view toggle">
              <button
                onClick={() => setMetricView('offense')}
                aria-pressed={metricView === 'offense'}
                className={`flex-1 px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                  metricView === 'offense'
                    ? 'bg-cfb-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Offense
              </button>
              <button
                onClick={() => setMetricView('defense')}
                aria-pressed={metricView === 'defense'}
                className={`flex-1 px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                  metricView === 'defense'
                    ? 'bg-cfb-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Defense
              </button>
            </div>
          </fieldset>
        </div>
      </div>

      {/* Metrics Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">EPA (PPA)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Expected Points Added per play. Measures the value added on each play compared to average.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Success Rate</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentage of plays that result in positive EPA. Measures consistency and reliability.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Explosiveness</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average EPA on successful plays. Measures ability to create big plays and break defenses.
          </p>
        </div>
      </div>

      {/* Scatter Plot */}
      {!loading && scatterData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {metricView === 'offense' ? 'Offensive' : 'Defensive'} Efficiency: PPA vs Success Rate
          </h3>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                dataKey={metricView === 'offense' ? 'offensePPA' : 'defensePPA'}
                name="PPA"
                stroke="#9CA3AF"
                label={{ value: 'Points Per Play (PPA)', position: 'bottom', fill: '#9CA3AF' }}
              />
              <YAxis
                type="number"
                dataKey={metricView === 'offense' ? 'offenseSuccessRate' : 'defenseSuccessRate'}
                name="Success Rate"
                stroke="#9CA3AF"
                label={{ value: 'Success Rate (%)', angle: -90, position: 'left', fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={scatterData}
                fill="#3B82F6"
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={selectedTeam && entry.team === selectedTeam ? '#DC2626' : '#3B82F6'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            {metricView === 'offense'
              ? 'Teams in the upper-right quadrant have both high efficiency and consistency'
              : 'Lower PPA and lower Success Rate indicates better defensive performance'
            }
          </div>
        </div>
      )}

      {/* Leaders Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offensive Leaders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-green-700">
            <h3 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" aria-hidden="true" />
              Top Offensive Teams (PPA)
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : offensiveLeaders.length > 0 ? (
              offensiveLeaders.map((stat, index) => (
                <div
                  key={stat.team}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index < 3 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{stat.team}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.conference}</p>
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {stat.offense?.ppa.toFixed(3)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((stat.offense?.successRate || 0) * 100).toFixed(1)}%&nbsp;SR
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Defensive Leaders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-red-700">
            <h3 className="text-xl font-bold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" aria-hidden="true" />
              Top Defensive Teams (PPA)
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            ) : defensiveLeaders.length > 0 ? (
              defensiveLeaders.map((stat, index) => (
                <div
                  key={stat.team}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index < 3 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{stat.team}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.conference}</p>
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {stat.defense?.ppa.toFixed(3)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((stat.defense?.successRate || 0) * 100).toFixed(1)}%&nbsp;SR
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedMetrics
