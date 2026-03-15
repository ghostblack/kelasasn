import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { bulkCreateQuestions, importQuestionsToTryout } from '@/services/questionService';
import { Question } from '@/types';

interface ImportQuestionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  fixedCategory?: 'TWK' | 'TIU' | 'TKP';
  fixedTryoutId?: string;
}

export const ImportQuestionsDialog: React.FC<ImportQuestionsDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  fixedCategory,
  fixedTryoutId,
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const downloadTemplate = () => {
    try {
      const headers = [
        'Pertanyaan', 
        'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 
        'Gambar Pilihan A', 'Gambar Pilihan B', 'Gambar Pilihan C', 'Gambar Pilihan D', 'Gambar Pilihan E',
        'Jawaban Benar', 
        'Kategori', 'Subkategori', 
        'Bobot', 
        'Pembahasan',
        'Skor A', 'Skor B', 'Skor C', 'Skor D', 'Skor E'
      ];

      const rows = [headers];

      if (!fixedCategory || fixedCategory === 'TWK' || fixedCategory === 'TIU') {
        rows.push([
          `Contoh pertanyaan ${fixedCategory || 'TWK'} (Figural)`,
          'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E',
          'URL_GAMBAR_A', 'URL_GAMBAR_B', 'URL_GAMBAR_C', 'URL_GAMBAR_D', 'URL_GAMBAR_E',
          'a',
          fixedCategory || 'TWK',
          'Figural',
          '5',
          'Pembahasan contoh...',
          '', '', '', '', ''
        ]);
      }

      if (!fixedCategory || fixedCategory === 'TKP') {
        rows.push([
          'Contoh pertanyaan TKP',
          'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E',
          '', '', '', '', '',
          '',
          'TKP',
          'Materi',
          '1',
          'Pembahasan contoh...',
          '5', '4', '3', '2', '1'
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const fileName = `Template_Soal_${fixedCategory || 'KelasASN'}.xlsx`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);

      toast({
        title: 'Berhasil',
        description: 'Template berhasil didownload',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Gagal Download',
        description: 'Terjadi kesalahan saat membuat file Excel',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast({
          title: 'Error',
          description: 'Format file harus Excel (.xlsx, .xls) atau CSV',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!previewData.length) return;

    setImporting(true);
    try {
      const questionsToImport: Omit<Question, 'id'>[] = previewData.map((row: any) => {
        const category = fixedCategory || (row['Kategori'] || 'TWK').toUpperCase() as 'TWK' | 'TIU' | 'TKP';
        
        const question: any = {
          questionText: row['Pertanyaan'] || '',
          options: {
            a: String(row['Opsi A'] || ''),
            b: String(row['Opsi B'] || ''),
            c: String(row['Opsi C'] || ''),
            d: String(row['Opsi D'] || ''),
            e: String(row['Opsi E'] || ''),
          },
          optionImages: {
            a: String(row['Gambar Pilihan A'] || ''),
            b: String(row['Gambar Pilihan B'] || ''),
            c: String(row['Gambar Pilihan C'] || ''),
            d: String(row['Gambar Pilihan D'] || ''),
            e: String(row['Gambar Pilihan E'] || ''),
          },
          category,
          weight: Number(row['Bobot']) || (category === 'TKP' ? 1 : 5),
          explanation: row['Pembahasan'] || '',
          subcategory: row['Subkategori'] || '',
        };

        if (category === 'TKP') {
          question.tkpScoring = {
            a: Number(row['Skor A']) || 0,
            b: Number(row['Skor B']) || 0,
            c: Number(row['Skor C']) || 0,
            d: Number(row['Skor D']) || 0,
            e: Number(row['Skor E']) || 0,
          };
        } else {
          question.correctAnswer = String(row['Jawaban Benar'] || 'a').toLowerCase();
        }

        return question;
      });

      // Simple validation
      const invalidRows = questionsToImport.filter(q => !q.questionText || !q.options.a || !q.options.b);
      if (invalidRows.length > 0) {
        throw new Error(`${invalidRows.length} baris data tidak valid (Pertanyaan atau pilihan A/B kosong)`);
      }

      if (fixedTryoutId && fixedCategory) {
        await importQuestionsToTryout(fixedTryoutId, fixedCategory, questionsToImport);
      } else {
        await bulkCreateQuestions(questionsToImport);
      }

      toast({
        title: 'Berhasil',
        description: `${questionsToImport.length} soal berhasil diimport`,
      });
      
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setPreviewData([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Gagal Import',
        description: error.message || 'Terjadi kesalahan saat memproses file Excel',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-none border-none">
        <DialogHeader className="p-8 bg-gray-900">
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Excel Batch Processor</span>
          </div>
          <DialogTitle className="text-2xl font-black text-white tracking-tight">
            Import <span className="text-gray-400">Soal {fixedCategory || 'Bank'}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-2">
            Unggah file Excel atau CSV untuk memasukkan banyak soal {fixedCategory ? `kategori ${fixedCategory} ` : ''}sekaligus.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50/50 border border-blue-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Step 1: Gunakan Template</h3>
                <p className="text-xs text-blue-700/70 mb-4 leading-relaxed">
                  Gunakan format yang sesuai agar sistem dapat membaca data dengan benar. Jika paket figural (gambar), gunakan kolom **Gambar Pilihan A-E**.
                </p>
                <Button 
                  onClick={downloadTemplate}
                  variant="outline" 
                   className="h-10 rounded-none border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 text-[10px] font-bold uppercase tracking-widest"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Download {fixedCategory || ''} Excel Template
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Step 2: Unggah File</h3>
            <div 
              className={`border-2 border-dashed transition-all p-10 text-center ${
                file ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {file ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                    <p className="text-sm font-bold text-gray-900">{file.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                      {(file.size / 1024).toFixed(2)} KB - {previewData.length} Baris ditemukan
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-900">Klik untuk pilih file Excel</p>
                    <p className="text-xs text-gray-500 mt-1">Atau drag and drop file di sini</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Preview Warning */}
          {previewData.length > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-100 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-[10px] text-orange-800 leading-relaxed italic">
                {fixedCategory 
                  ? `Sistem akan memproses data sesuai kategori ${fixedCategory}. Pastikan kolom Gambar Pilihan sudah terisi URL jika diperlukan.`
                  : "Sistem akan memproses data sesuai kategori. Pastikan format kolom tidak berubah."
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-none h-12 text-[10px] font-bold uppercase tracking-widest"
          >
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="rounded-none h-12 px-8 bg-gray-900 hover:bg-black text-[10px] font-bold uppercase tracking-widest"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              'Mulai Import Soal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
