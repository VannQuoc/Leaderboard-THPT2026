import { Link, useLocation } from 'react-router';
import { Trophy, BarChart3, Sun, Moon, GraduationCap } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: BarChart3 },
  { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
];

export default function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg) 80%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 transition-transform group-hover:scale-110">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                THPT Lý Tự Trọng
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Bảng xếp hạng điểm thi 2026
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-emerald-400'
                      : 'hover:text-emerald-400'
                  }`}
                  style={{
                    color: isActive ? undefined : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-emerald-500/10"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
