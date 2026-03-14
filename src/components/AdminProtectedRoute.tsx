import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        console.log('AdminProtectedRoute: No user found');
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        console.log('AdminProtectedRoute: Checking admin status for user:', user.uid);
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        const adminStatus = adminDoc.exists() && adminDoc.data()?.role === 'admin';
        console.log('AdminProtectedRoute: Admin status:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('AdminProtectedRoute: Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAdmin();
    }
  }, [user, loading]);

  useEffect(() => {
    console.log('AdminProtectedRoute:', {
      loading,
      checking,
      hasUser: !!user,
      isAdmin,
      path: location.pathname
    });
  }, [loading, checking, user, isAdmin, location]);

  if (loading || checking) {
    console.log('AdminProtectedRoute: Still loading/checking');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    console.log('AdminProtectedRoute: Not authorized, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('AdminProtectedRoute: Admin authenticated, rendering protected content');
  return <>{children}</>;
};
