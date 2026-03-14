import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Jabatan } from '@/types';

export const getAllJabatan = async (limitCount: number = 50): Promise<Jabatan[]> => {
  const jabatanRef = collection(db, 'jabatan');
  const q = query(jabatanRef, orderBy('namaJabatan', 'asc'), limit(limitCount));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Jabatan[];
};

export const searchJabatan = async (
  searchTerm: string,
  kategori?: string
): Promise<Jabatan[]> => {
  const jabatanRef = collection(db, 'jabatan');
  let q;

  if (kategori) {
    q = query(
      jabatanRef,
      where('kategori', '==', kategori),
      orderBy('namaJabatan', 'asc')
    );
  } else {
    q = query(jabatanRef, orderBy('namaJabatan', 'asc'));
  }

  const snapshot = await getDocs(q);
  const allJabatan = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Jabatan[];

  if (!searchTerm) return allJabatan;

  const searchLower = searchTerm.toLowerCase();
  return allJabatan.filter(
    jabatan =>
      jabatan.namaJabatan.toLowerCase().includes(searchLower) ||
      jabatan.instansi.toLowerCase().includes(searchLower) ||
      jabatan.kodeJabatan.toLowerCase().includes(searchLower)
  );
};

export const getJabatanByKategori = async (kategori: string): Promise<Jabatan[]> => {
  const jabatanRef = collection(db, 'jabatan');
  const q = query(
    jabatanRef,
    where('kategori', '==', kategori),
    orderBy('namaJabatan', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Jabatan[];
};
