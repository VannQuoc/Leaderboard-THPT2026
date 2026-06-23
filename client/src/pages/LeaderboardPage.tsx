import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
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
      const params: Record<string, string> = {
        page: String(page),
        limit: '50',
        sort,
        order,
      };
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

  const SortHeader = ({ label, sortKey, className = '' }: { label: string; sortKey: string; className?: string }) => (
    <th
      className={`px-4 py-3 font-semibold cursor-pointer select-none hover:text-emerald-400 transition-colors ${className}`}
      style={{ color: sort === sortKey ? 'var(--accent)' : 'var(--text-muted)' }}
      onClick={() => handleSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sort === sortKey && <ArrowUpDown className="h-3 w-3" />}
      </span>
    </th>
  );

  const PHONG_OPTIONS = Array.from({ length: 32 }, (_, i) => 357 + i);
  const LOP_OPTIONS = ['12A1','12A2','12A3','12A4','12A5','12A6','12A7','12A8','12A9','12A10','12A11','12A12','12A13'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Bảng Xếp Hạng</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {total} thí sinh — Trường THPT Lý Tự Trọng
        </p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Tìm theo SBD hoặc họ tên..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-emerald-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <select
              value={phong}
              onChange={(e) => { setPhong(e.target.value); setPage(1); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Tất cả phòng thi</option>
              {PHONG_OPTIONS.map((p) => (
                <option key={p} value={p}>Phòng {p}</option>
              ))}
            </select>
            <select
              value={lop}
              onChange={(e) => { setLop(e.target.value); setPage(1); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">Tất cả lớp</option>
              {LOP_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {(phong || lop || search) && (
              <button
                onClick={() => { setPhong(''); setLop(''); setSearch(''); setSearchInput(''); setPage(1); }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <SortHeader label="#" sortKey="rank" className="text-left w-16" />
                <SortHeader label="Thí sinh" sortKey="hoTen" className="text-left" />
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Lớp</th>
                <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>Phòng</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Điểm thành phần</th>
                <SortHeader label="Tổng điểm" sortKey="tongDiem" className="text-right" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded" style={{ backgroundColor: 'var(--bg-elevated)', width: j === 1 ? '180px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    Không tìm thấy kết quả
                  </td>
                </tr>
              ) : (
                students.map((s, i) => {
                  const badge = getRankBadge(s.rank);
                  const subjects = getActiveSubjects(s.scores);
                  return (
                    <motion.tr
                      key={s.sbd}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="table-row"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3 w-16">
                        {badge ? (
                          <span className={`badge ${badge.className}`}>{badge.label}</span>
                        ) : (
                          <span className="stat-number text-sm" style={{ color: 'var(--text-muted)' }}>{s.rank ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/student/${s.sbd}`} className="group">
                          <span className="font-medium group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            {s.hoTen}
                          </span>
                          <br />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SBD: {s.sbd}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.lop}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.phongThi}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {subjects.map(({ label, value }) => (
                            <span key={label} className={`text-xs font-medium ${getScoreColor(value)}`}>
                              {label}: {value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="stat-number text-base text-emerald-400">
                          {formatScore(s.tongDiem)}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Trang {page}/{totalPages} ({total} kết quả)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-emerald-500 disabled:opacity-30"
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
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page ? 'bg-emerald-600 text-white' : 'border hover:border-emerald-500'
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-emerald-500 disabled:opacity-30"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
