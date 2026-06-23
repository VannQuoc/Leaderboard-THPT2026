import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Trophy, TrendingUp, TrendingDown, ArrowRight, Award } from 'lucide-react';
import { api } from '../lib/api';
import { formatScore, getRankBadge, getActiveSubjects, getScoreColor } from '../lib/utils';
import type { StatsOverview, ScoreDistribution, Student, SubjectStats } from '../lib/types';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function CountUp({ value, decimals = 2, duration = 1.5 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * value;
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}

function StatCard({ icon: Icon, label, value, suffix, color }: {
  icon: typeof Users;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <motion.div variants={item} className="card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div className="stat-number text-3xl" style={{ color: 'var(--text-primary)' }}>
        <CountUp value={value} decimals={value % 1 === 0 ? 0 : 2} />
        {suffix && <span className="text-lg font-normal" style={{ color: 'var(--text-muted)' }}> {suffix}</span>}
      </div>
    </motion.div>
  );
}

const BAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#10b981', '#059669'];

export default function DashboardPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution[]>([]);
  const [topStudents, setTopStudents] = useState<Student[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);

  useEffect(() => {
    Promise.all([
      api.stats.overview().then((r) => setOverview(r.data)),
      api.stats.distribution().then((r) => setDistribution(r.data)),
      api.stats.bySubject().then((r) => setSubjectStats(r.data)),
      api.students.list({ limit: '10', sort: 'tongDiem', order: 'desc' }).then((r) => setTopStudents(r.data)),
    ]).catch(console.error);
  }, []);

  if (!overview) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-black sm:text-5xl">
          <span className="gradient-text">Bảng Xếp Hạng</span>
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
          Trường THPT Lý Tự Trọng — Kỳ thi tốt nghiệp THPT 2026
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Tổng thí sinh" value={overview.totalStudents} color="bg-emerald-600" />
        <StatCard icon={Trophy} label="Điểm cao nhất" value={overview.highestScore} suffix="điểm" color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Điểm trung bình" value={overview.averageScore} suffix="điểm" color="bg-teal-600" />
        <StatCard icon={TrendingDown} label="Điểm thấp nhất" value={overview.lowestScore} suffix="điểm" color="bg-red-500/80" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Distribution Chart */}
        <motion.div variants={item} initial="hidden" animate="show" className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Phân bố tổng điểm</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => [`${value} thí sinh`, 'Số lượng']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Student (Thủ khoa) */}
        {overview.topStudent && (
          <motion.div variants={item} initial="hidden" animate="show" className="card p-6">
            <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>🏆 Thủ Khoa</h2>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {overview.topStudent.hoTen}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                SBD: {overview.topStudent.sbd} — Lớp {overview.topStudent.lop}
              </p>
              <div className="mt-3 stat-number text-4xl text-amber-400">
                <CountUp value={overview.topStudent.tongDiem ?? 0} />
                <span className="text-base font-normal" style={{ color: 'var(--text-muted)' }}> điểm</span>
              </div>
              {overview.topStudent.scores && (
                <div className="mt-4 space-y-2">
                  {getActiveSubjects(overview.topStudent.scores).map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className={`font-semibold ${getScoreColor(value)}`}>{formatScore(value)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to={`/student/${overview.topStudent.sbd}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Xem chi tiết <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subject Stats */}
      {subjectStats.length > 0 && (
        <motion.div variants={item} initial="hidden" animate="show" className="card mt-6 p-6">
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Thống kê theo môn thi</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectStats.map((s) => (
              <div key={s.subject} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.subjectLabel}</span>
                  <span className="badge badge-accent">{s.count} TS</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="stat-number text-2xl text-emerald-400">{s.average.toFixed(2)}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>TB</span>
                </div>
                <div className="mt-1 flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>Cao: <span className="text-emerald-400 font-semibold">{s.highest}</span></span>
                  <span>Thấp: <span className="text-red-400 font-semibold">{s.lowest}</span></span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top 10 Table */}
      <motion.div variants={item} initial="hidden" animate="show" className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Top 10 điểm cao nhất</h2>
          <Link
            to="/leaderboard"
            className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>#</th>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Thí sinh</th>
                <th className="px-6 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Lớp</th>
                <th className="px-6 py-3 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Tổng điểm</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s) => {
                const badge = getRankBadge(s.rank);
                return (
                  <tr key={s.sbd} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-6 py-3">
                      {badge ? (
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      ) : (
                        <span className="stat-number" style={{ color: 'var(--text-muted)' }}>{s.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Link to={`/student/${s.sbd}`} className="hover:text-emerald-400 transition-colors">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.hoTen}</span>
                        <br />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SBD: {s.sbd}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-3" style={{ color: 'var(--text-secondary)' }}>{s.lop}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="stat-number text-lg text-emerald-400">{formatScore(s.tongDiem)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
