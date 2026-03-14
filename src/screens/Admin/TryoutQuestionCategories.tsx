import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, CircleCheck as CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTryoutById } from '@/services/tryoutService';
import { getQuestionsForTryoutDisplaying } from '@/services/questionService';
import { useToast } from '@/hooks/use-toast';

export const TryoutQuestionCategories: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tryoutName, setTryoutName] = useState('');
  const [categories, setCategories] = useState([
    {
      title: 'TWK - Tes Wawasan Kebangsaan',
      description: 'Input soal tentang wawasan kebangsaan',
      targetCount: 30,
      currentCount: 0,
      color: 'bg-blue-600',
      route: 'twk',
    },
    {
      title: 'TIU - Tes Intelegensia Umum',
      description: 'Input soal tentang kemampuan verbal, numerik, dan figural',
      targetCount: 35,
      currentCount: 0,
      color: 'bg-purple-600',
      route: 'tiu',
    },
    {
      title: 'TKP - Tes Karakteristik Pribadi',
      description: 'Input soal tentang karakteristik pribadi',
      targetCount: 35,
      currentCount: 0,
      color: 'bg-orange-600',
      route: 'tkp',
    },
  ]);

  useEffect(() => {
    loadTryoutData();
  }, [tryoutId]);

  const loadTryoutData = async () => {
    if (!tryoutId) return;

    try {
      setLoading(true);
      const tryout = await getTryoutById(tryoutId);
      if (!tryout) {
        toast({
          title: 'Error',
          description: 'Try out tidak ditemukan',
          variant: 'destructive',
        });
        navigate('/admin/tryouts');
        return;
      }

      setTryoutName(tryout.name);

      const twkQuestions = await getQuestionsForTryoutDisplaying(tryoutId, 'TWK');
      const tiuQuestions = await getQuestionsForTryoutDisplaying(tryoutId, 'TIU');
      const tkpQuestions = await getQuestionsForTryoutDisplaying(tryoutId, 'TKP');

      setCategories([
        {
          title: 'TWK - Tes Wawasan Kebangsaan',
          description: 'Input soal tentang wawasan kebangsaan',
          targetCount: tryout.twkQuestions,
          currentCount: twkQuestions.length,
          color: 'bg-blue-600',
          route: 'twk',
        },
        {
          title: 'TIU - Tes Intelegensia Umum',
          description: 'Input soal tentang kemampuan verbal, numerik, dan figural',
          targetCount: tryout.tiuQuestions,
          currentCount: tiuQuestions.length,
          color: 'bg-purple-600',
          route: 'tiu',
        },
        {
          title: 'TKP - Tes Karakteristik Pribadi',
          description: 'Input soal tentang karakteristik pribadi',
          targetCount: tryout.tkpQuestions,
          currentCount: tkpQuestions.length,
          color: 'bg-orange-600',
          route: 'tkp',
        },
      ]);
    } catch (error) {
      console.error('Error loading tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data try out',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalProgress =
    categories.reduce((sum, cat) => sum + cat.targetCount, 0) > 0
      ? categories.reduce((sum, cat) => sum + cat.currentCount, 0) /
        categories.reduce((sum, cat) => sum + cat.targetCount, 0)
      : 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/tryouts')}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Input Soal Try Out</h1>
              <p className="text-sm text-slate-600 mt-1">
                {tryoutName} - Pilih kategori soal untuk mulai input
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Total Progress: {(totalProgress * 100).toFixed(0)}%
          </Badge>
        </motion.div>

        <div className="space-y-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.route}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          category.currentCount >= category.targetCount ? 'bg-green-600' : category.color
                        }`}
                      >
                        {category.currentCount >= category.targetCount ? (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : (
                          <FileText className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">{category.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant={category.currentCount >= category.targetCount ? 'default' : 'secondary'}
                      className={category.currentCount >= category.targetCount ? 'bg-green-600' : 'bg-gray-400'}
                    >
                      {category.currentCount} / {category.targetCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span className="font-medium">
                          {Math.min((category.currentCount / category.targetCount) * 100, 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            category.currentCount >= category.targetCount ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${Math.min((category.currentCount / category.targetCount) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 ${category.color.replace('bg-', 'bg-')} hover:opacity-90`}
                        onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category.route}/input`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Input Soal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category.route}/list`)}
                      >
                        Lihat Daftar ({category.currentCount})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center p-6 bg-white border border-gray-200 rounded-lg"
        >
          <div>
            <p className="text-sm text-gray-600">
              Setelah semua soal terisi, Anda dapat menyimpan dan mengaktifkan try out
            </p>
          </div>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => navigate('/admin/tryouts')}
          >
            Selesai & Kembali
          </Button>
        </motion.div>
    </div>
  );
};
