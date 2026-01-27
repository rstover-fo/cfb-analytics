import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Users, Activity } from 'lucide-react'
import { getRankings, getGames, RankingWeek, Game } from '../services/api'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [rankings, setRankings] = useState<RankingWeek[]>([])
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [rankingsData, gamesData] = await Promise.all([
        getRankings(currentYear, 1),
        getGames(currentYear)
      ])
      setRankings(rankingsData)
      setRecentGames(gamesData.slice(0, 10))
      setLoading(false)
    }
    fetchData()
  }, [])

  const topRanks = rankings[0]?.polls
    .find(poll => poll.poll === 'AP Top 25')
    ?.ranks.slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-cfb-primary to-blue-700 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome to CFB Analytics</h2>
        <p className="text-blue-100 dark:text-gray-300">
          Your comprehensive platform for college football data analysis and insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/rankings">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Team Rankings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Top 25</p>
              </div>
              <div className="bg-cfb-primary/10 dark:bg-cfb-accent/10 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-cfb-primary dark:text-cfb-accent" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/games">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Game Analysis</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">In-Depth</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/players">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Player Stats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Leaders</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Link>

        <Link to="/metrics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Advanced Stats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">EPA, SR</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Top 5 Rankings and Recent Games */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Rankings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top 5 Rankings</h2>
            <Link to="/rankings" className="text-sm text-cfb-primary dark:text-cfb-accent hover:underline">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topRanks.map((rank) => (
                <div
                  key={rank.rank}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cfb-primary to-cfb-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {rank.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{rank.school}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{rank.conference}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 tabular-nums">
                    {rank.points.toLocaleString()}&nbsp;pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Games</h2>
            <Link to="/scores" className="text-sm text-cfb-primary dark:text-cfb-accent hover:underline">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.slice(0, 5).map((game) => (
                <div
                  key={game.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cfb-primary dark:hover:border-cfb-accent transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {game.away_team}
                        </span>
                        <span className="font-bold text-lg text-gray-900 dark:text-white tabular-nums">
                          {game.away_points}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {game.home_team}
                        </span>
                        <span className="font-bold text-lg text-gray-900 dark:text-white tabular-nums">
                          {game.home_points}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Week {game.week} • {new Date(game.start_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Comprehensive Rankings
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Track AP and Coaches Poll rankings throughout the season with historical data and trends.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Advanced Metrics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Dive into EPA, success rate, explosiveness, and other advanced analytics for deeper insights.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-layered-md p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Game-by-Game Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Analyze individual games with detailed statistics, scores, and performance metrics.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
