import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SessionConflictModalProps {
  isOpen: boolean;
  newDeviceInfo?: {
    deviceType: string;
    browser: string;
  };
  onClose: () => void;
}

export const SessionConflictModal = ({ isOpen, newDeviceInfo, onClose }: SessionConflictModalProps) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(10);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Akun Digunakan Perangkat Lain
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="space-y-4 pt-4">
          <p className="text-sm text-gray-700">
            Akun Anda telah masuk di perangkat lain. Sesi Anda di perangkat ini telah dihentikan untuk keamanan akun.
          </p>

          {newDeviceInfo && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-2 font-semibold text-gray-900">Perangkat Baru:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Tipe Perangkat:</span> {newDeviceInfo.deviceType}
                </p>
                <p>
                  <span className="font-medium">Browser:</span> {newDeviceInfo.browser}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              Jika ini bukan Anda, segera ubah password akun untuk keamanan yang lebih baik.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Halaman akan menutup otomatis dalam <span className="font-bold text-red-600">{timeLeft}</span> detik
            </p>
          </div>
        </DialogDescription>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
