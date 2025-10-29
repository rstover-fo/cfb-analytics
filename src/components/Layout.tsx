import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Trophy, Activity, Users, BarChart3, TrendingUp, Clock, Moon, Sun } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  darkMode: boolean
  toggleDarkMode: () => void
}

const Layout = ({ children, darkMode, toggleDarkMode }: LayoutProps) => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/rankings', icon: Trophy, label: 'Rankings' },
    { path: '/games', icon: Activity, label: 'Game Analytics' },
    { path: '/players', icon: Users, label: 'Player Stats' },
    { path: '/conferences', icon: BarChart3, label: 'Conferences' },
    { path: '/metrics', icon: TrendingUp, label: 'Advanced Metrics' },
    { path: '/scores', icon: Clock, label: 'Live Scores' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cfb-primary to-cfb-secondary rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CFB Analytics
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Advanced College Football Analytics
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[76px] z-40">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-cfb-primary text-cfb-primary dark:text-cfb-accent'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Data powered by CollegeFootballData.com API</p>
            <p className="mt-1">Built for college football fans and data enthusiasts</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
