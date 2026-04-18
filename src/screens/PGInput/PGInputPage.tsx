import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getInstansi } from '@/services/sscasnService';
import {
  addPassingGrade,
  getAllPassingGrades,
  updatePassingGrade,
  deletePassingGrade,
  passingGradeService,
} from '@/services/passingGradeService';
import {
  PassingGrade,
  PassingGradeInput,
  SKBKomponen,
  FORMASI_NM_OPTIONS,
  SKB_KOMPONEN_PRESETS,
} from '@/types/passingGrade';
import { parsePGFromPDF, ParsedPGRow, ParsedPGResult } from '@/utils/pgPdfParser';
import { useAuth } from '@/contexts/AuthContext';

// ─── Password Gate ─────────────────────────────────────────────────────────────

const PG_PASSWORD = 'kingmu';
const LS_KEY = 'pg_input_unlocked';

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PG_PASSWORD) {
      localStorage.setItem(LS_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={s.gateOverlay}>
      <div style={{ ...s.gateCard, ...(shake ? { transform: 'translateX(-8px)' } : {}) }}>
        <div style={s.gateLock}>🔒</div>
        <h1 style={s.gateTitle}>PG Data Tool</h1>
        <p style={s.gateSubtitle}>Internal — Pengumpulan data Passing Grade CPNS</p>
        <form onSubmit={handleSubmit} style={s.gateForm}>
          <input
            type="password"
            placeholder="Password..."
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{ ...s.gateInput, ...(error ? { borderColor: '#ff6b6b' } : {}) }}
            autoFocus
          />
          {error && <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>Password salah 🙅</p>}
          <button type="submit" style={s.gateBtn}>Masuk →</button>
        </form>
      </div>
    </div>
  );
}

// ─── Empty Form ────────────────────────────────────────────────────────────────

const emptyForm = (): PassingGradeInput => ({
  instansi_kode: '',
  instansi_nm: '',
  kode_jabatan: '',
  jabatan_nm: '',
  pendidikan_nm: '',
  formasi_nm: 'Umum',
  lokasi_nm: '',
  tahun: 2024,
  nilai_skd_twk: null,
  nilai_skd_tiu: null,
  nilai_skd_tkp: null,
  nilai_skd_total: null,
  skb_komponen: [{ nama: 'CAT BKN', nilai: 0 }],
  nilai_skb_total: null,
  nilai_akhir: null,
  sumber_pdf: '',
  catatan: '',
});

// ─── PDF Review Row Component ──────────────────────────────────────────────────

function PdfReviewRow({
  row,
  instansi_kode,
  instansi_nm,
  sumber_pdf,
  tahun,
  checked,
  onCheck,
  onChange,
}: {
  row: ParsedPGRow;
  instansi_kode: string;
  instansi_nm: string;
  sumber_pdf: string;
  tahun: number;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onChange: (updated: ParsedPGRow) => void;
}) {
  return (
    <tr style={{ background: row.is_pg ? '#f0f9ff' : '#fff', transition: 'background 0.2s' }}>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
      </td>
      <td style={{ ...s.td, fontWeight: 700, color: row.is_pg ? '#0984e3' : '#636e72' }}>
        {row.rank}
        {row.is_pg && <span style={s.pgBadge}>PG</span>}
      </td>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <span style={{
          background: (row as any).status === 'PL' ? '#e8f5e9' : '#ffebee',
          color: (row as any).status === 'PL' ? '#2e7d32' : '#c62828',
          borderRadius: 8,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 700,
        }}>
          {(row as any).status ?? '?'}
        </span>
      </td>
      <td style={{ ...s.td, maxWidth: 220, wordBreak: 'break-word', fontSize: 12 }}>
        <input
          style={{ ...s.miniInput, width: '100%' }}
          title={row.jabatan_nm}
          value={row.jabatan_nm}
          onChange={(e) => onChange({ ...row, jabatan_nm: e.target.value })}
        />
      </td>
      <td style={s.td}>
        <input
          style={{ ...s.miniInput, width: 180 }}
          title={row.pendidikan_nm}
          value={row.pendidikan_nm}
          onChange={(e) => onChange({ ...row, pendidikan_nm: e.target.value })}
        />
      </td>
      <td style={s.td}>
        <input
          style={{ ...s.miniInput, width: 100 }}
          title={row.lokasi_nm ?? ''}
          value={row.lokasi_nm ?? ''}
          placeholder="Lokasi"
          onChange={(e) => onChange({ ...row, lokasi_nm: e.target.value })}
        />
      </td>
      <td style={s.td}>
        <input
          style={{ ...s.miniInput, width: 90 }}
          title={row.formasi_nm}
          value={row.formasi_nm}
          placeholder="Formasi"
          onChange={(e) => onChange({ ...row, formasi_nm: e.target.value })}
        />
      </td>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <input
          style={{ ...s.miniInput, width: 52, textAlign: 'center' }}
          type="number"
          value={row.nilai_skd_twk ?? ''}
          onChange={(e) => onChange({ ...row, nilai_skd_twk: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <input
          style={{ ...s.miniInput, width: 52, textAlign: 'center' }}
          type="number"
          value={row.nilai_skd_tiu ?? ''}
          onChange={(e) => onChange({ ...row, nilai_skd_tiu: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <input
          style={{ ...s.miniInput, width: 52, textAlign: 'center' }}
          type="number"
          value={row.nilai_skd_tkp ?? ''}
          onChange={(e) => onChange({ ...row, nilai_skd_tkp: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
      <td style={{ ...s.td, textAlign: 'center', fontWeight: 700 }}>
        {row.nilai_skd_total ?? '—'}
      </td>
      <td style={{ ...s.td, fontSize: 11, color: '#636e72', maxWidth: 120 }}>
        {row.skb_raw || '—'}
      </td>
      <td style={{ ...s.td, textAlign: 'center' }}>
        <input
          style={{ ...s.miniInput, width: 70, textAlign: 'center' }}
          type="number"
          value={row.nilai_skb_total ?? ''}
          onChange={(e) => onChange({ ...row, nilai_skb_total: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
      <td style={{ ...s.td, textAlign: 'center', fontWeight: 700, color: '#6c5ce7' }}>
        <input
          style={{ ...s.miniInput, width: 70, textAlign: 'center', fontWeight: 700, color: '#6c5ce7' }}
          type="number"
          value={row.nilai_akhir ?? ''}
          onChange={(e) => onChange({ ...row, nilai_akhir: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

// ─── Localhost-only guard ─────────────────────────────────────────────────────
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.'));

function LocalhostOnly() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0c29', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Akses Ditolak</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Halaman ini hanya dapat diakses dari localhost.</p>
      </div>
    </div>
  );
}

export function PGInputPage() {
  if (!IS_LOCALHOST) return <LocalhostOnly />;

  // ── ALL HOOKS FIRST (Rules of Hooks: no hooks after conditional returns) ──
  const { isAdmin, user } = useAuth();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(LS_KEY) === '1');

  // State instansi & saved data
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [loadingInstansi, setLoadingInstansi] = useState(false);
  const [pgList, setPgList] = useState<PassingGrade[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [filterInstansi, setFilterInstansi] = useState('');

  // Tab state
  const [tab, setTab] = useState<'scan' | 'manual' | 'list'>('scan');

  // ── PDF Scan state ──
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scanResult, setScanResult] = useState<ParsedPGResult | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanRows, setScanRows] = useState<ParsedPGRow[]>([]);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [scanInstansiKode, setScanInstansiKode] = useState('');
  const [scanInstansiNm, setScanInstansiNm] = useState('');
  const [scanInstansiSearch, setScanInstansiSearch] = useState('');
  const [scanInstansiDropdown, setScanInstansiDropdown] = useState(false);
  const [showOnlyPG, setShowOnlyPG] = useState(true);
  const [showRawText, setShowRawText] = useState(false);
  const [showAllLines, setShowAllLines] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  // Feedback simpan — muncul di dekat tombol
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Manual form state ──
  const [form, setForm] = useState<PassingGradeInput>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [instansiSearch, setInstansiSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [skbPreset, setSkbPreset] = useState('CAT BKN');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Load data ──
  useEffect(() => {
    if (!unlocked) return;
    setLoadingInstansi(true);
    getInstansi().then(setInstansiList).catch(console.error).finally(() => setLoadingInstansi(false));
  }, [unlocked]);

  const loadPgData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await getAllPassingGrades(filterInstansi ? { instansi_kode: filterInstansi } : undefined);
      setPgList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [filterInstansi]);

  useEffect(() => { if (unlocked) loadPgData(); }, [unlocked, loadPgData]);

  // ── Helpers ──
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const filteredInstansiFor = (search: string) =>
    instansiList.filter((ins) => {
      const nm = ins.nm_instansi ?? ins.instansi_nm ?? '';
      return nm.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 8);

  // ── PDF Scan handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setScanError('File harus berformat PDF!');
      return;
    }
    setPdfFile(file);
    setScanResult(null);
    setScanError('');
    setScanRows([]);
    setCheckedRows(new Set());
    setScanInstansiSearch('');
    setScanInstansiKode('');
    setScanInstansiNm('');
  };

  const handleScan = async () => {
    if (!pdfFile) return;
    setScanning(true);
    setScanProgress({ current: 0, total: 0 });
    setScanError('');
    setScanResult(null);
    setScanRows([]);
    try {
      const result = await parsePGFromPDF(pdfFile, (current, total) => {
        setScanProgress({ current, total });
      });
      setScanResult(result);
      setScanRows(result.rows);
      // Auto-check semua baris PG
      const pgIdxs = new Set(result.rows.map((r, i) => (r.is_pg ? i : -1)).filter((i) => i >= 0));
      setCheckedRows(pgIdxs);
      // Auto-fill instansi dari data PDF (parser sudah extract kode & nama)
      const firstRow = result.rows[0];
      if (firstRow?.instansi_kode) {
        setScanInstansiKode(firstRow.instansi_kode);
        setScanInstansiNm(firstRow.instansi_nm || result.instansi_hint || '');
        setScanInstansiSearch(firstRow.instansi_nm || result.instansi_hint || '');
      } else if (result.instansi_hint) {
        // Fallback: hanya fill search box, user tetap harus pilih dari dropdown
        setScanInstansiSearch(result.instansi_hint);
      }
      if (result.rows.length === 0) {
        setScanError(
          `Tidak ada data nilai terdeteksi dari ${result.page_count} halaman. ` +
          'Klik "Semua Baris" untuk lihat semua teks yang berhasil diekstrak dari PDF.'
        );
      }
    } catch (e: any) {
      setScanError('Gagal memproses PDF: ' + (e?.message ?? String(e)));
    } finally {
      setScanning(false);
    }
  };

  const handleScanInstansiSelect = (ins: any) => {
    setScanInstansiKode(ins.kode_instansi ?? ins.instansi_kode ?? '');
    setScanInstansiNm(ins.nm_instansi ?? ins.instansi_nm ?? '');
    setScanInstansiSearch(ins.nm_instansi ?? ins.instansi_nm ?? '');
    setScanInstansiDropdown(false);
  };

  const toggleRowPG = (idx: number) => {
    setScanRows((prev) => {
      const updated = [...prev];
      // Temukan semua baris dengan jabatan yang sama
      const jabatan = updated[idx].jabatan_nm;
      const sameJabatanIdxs = updated.map((r, i) => r.jabatan_nm === jabatan ? i : -1).filter(i => i >= 0);
      // Reset is_pg untuk jabatan ini
      sameJabatanIdxs.forEach(i => { updated[i] = { ...updated[i], is_pg: i === idx }; });
      return updated;
    });
  };

  const handleSaveFromPDF = async () => {
    if (!scanInstansiKode) {
      setScanError('Pilih instansi terlebih dahulu!');
      return;
    }
    const toSave = scanRows.filter((_, i) => checkedRows.has(i));
    if (toSave.length === 0) {
      setScanError('Centang minimal 1 baris untuk disimpan!');
      return;
    }
    setSavingPdf(true);
    setSaveResult(null);
    let count = 0;
    try {
      for (const row of toSave) {
        const payload: PassingGradeInput = {
          // Kode dari PDF langsung — tidak perlu manual input
          instansi_kode: row.instansi_kode || scanInstansiKode,
          instansi_nm: row.instansi_nm || scanInstansiNm || scanResult?.instansi_hint || '',
          kode_jabatan: row.kode_jabatan,
          jabatan_nm: row.jabatan_nm,
          pendidikan_nm: row.pendidikan_nm,
          formasi_nm: row.formasi_nm,
          lokasi_nm: row.lokasi_nm,
          tahun: scanResult?.tahun ?? 2024,
          nilai_skd_twk: row.nilai_skd_twk,
          nilai_skd_tiu: row.nilai_skd_tiu,
          nilai_skd_tkp: row.nilai_skd_tkp,
          nilai_skd_total: row.nilai_skd_total,
          skb_komponen: row.skb_komponen,
          nilai_skb_total: row.nilai_skb_total,
          nilai_akhir: row.nilai_akhir,
          sumber_pdf: pdfFile?.name ?? '',
          catatan: row.is_pg ? 'PG (peringkat terakhir lulus)' : `Peringkat ${row.rank}`,
        };
        await addPassingGrade(payload);
        count++;
        setSavedCount(count); // update counter real-time
      }
      setSaveResult({ ok: true, msg: `✅ ${count} data PG berhasil disimpan ke Firestore!` });
      showSuccess(`✅ ${count} data PG berhasil disimpan!`);
      await loadPgData();
      // Delay reset agar user sempat baca hasilnya
      setTimeout(() => {
        setScanResult(null);
        setScanRows([]);
        setPdfFile(null);
        setSaveResult(null);
        setSavedCount(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
    } catch (e: any) {
      const errMsg = 'Gagal menyimpan: ' + (e?.message || 'Unknown error');
      setScanError(errMsg);
      setSaveResult({ ok: false, msg: '❌ ' + errMsg });
    } finally {
      setSavingPdf(false);
    }
  };

  // ── Manual form handlers ──
  const handleInstansiSelect = (ins: any) => {
    setForm((f) => ({
      ...f,
      instansi_kode: ins.kode_instansi ?? ins.instansi_kode ?? '',
      instansi_nm: ins.nm_instansi ?? ins.instansi_nm ?? '',
    }));
    setInstansiSearch(ins.nm_instansi ?? ins.instansi_nm ?? '');
    setShowDropdown(false);
  };

  const handleSkbPresetChange = (preset: string) => {
    setSkbPreset(preset);
    if (preset === 'Custom') return;
    const names = SKB_KOMPONEN_PRESETS[preset] ?? [];
    setForm((f) => ({ ...f, skb_komponen: names.map((n) => ({ nama: n, nilai: 0 })) }));
  };

  const handleSkbKomponenChange = (idx: number, field: keyof SKBKomponen, value: any) => {
    setForm((f) => {
      const updated = [...f.skb_komponen];
      updated[idx] = { ...updated[idx], [field]: field === 'nilai' || field === 'bobot' ? Number(value) : value };
      return { ...f, skb_komponen: updated };
    });
  };

  const handleSaveManual = async () => {
    if (!form.instansi_kode || !form.jabatan_nm || !form.pendidikan_nm) {
      alert('Instansi, jabatan, dan pendidikan wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updatePassingGrade(editId, form);
        showSuccess('✅ Data berhasil diupdate!');
      } else {
        await addPassingGrade(form);
        showSuccess('✅ Data berhasil ditambahkan!');
      }
      setForm(emptyForm());
      setEditId(null);
      setInstansiSearch('');
      setSkbPreset('CAT BKN');
      await loadPgData();
      setTab('list');
    } catch (e) {
      alert('Gagal menyimpan data!');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pg: PassingGrade) => {
    setForm({
      instansi_kode: pg.instansi_kode,
      instansi_nm: pg.instansi_nm,
      jabatan_nm: pg.jabatan_nm,
      pendidikan_nm: pg.pendidikan_nm,
      formasi_nm: pg.formasi_nm,
      lokasi_nm: pg.lokasi_nm ?? '',
      tahun: pg.tahun,
      nilai_skd_twk: pg.nilai_skd_twk,
      nilai_skd_tiu: pg.nilai_skd_tiu,
      nilai_skd_tkp: pg.nilai_skd_tkp,
      nilai_skd_total: pg.nilai_skd_total,
      skb_komponen: pg.skb_komponen,
      nilai_skb_total: pg.nilai_skb_total,
      nilai_akhir: pg.nilai_akhir,
      sumber_pdf: pg.sumber_pdf,
      catatan: pg.catatan ?? '',
    });
    setInstansiSearch(pg.instansi_nm);
    setEditId(pg.id!);
    setTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, jabatan: string) => {
    if (!confirm(`Hapus data PG untuk "${jabatan}"?`)) return;
    await deletePassingGrade(id);
    await loadPgData();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(pgList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passing_grade_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleDeleteInstansi = async (instansi_kode: string) => {
    const instansi_nm = pgList.find(p => p.instansi_kode === instansi_kode)?.instansi_nm || instansi_kode;
    const count = pgList.filter(p => p.instansi_kode === instansi_kode).length;
    if (!confirm(`Hapus SEMUA data (${count} baris) untuk instansi "${instansi_nm}"?\nAksi ini tidak dapat dibatalkan.`)) return;
    
    setLoadingData(true);
    try {
      await passingGradeService.deleteByInstansi(instansi_kode);
      showSuccess(`✅ Berkas instansi ${instansi_nm} berhasil dihapus penuh.`);
      if (filterInstansi === instansi_kode) setFilterInstansi('');
      await loadPgData();
    } catch (e) {
      alert('Gagal menghapus data instansi.');
      setLoadingData(false);
    }
  };

  const displayRows = showOnlyPG ? scanRows.filter((r) => r.is_pg) : scanRows;

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // Admin gate — semua hooks sudah dipanggil di atas, aman untuk return di sini
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0c29', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: 40, maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Login Admin Diperlukan</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Tool ini membutuhkan akun admin Firebase untuk menyimpan data ke Firestore.<br />
            {user ? (
              <span>Kamu login sebagai <strong style={{ color: '#fdcb6e' }}>{user.email}</strong>, tapi bukan admin.<br />Login dengan akun admin dulu di halaman utama.</span>
            ) : (
              <span>Kamu belum login. Silakan login dulu dengan akun admin di halaman utama.</span>
            )}
          </p>
          <a
            href="/login"
            style={{ display: 'inline-block', background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: '#fff', padding: '12px 32px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
          >
            🔑 Login sebagai Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.headerTitle}>📊 PG Data Tool</h1>
          <p style={s.headerSub}>Pengumpulan data Passing Grade CPNS 2024 — Internal</p>
        </div>
        <div style={s.headerRight}>
          <span style={s.badge}>{pgList.length} data tersimpan</span>
          <button style={s.exportBtn} onClick={handleExport}>⬇ Export JSON</button>
          <button style={s.lockBtn} onClick={() => { localStorage.removeItem(LS_KEY); setUnlocked(false); }}>
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && <div style={s.successMsg}>{successMsg}</div>}

      {/* Tabs */}
      <div style={s.tabs}>
        {([
          { key: 'scan', label: '📄 Scan PDF' },
          { key: 'manual', label: editId ? '✏️ Edit Data' : '➕ Input Manual' },
          { key: 'list', label: `📋 Daftar (${pgList.length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════ SCAN PDF TAB ═══════ */}
      {tab === 'scan' && (
        <div style={s.card}>

          {/* Upload Area */}
          <div
            style={{ ...s.dropzone, ...(pdfFile ? s.dropzoneHasFile : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file?.type === 'application/pdf') {
                setPdfFile(file);
                setScanResult(null);
                setScanRows([]);
                setCheckedRows(new Set());
              }
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
            {pdfFile ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                <p style={{ fontWeight: 700, color: '#2d3436', margin: '0 0 4px' }}>{pdfFile.name}</p>
                <p style={{ color: '#636e72', fontSize: 12, margin: 0 }}>
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB — Klik untuk ganti
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <p style={{ fontWeight: 700, color: '#2d3436', margin: '0 0 8px' }}>
                  Upload PDF Pengumuman CPNS 2024
                </p>
                <p style={{ color: '#b2bec3', fontSize: 13, margin: 0 }}>
                  Drag & drop atau klik untuk memilih file
                </p>
              </div>
            )}
          </div>

          {/* Scan Button */}
          {pdfFile && !scanResult && (
            <button
              style={{ ...s.saveBtn, marginTop: 16 }}
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <span>⏳ Sedang scan PDF{scanResult === null ? '...' : ''}</span>
              ) : (
                '🔍 Scan & Ekstrak Data PG'
              )}
            </button>
          )}

          {scanning && (
            <div style={s.scanProgress}>
              <div style={s.spinner} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  📄 Membaca halaman {scanProgress.current} / {scanProgress.total || '?'}...
                </div>
                {scanProgress.total > 0 && (
                  <div style={{ background: '#e9ecef', borderRadius: 20, height: 6, width: 300, overflow: 'hidden' }}>
                    <div
                      style={{
                        background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                        height: '100%',
                        borderRadius: 20,
                        width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {scanError && (
            <div style={s.errorBox}>⚠️ {scanError}</div>
          )}

          {/* Scan Results */}
          {scanResult && scanRows.length > 0 && (
            <>
              <div style={s.scanInfoBar}>
                <div>
                  <strong>📄 {pdfFile?.name}</strong>
                  <span style={s.scanMeta}>{scanResult.page_count} halaman</span>
                  <span style={s.scanMeta}>{scanRows.length} baris terdeteksi</span>
                  <span style={{ ...s.scanMeta, color: '#0984e3' }}>
                    {scanRows.filter((r) => r.is_pg).length} kandidat PG
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: 12, color: '#636e72', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={showOnlyPG}
                      onChange={(e) => setShowOnlyPG(e.target.checked)}
                    />
                    Hanya PG
                  </label>
                  <button style={s.rawTextBtn} onClick={() => setShowAllLines((v) => !v)}>
                    {showAllLines ? '🙈 Sembunyikan' : '📋 Semua Baris'}
                  </button>
                  <button style={s.rawTextBtn} onClick={() => setShowRawText((v) => !v)}>
                    {showRawText ? '🙈 Sembunyikan' : '📝 Raw Text'}
                  </button>
                </div>
              </div>

              {/* All Lines Debug */}
              {showAllLines && (
                <pre style={s.rawTextBox}>
                  {'=== SEMUA BARIS TERDETEKSI (tiap baris = 1 baris visual dari PDF) ===\n\n'}
                  {scanResult.all_lines_preview}
                </pre>
              )}
              {/* Raw Text Preview */}
              {showRawText && (
                <pre style={s.rawTextBox}>{scanResult.raw_text_preview}</pre>
              )}

              {/* Instansi Assignment */}
              <div style={{ ...s.card, background: '#f8f9ff', border: '1.5px solid #e8e4ff', marginTop: 0, marginLeft: 0, marginRight: 0 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#2d3436' }}>
                  🏛 Tetapkan Instansi untuk data ini
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#636e72' }}>
                  Instansi terdeteksi: <em>"{scanResult.instansi_hint}"</em>
                </p>
                <div style={{ position: 'relative' }}>
                  <input
                    style={s.input}
                    placeholder="Cari & pilih instansi dari daftar BKN..."
                    value={scanInstansiSearch}
                    onChange={(e) => { setScanInstansiSearch(e.target.value); setScanInstansiDropdown(true); }}
                    onFocus={() => setScanInstansiDropdown(true)}
                  />
                  {scanInstansiDropdown && scanInstansiSearch && (
                    <div style={s.dropdown}>
                      {filteredInstansiFor(scanInstansiSearch).map((ins, i) => (
                        <div key={i} style={s.dropdownItem} onMouseDown={() => handleScanInstansiSelect(ins)}>
                          <span style={s.dropdownCode}>{ins.kode_instansi ?? ins.instansi_kode ?? '—'}</span>
                          {' '}{ins.nm_instansi ?? ins.instansi_nm ?? '—'}
                        </div>
                      ))}
                    </div>
                  )}
                  {scanInstansiKode && (
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
                      <span style={s.instansiCode}>✅ Kode: {scanInstansiKode}</span>
                      {(() => {
                        const existingCount = pgList.filter(p => p.instansi_kode === scanInstansiKode).length;
                        if (existingCount > 0) {
                          return (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#e17055', background: '#ffeaa7', padding: '4px 10px', borderRadius: 8 }}>
                              ⚠️ Sudah ada {existingCount} data tersimpan di DB untuk instansi ini
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Table */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                    📋 Review Hasil Scan
                    <span style={{ fontWeight: 400, color: '#636e72', fontSize: 12, marginLeft: 8 }}>
                      (centang baris yang ingin disimpan, baris PG sudah otomatis dipilih)
                    </span>
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={s.selectAllBtn} onClick={() => setCheckedRows(new Set(displayRows.map((_, i) => scanRows.indexOf(displayRows[i]))))}>
                      ✅ Pilih Semua
                    </button>
                    <button style={s.selectAllBtn} onClick={() => setCheckedRows(new Set())}>
                      ☐ Kosongkan
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>✓</th>
                        <th style={s.th}>No</th>
                        <th style={s.th}>Status</th>
                        <th style={s.th}>Jabatan</th>
                        <th style={s.th}>Pendidikan</th>
                        <th style={s.th}>Lokasi</th>
                        <th style={s.th}>Formasi</th>
                        <th style={s.th}>TWK</th>
                        <th style={s.th}>TIU</th>
                        <th style={s.th}>TKP</th>
                        <th style={s.th}>Total SKD</th>
                        <th style={s.th}>Raw SKB</th>
                        <th style={s.th}>SKB Total</th>
                        <th style={s.th}>Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row) => {
                        const globalIdx = scanRows.indexOf(row);
                        return (
                          <PdfReviewRow
                            key={globalIdx}
                            row={row}
                            instansi_kode={scanInstansiKode}
                            instansi_nm={scanInstansiNm}
                            sumber_pdf={pdfFile?.name ?? ''}
                            tahun={scanResult?.tahun ?? 2024}
                            checked={checkedRows.has(globalIdx)}
                            onCheck={(v) => {
                              setCheckedRows((prev) => {
                                const next = new Set(prev);
                                if (v) next.add(globalIdx); else next.delete(globalIdx);
                                return next;
                              });
                            }}
                            onChange={(updated) => {
                              setScanRows((prev) => {
                                const next = [...prev];
                                next[globalIdx] = updated;
                                return next;
                              });
                            }}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 20, padding: 16, background: '#f8f9ff', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontSize: 13, color: '#636e72' }}>
                      <strong>{checkedRows.size}</strong> baris dipilih untuk disimpan
                      {savingPdf && <span style={{ marginLeft: 8, color: '#6c5ce7' }}>⏳ Menyimpan {savedCount}/{checkedRows.size}...</span>}
                    </div>
                    <button
                      style={{
                        ...s.saveBtn, marginTop: 0, width: 'auto', padding: '12px 32px',
                        opacity: savingPdf ? 0.7 : 1,
                        cursor: savingPdf ? 'not-allowed' : 'pointer',
                      }}
                      onClick={handleSaveFromPDF}
                      disabled={savingPdf || !scanInstansiKode}
                    >
                      {savingPdf
                        ? `⏳ Menyimpan ${savedCount} / ${checkedRows.size}...`
                        : `💾 Simpan ${checkedRows.size} Data PG ke Firestore`}
                    </button>
                  </div>
                  {/* Feedback langsung di bawah tombol simpan */}
                  {saveResult && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                      background: saveResult.ok ? '#00b894' : '#d63031',
                      color: '#fff',
                      textAlign: 'center',
                      animation: 'fadeIn 0.3s ease',
                    }}>
                      {saveResult.msg}
                      {saveResult.ok && <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.9 }}>Halaman akan direset dalam 3 detik...</div>}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* No data detected */}
          {scanResult && scanRows.length === 0 && (
            <div style={s.emptyCard}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤷</div>
              <p style={{ margin: '0 0 8px', fontWeight: 700 }}>Data nilai tidak terdeteksi otomatis</p>
              <p style={{ margin: '0 0 16px', color: '#636e72', fontSize: 13 }}>
                Format PDF mungkin berbeda. Coba lihat raw text di bawah, atau input manual.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={s.rawTextBtn} onClick={() => setShowAllLines((v) => !v)}>
                  📋 {showAllLines ? 'Sembunyikan' : 'Lihat'} Semua Baris Terdeteksi
                </button>
                <button style={s.rawTextBtn} onClick={() => setShowRawText((v) => !v)}>
                  📝 {showRawText ? 'Sembunyikan' : 'Lihat'} Raw Text
                </button>
              </div>
              {showAllLines && (
                <pre style={{ ...s.rawTextBox, marginTop: 12 }}>
                  {'=== BARIS HASIL EKSTRAKSI SEMUA HALAMAN ===\n\n'}
                  {scanResult.all_lines_preview}
                </pre>
              )}
              {showRawText && <pre style={{ ...s.rawTextBox, marginTop: 12 }}>{scanResult.raw_text_preview}</pre>}
              <button style={{ ...s.saveBtn, marginTop: 16 }} onClick={() => setTab('manual')}>
                ➕ Input Manual
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ MANUAL FORM TAB ═══════ */}
      {tab === 'manual' && (
        <div style={s.card}>
          {editId && (
            <div style={s.editBanner}>
              ✏️ Mode Edit — {form.jabatan_nm || 'Data PG'}
              <button style={s.cancelEditBtn} onClick={() => { setEditId(null); setForm(emptyForm()); setInstansiSearch(''); }}>
                ✕ Batal Edit
              </button>
            </div>
          )}

          <h2 style={s.sectionTitle}>🏛 Identifikasi Formasi</h2>
          <div style={s.grid2}>
            {/* Instansi */}
            <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
              <label style={s.label}>Instansi *</label>
              <input
                style={s.input}
                placeholder={loadingInstansi ? 'Loading instansi...' : 'Cari instansi...'}
                value={instansiSearch}
                onChange={(e) => { setInstansiSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && instansiSearch && (
                <div style={s.dropdown}>
                  {filteredInstansiFor(instansiSearch).map((ins, i) => (
                    <div key={i} style={s.dropdownItem} onMouseDown={() => handleInstansiSelect(ins)}>
                      <span style={s.dropdownCode}>{ins.kode_instansi ?? ins.instansi_kode ?? '—'}</span>
                      {' '}{ins.nm_instansi ?? ins.instansi_nm ?? '—'}
                    </div>
                  ))}
                </div>
              )}
              {form.instansi_kode && <span style={s.instansiCode}>Kode: {form.instansi_kode}</span>}
            </div>

            <div>
              <label style={s.label}>Nama Jabatan *</label>
              <input style={s.input} placeholder="ex: Analis Kebijakan Ahli Pertama" value={form.jabatan_nm}
                onChange={(e) => setForm((f) => ({ ...f, jabatan_nm: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Pendidikan *</label>
              <input style={s.input} placeholder="ex: S-1 Ilmu Komputer" value={form.pendidikan_nm}
                onChange={(e) => setForm((f) => ({ ...f, pendidikan_nm: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Jenis Formasi</label>
              <select style={s.select} value={form.formasi_nm} onChange={(e) => setForm((f) => ({ ...f, formasi_nm: e.target.value }))}>
                {FORMASI_NM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Lokasi Penempatan</label>
              <input style={s.input} placeholder="ex: DKI Jakarta (opsional)" value={form.lokasi_nm ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lokasi_nm: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Tahun CPNS</label>
              <select style={s.select} value={form.tahun} onChange={(e) => setForm((f) => ({ ...f, tahun: Number(e.target.value) }))}>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>
          </div>

          <h2 style={{ ...s.sectionTitle, marginTop: 28 }}>📝 Nilai SKD</h2>
          <div style={s.grid4}>
            {(['TWK', 'TIU', 'TKP'] as const).map((sub) => {
              const key = `nilai_skd_${sub.toLowerCase()}` as keyof PassingGradeInput;
              return (
                <div key={sub}>
                  <label style={s.label}>{sub}</label>
                  <input style={s.input} type="number" placeholder="0" value={(form[key] as number) ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value === '' ? null : Number(e.target.value) }))} />
                </div>
              );
            })}
            <div>
              <label style={s.label}>Total SKD</label>
              <input style={{ ...s.input, fontWeight: 700 }} type="number" placeholder="0" value={form.nilai_skd_total ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nilai_skd_total: e.target.value === '' ? null : Number(e.target.value) }))} />
            </div>
          </div>

          <h2 style={{ ...s.sectionTitle, marginTop: 28 }}>🎯 Nilai SKB</h2>
          <div style={s.skbPresetRow}>
            <label style={s.label}>Preset Komponen SKB:</label>
            <div style={s.presetBtns}>
              {Object.keys(SKB_KOMPONEN_PRESETS).map((p) => (
                <button key={p} type="button"
                  style={{ ...s.presetBtn, ...(skbPreset === p ? s.presetBtnActive : {}) }}
                  onClick={() => handleSkbPresetChange(p)}>{p}</button>
              ))}
            </div>
          </div>
          {form.skb_komponen.map((k, idx) => (
            <div key={idx} style={s.skbKomponenRow}>
              <div style={{ flex: 2 }}>
                <label style={s.label}>Nama Komponen</label>
                <input style={s.input} placeholder="ex: CAT BKN" value={k.nama}
                  onChange={(e) => handleSkbKomponenChange(idx, 'nama', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Nilai</label>
                <input style={s.input} type="number" placeholder="0" value={k.nilai || ''}
                  onChange={(e) => handleSkbKomponenChange(idx, 'nilai', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>Bobot %</label>
                <input style={s.input} type="number" placeholder="—" value={k.bobot ?? ''}
                  onChange={(e) => handleSkbKomponenChange(idx, 'bobot', e.target.value === '' ? undefined : e.target.value)} />
              </div>
              <button style={s.removeBtn} type="button"
                onClick={() => setForm((f) => ({ ...f, skb_komponen: f.skb_komponen.filter((_, i) => i !== idx) }))}>✕</button>
            </div>
          ))}
          <button style={s.addKomponenBtn} type="button"
            onClick={() => setForm((f) => ({ ...f, skb_komponen: [...f.skb_komponen, { nama: '', nilai: 0 }] }))}>
            + Tambah Komponen SKB
          </button>

          <div style={{ ...s.grid2, marginTop: 12 }}>
            <div>
              <label style={s.label}>Total / Nilai Akhir SKB</label>
              <input style={{ ...s.input, fontWeight: 700 }} type="number" placeholder="0" value={form.nilai_skb_total ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nilai_skb_total: e.target.value === '' ? null : Number(e.target.value) }))} />
            </div>
            <div>
              <label style={s.label}>Nilai Akhir Integrasi</label>
              <input style={{ ...s.input, fontWeight: 700, color: '#6c5ce7' }} type="number" placeholder="0" value={form.nilai_akhir ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nilai_akhir: e.target.value === '' ? null : Number(e.target.value) }))} />
            </div>
          </div>

          <h2 style={{ ...s.sectionTitle, marginTop: 28 }}>📎 Sumber & Catatan</h2>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Nama File PDF Sumber</label>
              <input style={s.input} placeholder="ex: pengumuman_kemenkeu_2024.pdf" value={form.sumber_pdf}
                onChange={(e) => setForm((f) => ({ ...f, sumber_pdf: e.target.value }))} />
            </div>
            <div>
              <label style={s.label}>Catatan</label>
              <input style={s.input} placeholder="ex: PG peringkat terakhir lulus" value={form.catatan ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
            </div>
          </div>

          <button style={s.saveBtn} onClick={handleSaveManual} disabled={saving}>
            {saving ? '⏳ Menyimpan...' : editId ? '💾 Update Data' : '✅ Simpan Data PG'}
          </button>
        </div>
      )}

      {/* ═══════ LIST TAB ═══════ */}
      {tab === 'list' && (
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ ...s.sectionTitle, margin: 0, border: 'none' }}>📋 Data PG Tersimpan</h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <select style={{ ...s.select, minWidth: 200 }} value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)}>
                <option value="">Semua Instansi</option>
                {Array.from(new Set(pgList.map((p) => p.instansi_kode))).map((kode) => {
                  const pg = pgList.find((p) => p.instansi_kode === kode);
                  return <option key={kode} value={kode}>{pg?.instansi_nm ?? kode}</option>;
                })}
              </select>
              {filterInstansi && (
                <button
                  style={{...s.deleteBtn, padding: '8px 16px', background: '#ffebee', color: '#d32f2f', fontWeight: 600}}
                  onClick={() => handleDeleteInstansi(filterInstansi)}
                  title="Hapus semua data untuk instansi ini"
                >
                  🗑️ Hapus Semua Data Instansi Ini
                </button>
              )}
              <button style={s.refreshBtn} onClick={loadPgData}>🔄 Refresh</button>
            </div>
          </div>

          {loadingData ? (
            <div style={s.scanProgress}><div style={s.spinner} /><span>Memuat data...</span></div>
          ) : pgList.length === 0 ? (
            <div style={s.emptyCard}>
              <div style={{ fontSize: 40 }}>📭</div>
              <p style={{ margin: '12px 0 0' }}>Belum ada data PG.</p>
              <button style={{ ...s.saveBtn, marginTop: 16, width: 'auto', padding: '10px 24px' }} onClick={() => setTab('scan')}>
                📄 Scan PDF Pertama
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Instansi</th>
                    <th style={s.th}>Jabatan</th>
                    <th style={s.th}>Pendidikan</th>
                    <th style={s.th}>Jenis</th>
                    <th style={s.th}>TWK</th>
                    <th style={s.th}>TIU</th>
                    <th style={s.th}>TKP</th>
                    <th style={s.th}>SKD Total</th>
                    <th style={s.th}>SKB</th>
                    <th style={s.th}>Nilai Akhir</th>
                    <th style={s.th}>Tahun</th>
                    <th style={s.th}>Sumber</th>
                    <th style={s.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pgList.map((pg) => (
                    <tr key={pg.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={s.td}>
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          <span style={s.dropdownCode}>{pg.instansi_kode}</span>
                          <span style={{ fontSize: 11 }}>{pg.instansi_nm}</span>
                        </div>
                      </td>
                      <td style={{ ...s.td, maxWidth: 180, wordBreak: 'break-word', fontSize: 12 }}>{pg.jabatan_nm}</td>
                      <td style={{ ...s.td, fontSize: 12 }}>{pg.pendidikan_nm}</td>
                      <td style={s.td}><span style={s.formasiChip}>{pg.formasi_nm}</span></td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{pg.nilai_skd_twk ?? '—'}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{pg.nilai_skd_tiu ?? '—'}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{pg.nilai_skd_tkp ?? '—'}</td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 700 }}>{pg.nilai_skd_total ?? '—'}</td>
                      <td style={{ ...s.td, fontSize: 11 }}>
                        {pg.skb_komponen.map((k, i) => (
                          <div key={i}>{k.nama}: <strong>{k.nilai}</strong>{k.bobot ? ` (${k.bobot}%)` : ''}</div>
                        ))}
                      </td>
                      <td style={{ ...s.td, textAlign:'center', fontWeight:700, color:'#6c5ce7' }}>{pg.nilai_akhir ?? '—'}</td>
                      <td style={{ ...s.td, textAlign:'center' }}>{pg.tahun}</td>
                      <td style={{ ...s.td, fontSize: 11, color:'#636e72', maxWidth: 120, wordBreak:'break-word' }}>
                        {pg.sumber_pdf || '—'}
                      </td>
                      <td style={s.td}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button style={s.editBtn} onClick={() => handleEdit(pg)}>✏️</button>
                          <button style={s.deleteBtn} onClick={() => handleDelete(pg.id!, pg.jabatan_nm)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // Gate
  gateOverlay: { minHeight:'100vh', background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" },
  gateCard: { background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'48px 40px', textAlign:'center', width:360, transition:'transform 0.1s' },
  gateLock: { fontSize:48, marginBottom:16 },
  gateTitle: { color:'#fff', fontSize:24, fontWeight:700, margin:'0 0 8px' },
  gateSubtitle: { color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:32 },
  gateForm: { display:'flex', flexDirection:'column', gap:12 },
  gateInput: { background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'12px 16px', color:'#fff', fontSize:15, textAlign:'center', letterSpacing:4, outline:'none' },
  gateBtn: { background:'linear-gradient(135deg,#6c5ce7,#a29bfe)', color:'#fff', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:600, cursor:'pointer' },
  // Page
  page: { minHeight:'100vh', background:'#f4f6fb', fontFamily:"'Inter',sans-serif", paddingBottom:60 },
  header: { background:'linear-gradient(135deg,#0f0c29,#302b63)', padding:'24px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  headerTitle: { color:'#fff', fontSize:22, fontWeight:700, margin:0 },
  headerSub: { color:'rgba(255,255,255,0.5)', fontSize:12, margin:'4px 0 0' },
  headerRight: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  badge: { background:'rgba(255,255,255,0.1)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:13 },
  exportBtn: { background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13 },
  lockBtn: { background:'transparent', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12 },
  successMsg: { background:'#00b894', color:'#fff', padding:'12px 32px', fontWeight:600, fontSize:14 },
  tabs: { display:'flex', borderBottom:'2px solid #e0e0e0', padding:'0 32px', background:'#fff' },
  tab: { padding:'14px 24px', background:'transparent', border:'none', borderBottom:'2px solid transparent', cursor:'pointer', fontSize:14, fontWeight:500, color:'#666', marginBottom:-2, transition:'all 0.2s' },
  tabActive: { borderBottomColor:'#6c5ce7', color:'#6c5ce7', fontWeight:700 },
  card: { background:'#fff', margin:'24px 32px', borderRadius:16, padding:28, boxShadow:'0 2px 20px rgba(0,0,0,0.06)' },
  // Dropzone
  dropzone: { border:'2.5px dashed #d0d0d0', borderRadius:16, padding:40, cursor:'pointer', textAlign:'center', transition:'all 0.2s', background:'#fafafa' },
  dropzoneHasFile: { borderColor:'#6c5ce7', background:'#f8f4ff' },
  // Scan
  scanProgress: { display:'flex', alignItems:'center', gap:12, padding:20, color:'#636e72', fontSize:14 },
  spinner: { width:20, height:20, border:'2.5px solid #e0e0e0', borderTopColor:'#6c5ce7', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  scanInfoBar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'#f0f9ff', borderRadius:10, margin:'16px 0', flexWrap:'wrap', gap:8 },
  scanMeta: { marginLeft:8, color:'#636e72', fontSize:12, background:'#e8f5ff', borderRadius:4, padding:'2px 8px' },
  rawTextBtn: { background:'#f0ebff', color:'#6c5ce7', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 },
  rawTextBox: { background:'#1a1a2e', color:'#a29bfe', padding:16, borderRadius:8, fontSize:11, overflowX:'auto', maxHeight:300, overflowY:'auto', marginTop:8, fontFamily:'monospace', lineHeight:1.6 },
  errorBox: { background:'#fff5f5', border:'1px solid #ffcdd2', borderRadius:10, padding:'12px 16px', color:'#c62828', fontSize:13, marginTop:12 },
  emptyCard: { textAlign:'center', padding:'40px 20px', color:'#b2bec3' },
  pgBadge: { background:'#0984e3', color:'#fff', borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:700, marginLeft:6 },
  selectAllBtn: { background:'#f0ebff', color:'#6c5ce7', border:'none', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 },
  // Mini input untuk review table
  miniInput: { padding:'4px 6px', border:'1px solid #e0e0e0', borderRadius:6, fontSize:12, background:'#fff', outline:'none' },
  // Form
  editBanner: { background:'#fff3cd', border:'1px solid #ffc107', borderRadius:8, padding:'10px 16px', marginBottom:20, fontSize:14, fontWeight:600, color:'#856404', display:'flex', alignItems:'center', justifyContent:'space-between' },
  cancelEditBtn: { background:'transparent', border:'1px solid #856404', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, color:'#856404' },
  sectionTitle: { fontSize:15, fontWeight:700, color:'#2d3436', margin:'0 0 16px', paddingBottom:8, borderBottom:'1px solid #f0f0f0' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  grid4: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 },
  label: { display:'block', fontSize:12, fontWeight:600, color:'#636e72', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  input: { width:'100%', padding:'10px 12px', border:'1.5px solid #e9ecef', borderRadius:8, fontSize:14, color:'#2d3436', background:'#f8f9ff', outline:'none', boxSizing:'border-box' },
  select: { width:'100%', padding:'10px 12px', border:'1.5px solid #e9ecef', borderRadius:8, fontSize:14, color:'#2d3436', background:'#f8f9ff', outline:'none', boxSizing:'border-box' },
  dropdown: { position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e9ecef', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, maxHeight:240, overflowY:'auto' },
  dropdownItem: { padding:'10px 14px', cursor:'pointer', fontSize:13, color:'#2d3436', borderBottom:'1px solid #f0f0f0' },
  dropdownCode: { background:'#f0ebff', color:'#6c5ce7', borderRadius:4, padding:'1px 6px', fontSize:11, fontWeight:700, fontFamily:'monospace' },
  instansiCode: { display:'block', fontSize:11, color:'#6c5ce7', marginTop:4, fontFamily:'monospace' },
  skbPresetRow: { marginBottom:12 },
  presetBtns: { display:'flex', flexWrap:'wrap', gap:8, marginTop:8 },
  presetBtn: { padding:'6px 14px', borderRadius:20, border:'1.5px solid #e9ecef', background:'#f8f9ff', fontSize:12, cursor:'pointer', color:'#636e72', fontWeight:500 },
  presetBtnActive: { background:'#6c5ce7', borderColor:'#6c5ce7', color:'#fff' },
  skbKomponenRow: { display:'flex', gap:12, alignItems:'flex-end', marginBottom:12 },
  removeBtn: { background:'#ffe0e0', color:'#d63031', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer', flexShrink:0, marginBottom:2, fontSize:14 },
  addKomponenBtn: { background:'transparent', border:'1.5px dashed #6c5ce7', color:'#6c5ce7', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600, marginTop:4 },
  saveBtn: { background:'linear-gradient(135deg,#6c5ce7,#a29bfe)', color:'#fff', border:'none', borderRadius:12, padding:'14px 32px', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:28, width:'100%' },
  // List
  refreshBtn: { background:'#f0ebff', color:'#6c5ce7', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:13, fontWeight:600 },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th: { background:'#f8f9ff', padding:'10px 14px', fontWeight:700, color:'#636e72', textAlign:'left', fontSize:11, textTransform:'uppercase', letterSpacing:0.5, borderBottom:'2px solid #e9ecef', whiteSpace:'nowrap' },
  td: { padding:'10px 14px', verticalAlign:'top', color:'#2d3436' },
  formasiChip: { background:'#e8f5e9', color:'#388e3c', borderRadius:12, padding:'3px 8px', fontSize:11, fontWeight:600 },
  editBtn: { background:'#f0ebff', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:14 },
  deleteBtn: { background:'#ffe0e0', border:'none', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:14 },
};
