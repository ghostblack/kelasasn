import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Chrome as Home, FileText, Trophy, User, LogOut, Menu, X, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPayments } from '@/services/paymentService';

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { icon: Home, label: 'Beranda', path: '/dashboard' },
  { icon: FileText, label: 'Mulai Belajar', path: '/dashboard/tryouts' },
  { icon: Receipt, label: 'Riwayat Pembayaran', path: '/dashboard/payment-history' },
  { icon: Trophy, label: 'Ranking', path: '/dashboard/ranking' },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadPendingPayments = async () => {
      try {
        const payments = await getUserPayments(user.uid);
        const now = new Date();
        const pending = payments.filter(
          p => p.status === 'UNPAID' && now <= p.expiredTime
        ).length;
        setPendingPaymentCount(pending);
      } catch (error) {
        console.error('Error loading pending payments:', error);
      }
    };

    loadPendingPayments();

    const interval = setInterval(loadPendingPayments, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white border-b border-gray-200'
            : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center">
              <img
                src="/Frame 1321314500.svg"
                alt="Kelas ASN"
                className="h-10 w-10"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const active = isActivePath(item.path);
                const isPendingPayment = item.path === '/dashboard/payment-history' && pendingPaymentCount > 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isPendingPayment && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingPaymentCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="hidden lg:flex">
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 cursor-pointer">
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.path);
                const isPendingPayment = item.path === '/dashboard/payment-history' && pendingPaymentCount > 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {isPendingPayment && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingPaymentCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
                <button
                  onClick={() => {
                    navigate('/dashboard/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
