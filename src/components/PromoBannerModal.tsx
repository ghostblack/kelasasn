import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import { getPromoBanner, PromoBanner } from '@/services/promoBannerService';
import { useAuth } from '@/contexts/AuthContext';

// Key di sessionStorage menyimpan UID yang sudah ditampilkan bannernya di sesi ini
const SESSION_KEY = 'promo_shown_uid';
const SHOW_DELAY_MS = 1200;

export function PromoBannerModal() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Simpan uid sebelumnya untuk mendeteksi "fresh login"
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;

    const currentUid = user && !isAdmin ? user.uid : null;
    const prevUid = prevUidRef.current;

    // Pertama kali render setelah mount
    const isFirstRender = prevUid === undefined;

    // Deteksi fresh login: sebelumnya null/undefined → sekarang ada UID
    const isFreshLogin = !isFirstRender && prevUid === null && currentUid !== null;

    // Jika fresh login → hapus flag sesi lama agar banner muncul lagi
    if (isFreshLogin) {
      sessionStorage.removeItem(SESSION_KEY);
    }

    // Update ref
    prevUidRef.current = currentUid;

    // Jangan tampilkan jika bukan user login biasa
    if (!currentUid) return;

    // Cek apakah sudah ditampilkan untuk UID ini di sesi tab ini
    if (sessionStorage.getItem(SESSION_KEY) === currentUid) return;

    // Tunda agar tidak mengganggu loading halaman
    const timer = setTimeout(() => {
      getPromoBanner().then((data) => {
        if (data.isActive && data.imageUrl) {
          setBanner(data);
          setVisible(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimIn(true));
          });
        }
      });
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user, isAdmin, authLoading]);

  const handleClose = () => {
    setAnimIn(false);
    // Simpan UID → banner tidak muncul lagi selama tab ini terbuka untuk user ini
    if (user) sessionStorage.setItem(SESSION_KEY, user.uid);
    setTimeout(() => setVisible(false), 300);
  };

  const handleBannerClick = () => {
    if (!banner) return;
    if (banner.linkTarget === 'tryouts_page') {
      handleClose();
      navigate('/dashboard/tryouts?category=bundling');
    } else if (banner.linkTarget === 'tryout_detail' && banner.linkTryoutId) {
      handleClose();
      navigate(`/dashboard/tryout/${banner.linkTryoutId}`);
    }
  };

  const isClickable = banner?.linkTarget && banner.linkTarget !== 'none';

  if (!visible || !banner) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-5 transition-all duration-300 ${
        animIn ? 'bg-black/30 backdrop-blur-[2px]' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      {/* Modal box */}
      <div
        className={`relative transition-all duration-300 ${
          animIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol close */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
          aria-label="Tutup iklan"
        >
          <X className="h-3.5 w-3.5 text-gray-500" />
        </button>

        {/* Gambar iklan — lebar maksimum 380px, tinggi maks 70vh */}
        <div
          className={`rounded-2xl overflow-hidden shadow-xl relative group ${
            isClickable ? 'cursor-pointer' : 'cursor-default'
          }`}
          onClick={isClickable ? handleBannerClick : undefined}
        >
          {!imgError ? (
            <>
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Promo KelasASN'}
                className="block rounded-2xl w-auto h-auto"
                style={{ maxWidth: 'min(380px, 88vw)', maxHeight: '68vh', objectFit: 'contain' }}
                onError={() => setImgError(true)}
                draggable={false}
              />
              {/* Hover overlay saat clickable */}
              {isClickable && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors rounded-2xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                    <ExternalLink className="h-3 w-3 text-blue-600" />
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Lihat Paket</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 bg-gray-700 rounded-2xl text-gray-300 p-8">
              <span className="text-4xl">🖼️</span>
              <p className="text-xs font-bold text-center uppercase tracking-widest">Gambar tidak dapat dimuat</p>
            </div>
          )}
        </div>

        {/* Aksi di bawah gambar */}
        <div className="flex items-center justify-center gap-3 mt-3">
          {isClickable && (
            <button
              onClick={handleBannerClick}
              className="text-white text-[11px] font-bold uppercase tracking-widest bg-blue-600/90 hover:bg-blue-700 transition-colors px-4 py-1.5 rounded-full shadow-md backdrop-blur-sm"
            >
              Lihat Paket →
            </button>
          )}
          <button
            className="text-white/70 text-[11px] font-semibold uppercase tracking-widest hover:text-white transition-colors"
            onClick={handleClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
