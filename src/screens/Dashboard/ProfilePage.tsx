import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingScreen } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Save, CheckCircle2, XCircle, Calendar, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserProfile, createUserProfile } from '@/services/userService';
import { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

export const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      let userProfile = await getUserProfile(user.uid);

      if (!userProfile) {
        await createUserProfile(
          user.uid,
          user.email || '',
          user.displayName || user.email?.split('@')[0] || ''
        );
        userProfile = await getUserProfile(user.uid);
      }

      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName || '',
          phoneNumber: userProfile.phoneNumber || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, formData);

      await updateProfile(user, {
        displayName: formData.displayName,
      });

      toast({
        title: 'Berhasil!',
        description: 'Profil berhasil diperbarui',
      });

      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui profil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat profil..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-xl p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col items-center space-y-4 lg:border-r lg:border-gray-200 lg:pr-8">
            <Avatar className="h-32 w-32 border-4 border-gray-100">
              <AvatarFallback className="bg-blue-600 text-white text-4xl font-medium">
                {formData.displayName
                  ? formData.displayName.split(' ').slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()
                  : user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {formData.displayName || 'User'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
            {user?.emailVerified ? (
              <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Terverifikasi
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <XCircle className="h-3 w-3 mr-1" />
                Belum Terverifikasi
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Informasi Pribadi</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="displayName"
                      placeholder="Masukkan nama lengkap"
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value })
                      }
                      className="pl-9 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-9 h-10 bg-gray-50 border-gray-200 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                    Nomor Telepon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="Contoh: 08123456789"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                      className="pl-9 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Bergabung</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">Terakhir Diperbarui</p>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {profile?.updatedAt
                        ? new Date(profile.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 sm:col-span-2">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Hash className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500">User ID</p>
                    <p className="text-sm text-gray-900 mt-0.5 font-mono truncate">
                      {user?.uid}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
              >
                {saving ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
