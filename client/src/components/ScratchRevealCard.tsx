import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';

interface ScratchRevealCardProps {
  rank: 1 | 2 | 3;
  label: string;
  student: { sbd: string; hoTen: string; lop: string; tongDiem: number | null } | null;
  score: number;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
  delay?: number;
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 4,
  delay: Math.random() * 0.3,
}));

export default function ScratchRevealCard({
  label, student, score, color, gradientFrom, gradientTo, emoji, delay = 0,
}: ScratchRevealCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-scratch on touch/click hold
  const startScratch = () => {
    if (revealed) return;
    setScratching(true);
    progressRef.current = 0;
    intervalRef.current = setInterval(() => {
      progressRef.current += 4;
      if (progressRef.current >= 100) {
        clearInterval(intervalRef.current);
        setRevealed(true);
        setScratching(false);
      }
    }, 30);
  };

  const stopScratch = () => {
    clearInterval(intervalRef.current);
    if (!revealed && progressRef.current < 100) {
      // If user released before 100%, auto-complete with quick animation
      if (progressRef.current > 30) {
        const quick = setInterval(() => {
          progressRef.current += 8;
          if (progressRef.current >= 100) {
            clearInterval(quick);
            setRevealed(true);
          }
        }, 20);
      }
      setScratching(false);
    }
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (!student) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`, minHeight: 160 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20" style={{
        background: `radial-gradient(circle at 30% 20%, ${color}, transparent 60%)`,
      }} />

      {/* Content (always rendered, sometimes hidden by overlay) */}
      <div className="relative z-10 p-4 sm:p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl sm:text-3xl">{emoji}</span>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">{label}</span>
        </div>

        <AnimatePresence>
          {revealed && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <Link to={`/student/${student.sbd}`} className="block group">
                  <h3 className="text-lg sm:text-2xl font-black mb-0.5 group-hover:underline">
                    {student.hoTen}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-80">
                    {student.lop} • SBD {student.sbd}
                  </p>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="mt-2 flex items-baseline gap-1.5"
              >
                <span className="text-2xl sm:text-3xl font-black">{score.toFixed(2)}</span>
                <span className="text-xs sm:text-sm opacity-70">điểm</span>
              </motion.div>

              {/* Celebration particles */}
              {PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-white"
                  style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0], y: [-10, -30] }}
                  transition={{ delay: 0.2 + p.delay, duration: 0.8 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Scratch overlay */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 z-20 cursor-pointer select-none flex flex-col items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}dd, ${gradientTo}dd)`, backdropFilter: 'blur(12px)' }}
            onMouseDown={startScratch}
            onMouseUp={stopScratch}
            onMouseLeave={stopScratch}
            onTouchStart={startScratch}
            onTouchEnd={stopScratch}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              animate={scratching ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.3, repeat: scratching ? Infinity : 0 }}
              className="text-center"
            >
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-white/90" />
              <p className="text-white text-xs sm:text-sm font-bold">
                {scratching ? '✨ Đang mở...' : '👆 Giữ để xem'}
              </p>
              <p className="text-white/60 text-[10px] sm:text-xs mt-0.5">{label}</p>
            </motion.div>

            {/* Progress bar */}
            {scratching && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-white/40"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
