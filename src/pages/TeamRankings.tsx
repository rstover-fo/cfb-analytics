import { useEffect, useState, useCallback } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'
import { getRankings, getTeamRecords, RankingWeek, TeamRecord, ApiError } from '../services/api'
import ErrorState from '../components/ErrorState'

const TeamRankings = () => {
  const [rankings, setRankings] = useState<RankingWeek[]>([])
  const [records, setRecords] = useState<TeamRecord[]>([])
  const [selectedPoll, setSelectedPoll] = useState('AP Top 25')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | ApiError | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rankingsData, recordsData] = await Promise.all([
        getRankings(selectedYear, selectedWeek),
        getTeamRecords(selectedYear)
      ])
      setRankings(rankingsData)
      setRecords(recordsData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load rankings'))
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedWeek])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentRanks = rankings[0]?.polls.find(poll => poll.poll === selectedPoll)?.ranks || []

  const getTeamRecord = (school: string) => {
    const record = records.find(r => r.team === school)
    return record ? `${record.total.wins}-${record.total.losses}` : 'N/A'
  }

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
  const weeks = Array.from({ length: 15 }, (_, i) => i + 1)
  const polls = ['AP Top 25', 'Coaches Poll']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Team Rankings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          College Football Playoff rankings and historical data
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rankings-season" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Season
            </label>
            <select
              id="rankings-season"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              autoComplete="off"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rankings-week" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week
            </label>
            <select
              id="rankings-week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              autoComplete="off"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              {weeks.map(week => (
                <option key={week} value={week}>Week {week}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rankings-poll" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll
            </label>
            <select
              id="rankings-poll"
              value={selectedPoll}
              onChange={(e) => setSelectedPoll(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfb-primary dark:focus-visible:ring-cfb-accent"
            >
              {polls.map(poll => (
                <option key={poll} value={poll}>{poll}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Conference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Record
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  1st Place Votes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                [...Array(25)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : currentRanks.length > 0 ? (
                currentRanks.map((rank) => (
                  <tr key={rank.rank} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          rank.rank <= 4 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          rank.rank <= 10 ? 'bg-gradient-to-br from-cfb-primary to-blue-700' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {rank.rank}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {rank.school}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                        {rank.conference}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {getTeamRecord(rank.school)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold tabular-nums">
                      {rank.points.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white tabular-nums">
                      {rank.firstPlaceVotes > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 tabular-nums">
                          {rank.firstPlaceVotes}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    {error ? (
                      <ErrorState error={error} onRetry={fetchData} context="rankings" />
                    ) : (
                      <div>
                        <p className="mb-2">No ranking data available for Week {selectedWeek}, {selectedYear}.</p>
                        <p className="text-sm">Rankings are typically released starting Week 1 of the season. Try selecting a different week or year.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      {currentRanks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Top Ranked</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentRanks[0]?.school}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Teams Ranked</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                  {currentRanks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">First Place Votes</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                  {currentRanks[0]?.firstPlaceVotes || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamRankings
