import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { Trophy, GraduationCap, DoorOpen, ChevronLeft, ChevronRight, Sparkles, Eye } from 'lucide-react';
import { api } from '../lib/api';
import { getSubjectLabel } from '../lib/utils';
import type { LeaderboardEntry, KhoiDefinition } from '../lib/types';

type Tab = 'khoi' | 'lop' | 'phong';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as Easing } },
};

const RANK_THEME = {
  1: { label: 'Thủ Khoa', emoji: '🥇', cssClass: 'mystery-card-gold', rowClass: 'mystery-row-gold', gradient: 'from-amber-400 to-amber-600', sparkleColor: '#fbbf24' },
  2: { label: 'Á Khoa', emoji: '🥈', cssClass: 'mystery-card-silver', rowClass: 'mystery-row-silver', gradient: 'from-gray-300 to-gray-500', sparkleColor: '#9ca3af' },
  3: { label: 'Hạng Ba', emoji: '🥉', cssClass: 'mystery-card-bronze', rowClass: 'mystery-row-bronze', gradient: 'from-amber-700 to-amber-900', sparkleColor: '#b45309' },
} as const;

const PHONG_OPTIONS = Array.from({ length: 32 }, (_, i) => 357 + i);
const LOP_OPTIONS = [
  '12A1', '12A2', '12A3', '12A4', '12A5', '12A6', '12A7',
  '12A8', '12A9', '12A10', '12A11', '12A12', '12A13',
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('khoi');
  const [khoiDefs, setKhoiDefs] = useState<KhoiDefinition[]>([]);
  const [selectedKhoi, setSelectedKhoi] = useState('');
  const [selectedLop, setSelectedLop] = useState('12A1');
  const [selectedPhong, setSelectedPhong] = useState(357);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [revealedRanks, setRevealedRanks] = useState<Set<number>>(new Set());

  // Load khối definitions on mount
  useEffect(() => {
    api.stats.khoiDefinitions().then((r) => {
      setKhoiDefs(r.data);
      if (r.data.length > 0) setSelectedKhoi('all');
    }).catch(console.error);
  }, []);

  // Fetch leaderboard data when selection changes
  const fetchData = useCallback(async () => {
    if (!selectedKhoi) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { khoi: selectedKhoi, page: String(page), limit: '30' };

      let res;
      if (tab === 'khoi') {
        res = await api.stats.leaderboardByKhoi(params);
      } else if (tab === 'lop') {
        res = await api.stats.leaderboardByLop({ ...params, lop: selectedLop });
      } else {
        res = await api.stats.leaderboardByPhong({ ...params, phong: String(selectedPhong) });
      }

      setEntries(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch (err) {
      console.error(err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedKhoi, selectedLop, selectedPhong, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when changing tab/filters
  const changeTab = (t: Tab) => { setTab(t); setPage(1); setRevealedRanks(new Set()); };
  const changeKhoi = (code: string) => { setSelectedKhoi(code); setPage(1); setRevealedRanks(new Set()); };
  const changeLop = (lop: string) => { setSelectedLop(lop); setPage(1); setRevealedRanks(new Set()); };
  const changePhong = (phong: number) => { setSelectedPhong(phong); setPage(1); setRevealedRanks(new Set()); };

  const isHidden = (rank: number) => page === 1 && rank <= 3 && !revealedRanks.has(rank);
  const revealRank = (rank: number) => setRevealedRanks((prev) => new Set(prev).add(rank));

  const activeKhoi = khoiDefs.find((k) => k.code === selectedKhoi);
  const khoiGroups = [...new Set(khoiDefs.map((k) => k.group))].sort();

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
          Bảng Xếp Hạng
        </h1>
        <p className="text-[11px] sm:text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Trường THPT Lý Tự Trọng — Xếp hạng theo điểm khối
        </p>
      </motion.div>

      {/* ===== MAIN TABS ===== */}
      <div className="flex gap-1.5 sm:gap-2 mb-4">
        {([
          { key: 'khoi' as Tab, label: 'Theo Khối', icon: Trophy },
          { key: 'lop' as Tab, label: 'Theo Lớp', icon: GraduationCap },
          { key: 'phong' as Tab, label: 'Theo Phòng', icon: DoorOpen },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => changeTab(key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'hover:bg-emerald-500/10'
            }`}
            style={tab !== key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ===== SCOPE SELECTOR (Lớp or Phòng) ===== */}
      {tab === 'lop' && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-3">
          <p className="text-[10px] sm:text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Chọn lớp</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {LOP_OPTIONS.map((lop) => (
              <button
                key={lop}
                onClick={() => changeLop(lop)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                  selectedLop === lop
                    ? 'bg-teal-600 text-white'
                    : ''
                }`}
                style={selectedLop !== lop ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
              >
                {lop}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'phong' && (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-3">
          <p className="text-[10px] sm:text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Chọn phòng thi</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {PHONG_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => changePhong(p)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-all ${
                  selectedPhong === p
                    ? 'bg-teal-600 text-white'
                    : ''
                }`}
                style={selectedPhong !== p ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
              >
                P.{p}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== KHỐI SELECTOR — always visible ===== */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4">
        <p className="text-[10px] sm:text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
          Chọn khối thi
        </p>
        <div className="mb-2">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Chung
          </span>
          <button
            onClick={() => changeKhoi('all')}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
              selectedKhoi === 'all'
                ? 'text-white shadow-lg bg-emerald-600'
                : 'hover:opacity-80'
            }`}
            style={
              selectedKhoi !== 'all'
                ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                : undefined
            }
          >
            Tất cả khối
          </button>
        </div>
        
        {khoiGroups.map((group) => {
          const khoiInGroup = khoiDefs.filter((k) => k.group === group);
          return (
            <div key={group} className="mb-2">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Nhóm {group}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {khoiInGroup.map((k) => (
                  <button
                    key={k.code}
                    onClick={() => changeKhoi(k.code)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
                      selectedKhoi === k.code
                        ? 'text-white shadow-lg'
                        : 'hover:opacity-80'
                    }`}
                    style={
                      selectedKhoi === k.code
                        ? { backgroundColor: k.color, boxShadow: `0 4px 12px ${k.color}40` }
                        : { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                    }
                  >
                    {k.code}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {activeKhoi ? (
        <div className="card px-3 py-2 sm:px-4 sm:py-3 mb-4 flex items-center gap-3">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white text-xs sm:text-sm font-black"
            style={{ backgroundColor: activeKhoi.color }}
          >
            {activeKhoi.code}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
              Khối {activeKhoi.code} — {activeKhoi.name}
            </div>
            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
              {activeKhoi.subjects.map((s) => getSubjectLabel(s)).join(' + ')} • {total} thí sinh
            </div>
          </div>
        </div>
      ) : selectedKhoi === 'all' ? (
        <div className="card px-3 py-2 sm:px-4 sm:py-3 mb-4 flex items-center gap-3">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-white text-xs sm:text-sm font-black bg-emerald-600"
          >
            ALL
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
              Tất cả khối (Điểm Khối Cao Nhất)
            </div>
            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>
              Xếp hạng theo tổng 3 môn cao nhất • {total} thí sinh
            </div>
          </div>
        </div>
      ) : null}

      {/* ===== LEADERBOARD TABLE ===== */}
      {/* Mobile cards */}
      <div className="space-y-1.5 sm:hidden">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  <div className="h-2.5 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Không có thí sinh trong phạm vi này
          </div>
        ) : (
          entries.map((entry, i) => (
            <motion.div
              key={entry.student.sbd}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.015 }}
            >
              <AnimatePresence mode="wait">
                {isHidden(entry.rank) ? (
                  <motion.button
                    key={`hidden-${entry.rank}`}
                    onClick={() => revealRank(entry.rank)}
                    className={`mystery-card ${RANK_THEME[entry.rank as 1|2|3].cssClass} w-full rounded-2xl p-4 text-left`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, rotateX: 15 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {/* Shimmer overlay */}
                    <div className="mystery-shimmer absolute inset-0 rounded-2xl pointer-events-none" />

                    <div className="relative flex items-center gap-3">
                      {/* Rank badge with glow */}
                      <div className="relative">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${RANK_THEME[entry.rank as 1|2|3].gradient} text-white text-lg font-black shadow-lg`}
                        >
                          {RANK_THEME[entry.rank as 1|2|3].emoji}
                        </div>
                        <div
                          className="mystery-glow absolute -inset-1 rounded-xl bg-gradient-to-br opacity-40"
                          style={{ background: `radial-gradient(circle, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}40, transparent)` }}
                        />
                      </div>

                      {/* Mystery content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }}>
                            {RANK_THEME[entry.rank as 1|2|3].label}
                          </span>
                          <Sparkles className="h-3 w-3 mystery-sparkle" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3.5 w-28 rounded-md" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}20, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}08)` }} />
                          <div className="h-3 w-16 rounded-md" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}12, transparent)` }} />
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Eye className="h-4 w-4 mystery-sparkle" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }} />
                        <span className="text-[10px] font-semibold" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }}>Xem</span>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    key={`revealed-${entry.rank}`}
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Link to={`/student/${entry.student.sbd}`} className="card block p-3 group active:scale-[0.98] transition-transform">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            entry.rank <= 3
                              ? entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                              : entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                              : 'bg-gradient-to-br from-amber-700 to-amber-800 text-white'
                              : ''
                          }`}
                          style={entry.rank > 3 ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' } : undefined}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[13px] truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {entry.student.hoTen}
                          </div>
                          <div className="text-[10px] flex gap-2" style={{ color: 'var(--text-muted)' }}>
                            <span>{entry.student.lop}</span>
                            <span>P.{entry.student.phongThi}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="stat-number text-base" style={{ color: activeKhoi?.color || 'var(--accent)' }}>
                            {entry.khoiScore.toFixed(2)}
                            {entry.bestKhoi && <span className="ml-1 text-[10px] bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded font-bold">{entry.bestKhoi}</span>}
                          </div>
                          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            {Object.entries(entry.subjectScores).map(([subj, val]) => `${getSubjectLabel(subj)}: ${val.toFixed(2)}`).join(' • ')}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-4 py-3 text-left font-semibold w-16" style={{ color: 'var(--text-muted)' }}>#</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Thí sinh</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Lớp</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Phòng</th>
                {activeKhoi ? (
                  activeKhoi.subjects.map((subj) => (
                    <th key={subj} className="px-3 py-3 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {getSubjectLabel(subj)}
                    </th>
                  ))
                ) : (
                  <th className="px-3 py-3 text-center font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Điểm chi tiết
                  </th>
                )}
                <th className="px-4 py-3 text-right font-semibold" style={{ color: activeKhoi?.color || 'var(--accent)' }}>
                  Tổng điểm
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 5 + (activeKhoi ? activeKhoi.subjects.length : 1) }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-elevated)', width: j === 1 ? '140px' : '50px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5 + (activeKhoi ? activeKhoi.subjects.length : 1)} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    Không có thí sinh trong phạm vi này
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <motion.tr
                    key={entry.student.sbd}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`table-row ${isHidden(entry.rank) ? `cursor-pointer ${RANK_THEME[entry.rank as 1|2|3]?.rowClass || ''}` : ''}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={isHidden(entry.rank) ? () => revealRank(entry.rank) : undefined}
                  >
                    <td className="px-4 py-3 w-16">
                      {entry.rank <= 3 ? (
                        <span className={`badge ${entry.rank === 1 ? 'badge-gold' : entry.rank === 2 ? 'badge-silver' : 'badge-bronze'}`}>
                          {RANK_THEME[entry.rank as 1|2|3].emoji}
                        </span>
                      ) : (
                        <span className="stat-number text-sm" style={{ color: 'var(--text-muted)' }}>{entry.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isHidden(entry.rank) ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }}>
                                {RANK_THEME[entry.rank as 1|2|3].label}
                              </span>
                              <Sparkles className="h-3 w-3 mystery-sparkle" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-24 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}25, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}08)` }} />
                              <Eye className="h-3.5 w-3.5 mystery-glow" style={{ color: RANK_THEME[entry.rank as 1|2|3].sparkleColor }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}>
                          <Link to={`/student/${entry.student.sbd}`} className="group">
                            <span className="font-medium group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                              {entry.student.hoTen}
                            </span>
                            <br /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>SBD: {entry.student.sbd}</span>
                          </Link>
                        </motion.div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isHidden(entry.rank) ? (
                        <div className="h-3.5 w-10 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}18, transparent)` }} />
                      ) : (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-secondary)' }}>{entry.student.lop}</motion.span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isHidden(entry.rank) ? (
                        <div className="h-3.5 w-8 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}18, transparent)` }} />
                      ) : (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-secondary)' }}>{entry.student.phongThi}</motion.span>
                      )}
                    </td>
                    {activeKhoi ? (
                      activeKhoi.subjects.map((subj) => (
                        <td key={subj} className="px-3 py-3 text-center">
                          {isHidden(entry.rank) ? (
                            <div className="mx-auto h-3.5 w-10 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}15, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}06)` }} />
                          ) : (
                            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="stat-number text-sm" style={{ color: 'var(--text-primary)' }}>
                              {entry.subjectScores[subj]?.toFixed(2) ?? '—'}
                            </motion.span>
                          )}
                        </td>
                      ))
                    ) : (
                      <td className="px-3 py-3 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        {isHidden(entry.rank) ? (
                            <div className="mx-auto h-3.5 w-24 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}15, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}06)` }} />
                        ) : (
                            Object.entries(entry.subjectScores).map(([subj, val]) => `${getSubjectLabel(subj)}: ${val.toFixed(2)}`).join(', ')
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {isHidden(entry.rank) ? (
                        <div className="ml-auto h-4 w-14 rounded" style={{ background: `linear-gradient(90deg, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}20, ${RANK_THEME[entry.rank as 1|2|3].sparkleColor}08)` }} />
                      ) : (
                        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="stat-number text-base flex flex-col items-end" style={{ color: activeKhoi?.color || 'var(--accent)' }}>
                          {entry.khoiScore.toFixed(2)}
                          {entry.bestKhoi && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded font-bold mt-1">{entry.bestKhoi}</span>}
                        </motion.span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[10px] sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {page}/{totalPages} <span className="hidden sm:inline">({total} kết quả)</span>
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border transition-colors active:scale-95 disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = startPage + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors active:scale-95 ${
                    p === page ? 'bg-emerald-600 text-white' : 'border'
                  }`}
                  style={p !== page ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border transition-colors active:scale-95 disabled:opacity-30"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
