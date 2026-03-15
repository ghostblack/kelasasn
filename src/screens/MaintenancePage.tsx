import React from 'react';
import { Construction, Instagram, Send } from 'lucide-react';

export const MaintenancePage: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Construction className="w-12 h-12 text-orange-500" />
          </div>
          <div className="absolute -top-1 -right-1 left-0 right-0 mx-auto w-24">
            <div className="w-3 h-3 bg-orange-400 rounded-full absolute -top-1 right-0 animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Sedang Dalam Pemeliharaan
        </h1>

        {/* Message */}
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {message || 'Kami sedang melakukan pemeliharaan sistem untuk meningkatkan kualitas layanan. Silakan coba lagi dalam beberapa saat.'}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Tetap Terhubung</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://www.instagram.com/kelasasn.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-pink-300 hover:text-pink-600 transition-all"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </a>
          <a
            href="https://t.me/KelasASN"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all"
          >
            <Send className="w-4 h-4" />
            Telegram
          </a>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-300 mt-10 font-medium">
          &copy; {new Date().getFullYear()} Kelas ASN. Terima kasih atas kesabarannya.
        </p>
      </div>
    </div>
  );
};
