# College Football Analytics

A comprehensive, advanced web application for analyzing college football data, built for college football fans and data enthusiasts.

## Features

### 📊 Dashboard
- Quick overview of current season stats
- Top 5 team rankings at a glance
- Recent game results
- Feature highlights and navigation

### 🏆 Team Rankings
- AP Top 25 and Coaches Poll rankings
- Historical ranking data by week
- Team records and win percentages
- First place votes tracking
- Interactive filters for season and week

### 🎮 Game Analytics
- Detailed game-by-game analysis
- Score distribution charts
- Home vs. Away performance metrics
- Blowout and upset tracking
- Venue and attendance information

### 👥 Player Statistics
- Season leaders by category (Passing, Rushing, Receiving, Defense, Kicking)
- Top performers visualization
- Comprehensive stat tables
- Filter by team and season
- Individual player performance metrics

### 🎯 Conference Comparison
- Win percentage analysis by conference
- Conference vs. conference matchups
- Interactive charts and visualizations
- Team distribution across conferences
- Average wins per team metrics

### 📈 Advanced Metrics
- EPA (Expected Points Added) analysis
- Success Rate tracking
- Explosiveness metrics
- Offensive and defensive efficiency scatter plots
- Top 10 offensive and defensive teams
- PPA (Points Per Play) leaderboards

### ⚡ Live Scores & Schedule
- Real-time game scores
- Upcoming game schedules
- Games organized by date
- Venue and attendance information
- Game status tracking (Final, In Progress, Scheduled)

## Technology Stack

- **Frontend Framework:** React 18
- **Type Safety:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **API:** College Football Data API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cfb-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## API Information

This application uses the [College Football Data API](https://collegefootballdata.com/) to fetch real-time college football statistics and information.

**Note:** For production use and higher rate limits, it's recommended to:
1. Sign up for a free API key at https://collegefootballdata.com/
2. Create a `.env` file in the root directory
3. Add your API key: `VITE_CFB_API_KEY=your_api_key_here`
4. Update the `src/services/api.ts` file to use the API key

## Features in Detail

### Dark Mode
Toggle between light and dark themes using the moon/sun icon in the header. Your preference is saved in local storage.

### Responsive Design
Fully responsive layout that works on desktop, tablet, and mobile devices.

### Interactive Visualizations
- Bar charts for score distributions and win percentages
- Pie charts for team distributions
- Scatter plots for advanced metrics correlation
- Real-time data updates

### Advanced Filtering
- Filter by season (last 10 years)
- Filter by week (1-15)
- Filter by team
- Filter by conference
- Filter by stat category

## Project Structure

```
cfb-analytics/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Main layout component
│   ├── pages/
│   │   ├── Dashboard.tsx       # Home dashboard
│   │   ├── TeamRankings.tsx    # Rankings page
│   │   ├── GameAnalytics.tsx   # Game analysis
│   │   ├── PlayerStats.tsx     # Player statistics
│   │   ├── ConferenceComparison.tsx  # Conference stats
│   │   ├── AdvancedMetrics.tsx # EPA and advanced stats
│   │   └── LiveScores.tsx      # Live scores and schedule
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── App.tsx                 # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Data provided by [College Football Data API](https://collegefootballdata.com/)
- Built with modern web technologies and best practices
- Designed for college football fans and data enthusiasts

## Support

For questions or issues, please open an issue on GitHub.

---

**Enjoy exploring college football analytics!** 🏈📊
