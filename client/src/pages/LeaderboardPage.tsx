import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, X } from 'lucide-react';
import { api } from '../lib/api';
import { formatScore, getRankBadge, getScoreColor, getActiveSubjects } from '../lib/utils';
import type { Student } from '../lib/types';

export default function LeaderboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('rank');
  const [order, setOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [phong, setPhong] = useState('');
  const [lop, setLop] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '30', sort, order };
      if (search) params.search = search;
      if (phong) params.phong = phong;
      if (lop) params.lop = lop;

      const res = await api.students.list(params);
      setStudents(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages);
        setTotal(res.meta.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, order, search, phong, lop]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setOrder(key === 'rank' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const hasFilters = !!(phong || lop || search);

  const PHONG_OPTIONS = Array.from({ length: 32 }, (_, i) => 357 + i);
  const LOP_OPTIONS = ['12A1','12A2','12A3','12A4','12A5','12A6','12A7','12A8','12A9','12A10','12A11','12A12','12A13'];

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-3xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>Bảng Xếp Hạng</h1>
        <p className="text-[11px] sm:text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {total} thí sinh — Trường THPT Lý Tự Trọng
        </p>
      </motion.div>

      {/* Search & Filters — mobile-optimized */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card mb-4 p-2.5 sm:p-4">
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm SBD hoặc họ tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border py-2 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm outline-none focus:border-emerald-500 transition-colors"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${hasFilters ? 'border-emerald-500 text-emerald-400' : ''}`}
            style={!hasFilters ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : undefined}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-2.5 flex flex-wrap gap-2 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
            <select
              value={phong}
              onChange={(e) => { setPhong(e.target.value); setPage(1); }}
              className="rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm outline-none focus:border-emerald-500 flex-1 min-w-0 sm:flex-none"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Tất cả phòng</option>
              {PHONG_OPTIONS.map((p) => <option key={p} value={p}>Phòng {p}</option>)}
            </select>
            <select
              value={lop}
              onChange={(e) => { setLop(e.target.value); setPage(1); }}
              className="rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm outline-none focus:border-emerald-500 flex-1 min-w-0 sm:flex-none"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Tất cả lớp</option>
              {LOP_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setPhong(''); setLop(''); setSearch(''); setSearchInput(''); setPage(1); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2"
              >
                <X className="h-3 w-3" /> Xóa
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Sort bar — mobile */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 sm:hidden" style={{ scrollbarWidth: 'none' }}>
        {[
          { key: 'rank', label: 'Hạng' },
          { key: 'tongDiem', label: 'Tổng điểm' },
          { key: 'hoTen', label: 'Tên' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              sort === key ? 'bg-emerald-600 text-white' : ''
            }`}
            style={sort !== key ? { backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' } : undefined}
          >
            {label}
            {sort === key && <ArrowUpDown className="h-2.5 w-2.5" />}
          </button>
        ))}
      </div>

      {/* Mobile: Card list */}
      <div className="space-y-1.5 sm:hidden">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  <div className="h-2.5 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                </div>
                <div className="h-4 w-12 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
              </div>
            </div>
          ))
        ) : students.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Không tìm thấy kết quả</div>
        ) : (
          students.map((s, i) => {
            const badge = getRankBadge(s.rank);
            return (
              <motion.div
                key={s.sbd}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
              >
                <Link to={`/student/${s.sbd}`} className="card block p-3 group active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-2.5">
                    {/* Rank */}
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      badge ? (s.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                              s.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                              'bg-gradient-to-br from-amber-700 to-amber-800 text-white') : ''
                    }`} style={!badge ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' } : undefined}>
                      {s.rank ?? '—'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] truncate group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {s.hoTen}
                      </div>
                      <div className="text-[10px] flex gap-2" style={{ color: 'var(--text-muted)' }}>
                        <span>{s.lop}</span>
                        <span>P.{s.phongThi}</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="stat-number text-sm text-emerald-400">{formatScore(s.tongDiem)}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Desktop: Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="card overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: 'rank', label: '#', className: 'text-left w-16' },
                  { key: 'hoTen', label: 'Thí sinh', className: 'text-left' },
                  { key: '', label: 'Lớp', className: 'text-left' },
                  { key: '', label: 'Phòng', className: 'text-left' },
                  { key: '', label: 'Điểm thành phần', className: 'text-left hidden lg:table-cell' },
                  { key: 'tongDiem', label: 'Tổng điểm', className: 'text-right' },
                ].map(({ key, label, className }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 font-semibold ${key ? 'cursor-pointer select-none hover:text-emerald-400 transition-colors' : ''} ${className}`}
                    style={{ color: sort === key ? 'var(--accent)' : 'var(--text-muted)' }}
                    onClick={key ? () => handleSort(key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sort === key && <ArrowUpDown className="h-3 w-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-elevated)', width: j === 1 ? '160px' : '50px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>Không tìm thấy kết quả</td></tr>
              ) : (
                students.map((s, i) => {
                  const badge = getRankBadge(s.rank);
                  const subjects = getActiveSubjects(s.scores);
                  return (
                    <motion.tr
                      key={s.sbd}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="table-row"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3 w-16">
                        {badge ? <span className={`badge ${badge.className}`}>{badge.label}</span> : <span className="stat-number text-sm" style={{ color: 'var(--text-muted)' }}>{s.rank ?? '—'}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/student/${s.sbd}`} className="group">
                          <span className="font-medium group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{s.hoTen}</span>
                          <br /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>SBD: {s.sbd}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.lop}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.phongThi}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {subjects.map(({ label, value }) => (
                            <span key={label} className={`text-xs font-medium ${getScoreColor(value)}`}>{label}: {value}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="stat-number text-base text-emerald-400">{formatScore(s.tongDiem)}</span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination — touch-friendly */}
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
