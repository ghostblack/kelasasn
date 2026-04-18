import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PassingGrade, PassingGradeInput } from '@/types/passingGrade';

const COLLECTION = 'passing_grades';

// ─── CREATE ────────────────────────────────────────────────────────────────────

export const addPassingGrade = async (data: PassingGradeInput): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
};

// ─── READ ──────────────────────────────────────────────────────────────────────

export const getAllPassingGrades = async (filters?: {
  instansi_kode?: string;
  tahun?: number;
}): Promise<PassingGrade[]> => {
  // NOTE: Jangan gabungkan where() + orderBy() field beda tanpa composite index Firestore!
  // Gunakan simple where() saja, sort di client side.
  let q;

  if (filters?.instansi_kode) {
    q = query(
      collection(db, COLLECTION),
      where('instansi_kode', '==', filters.instansi_kode),
    );
  } else if (filters?.tahun) {
    q = query(
      collection(db, COLLECTION),
      where('tahun', '==', filters.tahun),
    );
  } else {
    q = query(collection(db, COLLECTION), orderBy('instansi_nm', 'asc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PassingGrade));
};

/**
 * Query PG by nama instansi — mencoba exact match dengan beberapa variasi case.
 * Dipakai sebagai fallback ketika instansi_kode berbeda format antara PDF dan API BKN.
 */
export const getPassingGradesByInstansiNm = async (
  instansi_nm: string,
): Promise<PassingGrade[]> => {
  // Coba exact match dulu
  const tryExact = async (nm: string) => {
    const q = query(collection(db, COLLECTION), where('instansi_nm', '==', nm));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PassingGrade));
  };

  // Coba as-is
  let results = await tryExact(instansi_nm);
  if (results.length > 0) return results;

  // Coba UPPERCASE
  const upper = instansi_nm.toUpperCase();
  if (upper !== instansi_nm) {
    results = await tryExact(upper);
    if (results.length > 0) return results;
  }

  // Coba Title Case (setiap kata huruf besar pertama)
  const titleCase = instansi_nm
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
  if (titleCase !== instansi_nm && titleCase !== upper) {
    results = await tryExact(titleCase);
  }

  return results;
};

/**
 * Lookup PG berdasarkan identifikasi formasi — digunakan di halaman formasi user.
 * Prioritas match: kode_jabatan → fallback ke jabatan_nm
 */
export const getPassingGradeByFormasi = async (
  instansi_kode: string,
  jabatan_nm: string,
  pendidikan_nm: string,
  tahun = 2024,
): Promise<PassingGrade | null> => {
  const q = query(
    collection(db, COLLECTION),
    where('instansi_kode', '==', instansi_kode),
    where('jabatan_nm', '==', jabatan_nm),
    where('pendidikan_nm', '==', pendidikan_nm),
    where('tahun', '==', tahun),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PassingGrade;
};

/**
 * Lookup PG by kode_jabatan (lebih akurat daripada nama).
 * Digunakan saat data API tersedia kode jabatannya.
 */
export const getPassingGradeByKodeJabatan = async (
  instansi_kode: string,
  kode_jabatan: string,
  pendidikan_nm: string,
  tahun = 2024,
): Promise<PassingGrade | null> => {
  const q = query(
    collection(db, COLLECTION),
    where('instansi_kode', '==', instansi_kode),
    where('kode_jabatan', '==', kode_jabatan),
    where('pendidikan_nm', '==', pendidikan_nm),
    where('tahun', '==', tahun),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as PassingGrade;
};

// ─── UPDATE ────────────────────────────────────────────────────────────────────

export const updatePassingGrade = async (
  id: string,
  data: Partial<PassingGradeInput>,
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updated_at: serverTimestamp(),
  });
};

// ─── DELETE ────────────────────────────────────────────────────────────────────

export const deletePassingGrade = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

export const deletePassingGradesByInstansi = async (instansi_kode: string): Promise<void> => {
  const q = query(collection(db, COLLECTION), where('instansi_kode', '==', instansi_kode));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(doc(db, COLLECTION, d.id)));
  await Promise.all(deletePromises);
};

// ─── SERVICE OBJECT ────────────────────────────────────────────────────────────

export const passingGradeService = {
  add: addPassingGrade,
  getAll: getAllPassingGrades,
  getByInstansiNm: getPassingGradesByInstansiNm,
  getByFormasi: getPassingGradeByFormasi,
  getByKodeJabatan: getPassingGradeByKodeJabatan,
  update: updatePassingGrade,
  delete: deletePassingGrade,
  deleteByInstansi: deletePassingGradesByInstansi,
};
