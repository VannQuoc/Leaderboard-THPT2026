import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid,
} from 'recharts';
import { Search, Users, TrendingUp, Activity, Target, ArrowRight, X, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { formatScore } from '../lib/utils';
import type { StatsOverview, ScoreDistribution, SubjectStats, Student } from '../lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as Easing } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

function CountUp({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      setDisplay((1 - Math.pow(1 - t, 3)) * value);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

const DIST_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#059669'];

function getSubjectBarColor(avg: number): string {
  if (avg >= 8) return '#10b981';
  if (avg >= 7) return '#22c55e';
  if (avg >= 6) return '#84cc16';
  if (avg >= 5) return '#eab308';
  if (avg >= 4) return '#f97316';
  return '#ef4444';
}

// Countdown target: 2026-07-01 08:00:00 GMT+7 = 01:00:00 UTC
const UNLOCK_TIME = new Date('2026-07-01T01:00:00.000Z').getTime();

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(): { remaining: CountdownValues | null; unlocked: boolean } {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = UNLOCK_TIME - now;
  if (diff <= 0) return { remaining: null, unlocked: true };

  return {
    unlocked: false,
    remaining: {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    },
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { remaining, unlocked } = useCountdown();
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    Promise.all([
      api.stats.overview().then((r) => setOverview(r.data)),
      api.stats.distribution().then((r) => setDistribution(r.data)),
      api.stats.bySubject().then((r) => setSubjectStats(r.data)),
    ]).catch(console.error);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.students.list({ search: value.trim(), limit: '8' });
        setResults(res.data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (/^\d+$/.test(trimmed)) {
      navigate(`/student/${trimmed}`);
      return;
    }
    handleSearch(trimmed);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  if (!overview) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const subjectChartData = [...subjectStats]
    .sort((a, b) => b.average - a.average)
    .map((s) => ({
      name: s.subjectLabel,
      avg: s.average,
      highest: s.highest,
      count: s.count,
    }));

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
      {/* ===== HERO + COUNTDOWN / SEARCH ===== */}
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hero-section mb-6 sm:mb-10"
      >
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight">
            <span className="gradient-text">
              {unlocked ? 'Tra Cứu Điểm Thi' : 'Sắp Công Bố Điểm Thi'}
            </span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Trường THPT Lý Tự Trọng — Kỳ thi tốt nghiệp THPT 2026
          </p>
        </div>

        {/* Countdown — shown before unlock */}
        {!unlocked && remaining && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg mb-4"
          >
            <div className="card p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Điểm thi sẽ được công bố lúc 8:00 sáng 01/07/2026
                </span>
              </div>
              <div className="flex justify-center gap-2 sm:gap-4">
                {([
                  { val: remaining.days, label: 'Ngày' },
                  { val: remaining.hours, label: 'Giờ' },
                  { val: remaining.minutes, label: 'Phút' },
                  { val: remaining.seconds, label: 'Giây' },
                ] as const).map(({ val, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <div
                      className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl text-2xl sm:text-4xl font-black"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      }}
                    >
                      {String(val).padStart(2, '0')}
                    </div>
                    <span className="text-[9px] sm:text-[10px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search Box — only shown after unlock */}
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div ref={searchRef} className="relative mx-auto max-w-xl">
              <form onSubmit={handleSubmit} className="search-box-wrapper">
                <div className="search-box">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Nhập số báo danh hoặc họ tên..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                    autoComplete="off"
                  />
                  {query && (
                    <button type="button" onClick={clearSearch} className="search-clear">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="search-dropdown"
                  >
                    {searching ? (
                      <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        Đang tìm kiếm...
                      </div>
                    ) : results.length === 0 ? (
                      <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        Không tìm thấy kết quả cho "{query}"
                      </div>
                    ) : (
                      <div className="py-1">
                        {results.map((s) => (
                          <Link
                            key={s.sbd}
                            to={`/student/${s.sbd}`}
                            className="search-result-item"
                            onClick={() => setShowResults(false)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                {s.hoTen}
                              </div>
                              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                SBD: {s.sbd} • {s.lop}
                              </div>
                            </div>
                            {s.tongDiem !== null && (
                              <span className="stat-number text-sm text-emerald-400 flex-shrink-0">
                                {formatScore(s.tongDiem)}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ===== STAT CARDS ===== */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-5 sm:mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4"
      >
        {[
          { icon: Users, label: 'Tổng thí sinh', value: overview.totalStudents, decimals: 0, color: '#10b981' },
          { icon: Activity, label: 'Đã tra cứu', value: overview.totalCrawled, decimals: 0, color: '#14b8a6', suffix: `/${overview.totalStudents}` },
          { icon: TrendingUp, label: 'Điểm trung bình', value: overview.averageScore, decimals: 2, color: '#f59e0b', suffix: 'đ' },
          { icon: Target, label: 'Trung vị', value: overview.medianScore, decimals: 2, color: '#8b5cf6', suffix: 'đ' },
        ].map(({ icon: Icon, label, value, decimals, color, suffix }) => (
          <motion.div key={label} variants={fadeUp} className="card p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
              </div>
            </div>
            <div className="stat-number text-xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
              <CountUp value={value} decimals={decimals} />
              {suffix && (
                <span className="text-xs sm:text-base font-normal" style={{ color: 'var(--text-muted)' }}>
                  {suffix}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid gap-3 sm:gap-6 lg:grid-cols-2 mb-5 sm:mb-8">
        {/* Phổ điểm tổng */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-4 sm:p-6">
          <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            📊 Phổ điểm tổng
          </h2>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="range"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                  formatter={(value) => [`${value} thí sinh`, 'Số lượng']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Phổ điểm TB theo môn — bar ngang */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-4 sm:p-6">
          <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            📈 Điểm trung bình theo môn
          </h2>
          <div style={{ height: Math.max(240, subjectChartData.length * 32) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                  formatter={(value, name) => {
                    if (name === 'avg') return [Number(value).toFixed(2), 'Điểm TB'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                  {subjectChartData.map((entry, i) => (
                    <Cell key={i} fill={getSubjectBarColor(entry.avg)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ===== SUBJECT DETAIL CARDS ===== */}
      {subjectStats.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            📋 Chi tiết theo môn
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {subjectStats.map((s) => (
              <div key={s.subject} className="card p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {s.subjectLabel}
                  </span>
                  <span
                    className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {s.count} TS
                  </span>
                </div>
                <div className="stat-number text-lg sm:text-2xl" style={{ color: getSubjectBarColor(s.average) }}>
                  {s.average.toFixed(2)}
                </div>
                <div className="flex gap-3 mt-1.5 text-[9px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>
                    Cao: <span className="font-semibold text-emerald-400">{s.highest}</span>
                  </span>
                  <span>
                    Thấp: <span className="font-semibold text-red-400">{s.lowest}</span>
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getSubjectBarColor(s.average) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.average / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
