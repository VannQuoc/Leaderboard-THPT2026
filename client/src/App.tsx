import { BrowserRouter, Routes, Route } from 'react-router';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/Layout/Header';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StudentPage from './pages/StudentPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/student/:sbd" element={<StudentPage />} />
            </Routes>
          </main>
          <footer className="mt-12 border-t py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <p>© 2026 Trường THPT Lý Tự Trọng — Bảng xếp hạng điểm thi tốt nghiệp THPT</p>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
