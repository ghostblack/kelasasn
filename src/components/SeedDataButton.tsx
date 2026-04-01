import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { seedAllData } from '@/utils/seedData';
import { Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SeedDataButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  // Only show in development AND if user is admin
  // Or if you want it strictly for dev, just check import.meta.env.DEV
  if (!import.meta.env.DEV || !isAdmin) {
    return null;
  }

  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedAllData();
      toast({
        title: 'Berhasil!',
        description: 'Data berhasil di-seed ke database',
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: 'Error',
        description: 'Gagal melakukan seed data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeedData}
      disabled={loading}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      <Database className="mr-2 h-4 w-4" />
      {loading ? 'Seeding...' : 'Seed Data'}
    </Button>
  );
};
