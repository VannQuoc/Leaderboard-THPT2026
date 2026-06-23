import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArrowLeft, User, BookOpen, MapPin, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import { formatScore, getRankBadge, getActiveSubjects, getScoreColor } from '../lib/utils';
import type { Student, StatsOverview } from '../lib/types';

export default function StudentPage() {
  const { sbd } = useParams<{ sbd: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sbd) return;
    setLoading(true);
    Promise.all([
      api.students.get(sbd).then((r) => setStudent(r.data)),
      api.stats.overview().then((r) => setOverview(r.data)),
    ])
      .catch(() => setError('Không tìm thấy thí sinh'))
      .finally(() => setLoading(false));
  }, [sbd]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Không tìm thấy</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thí sinh với SBD "{sbd}" không tồn tại.</p>
        <Link to="/leaderboard" className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
      </div>
    );
  }

  const badge = getRankBadge(student.rank);
  const subjects = getActiveSubjects(student.scores);
  const radarData = subjects.map((s) => ({ subject: s.label, score: s.value, fullMark: 10 }));

  return (
    <div className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/leaderboard" className="mb-4 inline-flex items-center gap-1.5 text-xs sm:text-sm transition-colors hover:text-emerald-400" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
        </Link>
      </motion.div>

      {/* Mobile: single column / Desktop: 2 columns */}
      <div className="grid gap-3 sm:gap-6 lg:grid-cols-5">
        {/* Student Info Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-4 sm:p-6 lg:col-span-2">
          {/* Header - name + score */}
          <div className="flex items-start gap-3 sm:block sm:text-center mb-4">
            <div className="flex h-12 w-12 sm:mx-auto sm:mb-4 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
              <User className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
            </div>
            <div className="min-w-0 flex-1 sm:flex-none">
              <h1 className="text-lg sm:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{student.hoTen}</h1>
              {badge && <span className={`badge mt-1 sm:mt-2 ${badge.className}`}>{badge.label}</span>}
            </div>
          </div>

          {/* Info grid — compact */}
          <div className="grid grid-cols-2 gap-1.5 sm:space-y-2 sm:grid-cols-1">
            {[
              { icon: BookOpen, label: 'SBD', value: student.sbd },
              { icon: MapPin, label: 'Lớp', value: student.lop },
              { icon: MapPin, label: 'Phòng', value: `P.${student.phongThi}` },
              { icon: Calendar, label: 'Sinh', value: student.ngaySinh },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg p-2 sm:p-2.5" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span className="ml-auto text-[10px] sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Total Score */}
          <div className="mt-3 sm:mt-6 rounded-xl p-3 sm:p-4 text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tổng điểm</span>
            <div className="stat-number text-2xl sm:text-4xl text-emerald-400 mt-0.5">{formatScore(student.tongDiem)}</div>
            {student.rank && (
              <span className="text-[10px] sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                Xếp hạng {student.rank}/{overview?.totalStudents ?? '—'}
              </span>
            )}
          </div>
        </motion.div>

        {/* Scores Detail */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4 sm:p-6 lg:col-span-3">
          <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>Điểm thành phần</h2>

          {/* Radar Chart — smaller on mobile */}
          {radarData.length > 2 && (
            <div className="h-44 sm:h-64 mb-4 sm:mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                  <Radar name="Điểm" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score bars */}
          <div className="space-y-2 sm:space-y-3">
            {subjects.map(({ key, label, value }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className={`stat-number text-xs sm:text-sm ${getScoreColor(value)}`}>{formatScore(value)}</span>
                </div>
                <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #10b981, #14b8a6)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          {overview && student.tongDiem && (
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="text-[10px] sm:text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>So sánh với TB trường</h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="stat-number text-lg sm:text-2xl text-emerald-400">{formatScore(student.tongDiem)}</div>
                  <span className="text-[9px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Của bạn</span>
                </div>
                <div className="text-lg sm:text-2xl" style={{ color: 'var(--text-muted)' }}>vs</div>
                <div className="text-center">
                  <div className="stat-number text-lg sm:text-2xl" style={{ color: 'var(--text-secondary)' }}>{overview.averageScore.toFixed(2)}</div>
                  <span className="text-[9px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>TB trường</span>
                </div>
                <div className="ml-auto text-right">
                  {student.tongDiem > overview.averageScore ? (
                    <span className="text-sm sm:text-base text-emerald-400 font-semibold">+{(student.tongDiem - overview.averageScore).toFixed(2)} ↑</span>
                  ) : (
                    <span className="text-sm sm:text-base text-red-400 font-semibold">{(student.tongDiem - overview.averageScore).toFixed(2)} ↓</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
