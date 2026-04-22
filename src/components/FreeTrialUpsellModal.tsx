import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Trophy,
  Building2,
  ShieldCheck,
  Zap,
  ChevronRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface FreeTrialUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  tryoutId: string;
  tryoutName: string;
}

const VIP_BENEFITS = [
  {
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Pembahasan Lengkap',
    desc: 'Akses pembahasan detail setiap soal dengan penjelasan mendalam',
  },
  {
    icon: Trophy,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'Leaderboard Nasional',
    desc: 'Lihat peringkat Anda dibanding ribuan peserta se-Indonesia',
  },
  {
    icon: Building2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Cek Formasi & Instansi',
    desc: 'Data formasi CPNS lengkap — filter berdasarkan daerah & kualifikasi',
  },
  {
    icon: ShieldCheck,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Akses Semua Try Out',
    desc: 'Kerjakan semua paket premium tanpa batas sepanjang masa berlaku',
  },
];

const LOCKED_FEATURES = [
  { icon: BookOpen, label: 'Pembahasan' },
  { icon: Trophy, label: 'Leaderboard' },
  { icon: Building2, label: 'Formasi' },
];

export const FreeTrialUpsellModal: React.FC<FreeTrialUpsellModalProps> = ({
  isOpen,
  onClose,
  tryoutId,
  tryoutName,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBuyBundle = () => {
    onClose();
    navigate('/dashboard/tryouts?category=bundling');
  };

  const handleBuySingle = () => {
    onClose();
    navigate(`/dashboard/tryout/${tryoutId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white/70 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pt-7 pb-6 text-white overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-blue-500/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-purple-500/10 rounded-full pointer-events-none" />

          {/* Label */}
          <div className="relative flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
              Upgrade ke VIP
            </span>
          </div>

          {/* Title */}
          <h2 className="relative text-[22px] font-extrabold leading-tight mb-1.5">
            Buka Fitur Lengkap
            <br />
            <span className="text-blue-300">KelasASN Premium</span>
          </h2>
          <p className="relative text-[13px] text-slate-300 leading-relaxed">
            Pembahasan &amp; leaderboard untuk{' '}
            <span className="font-semibold text-white">"{tryoutName}"</span>{' '}
            hanya tersedia untuk pengguna VIP.
          </p>

          {/* ── Locked features strip ── */}
          <div className="relative mt-5 grid grid-cols-3 gap-2">
            {LOCKED_FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="relative flex flex-col items-center gap-2 py-3 bg-white/10 rounded-xl border border-white/10"
              >
                {/* Lock badge — pojok kanan atas block, bukan overlay icon */}
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 text-slate-900" />
                </div>

                {/* Icon utama — bersih tanpa overlap */}
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-200" />
                </div>

                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Benefits list ── */}
        <div className="px-6 pt-5 pb-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Yang kamu dapatkan
          </p>
          <div className="space-y-3">
            {VIP_BENEFITS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                {/* Icon box — sejajar vertikal */}
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">{title}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="px-6 pb-6 pt-2 space-y-2">
          {/* Primary: VIP Bundle */}
          <button
            onClick={handleBuyBundle}
            className="w-full bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800 text-white rounded-xl h-12 font-bold text-sm transition-all shadow-lg shadow-slate-900/20 flex items-center px-4 gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-left">Beli Paket VIP All-Access</span>
            <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
          </button>

          {/* Secondary: Single tryout */}
          <button
            onClick={handleBuySingle}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl h-11 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Beli Paket Try Out Ini Saja
          </button>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 text-xs font-medium py-2 transition-colors"
          >
            Tutup &amp; lihat hasil dulu →
          </button>
        </div>
      </div>
    </div>
  );
};
