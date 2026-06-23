import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Trophy, TrendingUp, BarChart3, ArrowRight, Crown, School, DoorOpen } from 'lucide-react';
import { api } from '../lib/api';
import { formatScore, getScoreColor } from '../lib/utils';
import type { StatsOverview, ScoreDistribution, Student, SubjectStats, TopByKhoi, RankingEntry } from '../lib/types';
import ScratchRevealCard from '../components/ScratchRevealCard';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
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

const BAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#10b981', '#059669'];

export default function DashboardPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution[]>([]);
  const [topStudents, setTopStudents] = useState<Student[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [topByKhoi, setTopByKhoi] = useState<TopByKhoi[]>([]);
  const [topByLop, setTopByLop] = useState<RankingEntry[]>([]);
  const [topByPhong, setTopByPhong] = useState<RankingEntry[]>([]);
  const [khoiTab, setKhoiTab] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      api.stats.overview().then((r) => setOverview(r.data)),
      api.stats.distribution().then((r) => setDistribution(r.data)),
      api.stats.bySubject().then((r) => setSubjectStats(r.data)),
      api.stats.topByKhoi().then((r) => setTopByKhoi(r.data)),
      api.stats.topByLop().then((r) => setTopByLop(r.data)),
      api.stats.topByPhong().then((r) => setTopByPhong(r.data)),
      api.students.list({ limit: '10', sort: 'tongDiem', order: 'desc' }).then((r) => setTopStudents(r.data)),
    ]).catch(console.error);
  }, []);

  if (!overview) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const khoiGroups = [...new Set(topByKhoi.map((k) => k.khoi.group))].sort();
  const filteredKhoi = khoiTab === 'all' ? topByKhoi : topByKhoi.filter((k) => k.khoi.group === khoiTab);

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-8 text-center">
        <h1 className="text-2xl font-black sm:text-4xl lg:text-5xl">
          <span className="gradient-text">Bảng Xếp Hạng</span>
        </h1>
        <p className="mt-1 text-xs sm:text-base" style={{ color: 'var(--text-secondary)' }}>
          Trường THPT Lý Tự Trọng — Kỳ thi tốt nghiệp THPT 2026
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 sm:mb-8 grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { icon: Users, label: 'Thí sinh', value: overview.totalStudents, decimals: 0, color: 'bg-emerald-600' },
          { icon: Trophy, label: 'Điểm cao nhất', value: overview.highestScore, decimals: 2, color: 'bg-amber-500', suffix: 'đ' },
          { icon: TrendingUp, label: 'Điểm TB', value: overview.averageScore, decimals: 2, color: 'bg-teal-600', suffix: 'đ' },
        ].map(({ icon: Icon, label, value, decimals, color, suffix }) => (
          <motion.div key={label} variants={fadeUp} className="card p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-[10px] sm:text-sm font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <div className="stat-number text-lg sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
              <CountUp value={value} decimals={decimals} />
              {suffix && <span className="text-xs sm:text-lg font-normal" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ====== VINH DANH THỦ KHOA — Scratch Cards ====== */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl">🏆</span>
          <h2 className="text-base sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>Vinh Danh</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ScratchRevealCard
            rank={1}
            label="Thủ Khoa"
            student={topStudents[0] ?? null}
            score={topStudents[0]?.tongDiem ?? 0}
            color="#fbbf24"
            gradientFrom="#b45309"
            gradientTo="#d97706"
            emoji="🥇"
            delay={0.1}
          />
          <ScratchRevealCard
            rank={2}
            label="Á Khoa"
            student={topStudents[1] ?? null}
            score={topStudents[1]?.tongDiem ?? 0}
            color="#9ca3af"
            gradientFrom="#4b5563"
            gradientTo="#6b7280"
            emoji="🥈"
            delay={0.2}
          />
          <ScratchRevealCard
            rank={3}
            label="Tam Khoa"
            student={topStudents[2] ?? null}
            score={topStudents[2]?.tongDiem ?? 0}
            color="#b45309"
            gradientFrom="#78350f"
            gradientTo="#92400e"
            emoji="🥉"
            delay={0.3}
          />
        </div>
      </motion.div>

      {/* ====== THỦ KHOA THEO KHỐI ====== */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-5 w-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Thủ khoa theo khối</h2>
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {topByKhoi.length} khối
          </span>
        </div>
        {/* Group tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setKhoiTab('all')}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
              khoiTab === 'all' ? 'bg-emerald-600 text-white' : ''
            }`}
            style={khoiTab !== 'all' ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
          >
            Tất cả ({topByKhoi.length})
          </button>
          {khoiGroups.map((g) => {
            const count = topByKhoi.filter((k) => k.khoi.group === g).length;
            return (
              <button
                key={g}
                onClick={() => setKhoiTab(g)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
                  khoiTab === g ? 'bg-emerald-600 text-white' : ''
                }`}
                style={khoiTab !== g ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
              >
                Nhóm {g} ({count})
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {filteredKhoi.map((item) => (
            <motion.div
              key={item.khoi.code}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-3 sm:p-4 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white text-[10px] sm:text-xs font-black"
                  style={{ backgroundColor: item.khoi.color }}
                >
                  {item.khoi.code}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] sm:text-xs font-medium block truncate" style={{ color: 'var(--text-secondary)' }}>{item.khoi.name}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.studentCount} TS</span>
                </div>
                <span className="stat-number text-sm sm:text-base" style={{ color: item.khoi.color }}>{item.topScore.toFixed(2)}</span>
              </div>
              {item.topStudent && (
                <Link to={`/student/${item.topStudent.sbd}`} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <span className="text-xs">🏅</span>
                  <span className="text-xs sm:text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {item.topStudent.hoTen}
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{item.topStudent.lop}</span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ====== THỦ KHOA THEO LỚP + PHÒNG ====== */}
      <div className="grid gap-3 sm:gap-6 lg:grid-cols-2 mb-5 sm:mb-8">
        {/* By Lớp */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <School className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>Thủ khoa theo lớp</h2>
          </div>
          <div className="space-y-1.5">
            {topByLop.map((r) => (
              <div key={r.label} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <span className="text-[11px] sm:text-xs font-bold w-12 sm:w-14" style={{ color: 'var(--accent)' }}>{r.label}</span>
                {r.topStudent ? (
                  <Link to={`/student/${r.topStudent.sbd}`} className="flex-1 min-w-0 flex items-center gap-2 group">
                    <span className="text-xs sm:text-sm font-medium truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {r.topStudent.hoTen}
                    </span>
                    <span className="ml-auto stat-number text-xs sm:text-sm text-emerald-400 flex-shrink-0">{r.topScore.toFixed(2)}</span>
                  </Link>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* By Phòng */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <DoorOpen className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>Thủ khoa theo phòng thi</h2>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {topByPhong.map((r) => (
              <div key={r.label} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <span className="text-[10px] sm:text-xs font-bold w-16" style={{ color: 'var(--accent)' }}>{r.label}</span>
                {r.topStudent ? (
                  <Link to={`/student/${r.topStudent.sbd}`} className="flex-1 min-w-0 flex items-center gap-2 group">
                    <span className="text-xs font-medium truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {r.topStudent.hoTen}
                    </span>
                    <span className="ml-auto stat-number text-xs text-emerald-400 flex-shrink-0">{r.topScore.toFixed(2)}</span>
                  </Link>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Chart + Quick stats */}
      <div className="grid gap-3 sm:gap-6 lg:grid-cols-3 mb-5 sm:mb-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-3 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="inline h-4 w-4 mr-1.5 align-text-bottom" style={{ color: 'var(--text-muted)' }} />
            Phân bố tổng điểm
          </h2>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} barCategoryGap="15%">
                <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: 12 }}
                  formatter={(value: number) => [`${value} TS`, 'Số lượng']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-3 sm:p-6 flex flex-col justify-center">
          <h2 className="mb-3 text-sm sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Tổng quan</h2>
          <div className="space-y-3">
            {[
              { label: 'Trung vị', value: overview.medianScore, decimals: 2, color: 'text-teal-400' },
              { label: 'Đã tra cứu', value: overview.totalCrawled, decimals: 0, color: '', suffix: `/${overview.totalStudents}` },
              { label: 'Số khối', value: topByKhoi.length, decimals: 0, color: 'text-amber-400' },
              { label: 'Số lớp', value: topByLop.length, decimals: 0, color: 'text-blue-400' },
            ].map(({ label, value, decimals, color, suffix }) => (
              <div key={label} className="rounded-lg p-2.5 sm:p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <div className={`stat-number text-lg sm:text-2xl mt-0.5 ${color}`} style={!color ? { color: 'var(--text-primary)' } : undefined}>
                  <CountUp value={value} decimals={decimals} />
                  {suffix && <span className="text-xs sm:text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subject Stats */}
      {subjectStats.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card mb-5 sm:mb-8 p-3 sm:p-6">
          <h2 className="mb-3 text-sm sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Thống kê theo môn</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {subjectStats.map((s) => (
              <div key={s.subject} className="rounded-lg p-2.5 sm:p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs sm:text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.subjectLabel}</span>
                  <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>{s.count}</span>
                </div>
                <div className="stat-number text-base sm:text-xl text-emerald-400">{s.average.toFixed(2)}</div>
                <div className="text-[9px] sm:text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Cao: <span className="text-emerald-400 font-semibold">{s.highest}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top 10 */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Top 10 tổng điểm</h2>
          <Link to="/leaderboard" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mobile cards */}
        <div className="space-y-2 sm:hidden">
          {topStudents.map((s, i) => (
            <Link key={s.sbd} to={`/student/${s.sbd}`} className="card block p-3 group">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                  i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' : ''
                }`} style={i > 2 ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' } : undefined}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{s.hoTen}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.lop} • SBD {s.sbd}</div>
                </div>
                <div className="stat-number text-base text-emerald-400">{formatScore(s.tongDiem)}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="card overflow-hidden hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-3 text-left font-semibold w-16" style={{ color: 'var(--text-muted)' }}>#</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Thí sinh</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Lớp</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>Tổng điểm</th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s, i) => (
                <tr key={s.sbd} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <span className={`badge ${i === 0 ? 'badge-gold' : i === 1 ? 'badge-silver' : 'badge-bronze'}`}>
                        {['🥇', '🥈', '🥉'][i]}
                      </span>
                    ) : <span className="stat-number" style={{ color: 'var(--text-muted)' }}>{s.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/student/${s.sbd}`} className="hover:text-emerald-400 transition-colors">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.hoTen}</span>
                      <br /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>SBD: {s.sbd}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.lop}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="stat-number text-lg text-emerald-400">{formatScore(s.tongDiem)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
