import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentTransaction } from '@/types';

const generateReference = (): string => {
  return `QRIS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

export const createPaymentTransaction = async (
  userId: string,
  tryoutId: string,
  tryoutName: string,
  amount: number,
  _paymentMethod: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Promise<PaymentTransaction> => {
  const reference = generateReference();
  const expiredTime = new Date();
  expiredTime.setDate(expiredTime.getDate() + 1); // 24 hours expiry

  const transactionData = {
    userId,
    tryoutId,
    tryoutName,
    amount,
    fee: 0,
    totalAmount: amount,
    reference,
    merchantRef: reference,
    paymentMethod: 'QRIS Statis',
    paymentMethodCode: 'QRIS',
    status: 'UNPAID',
    qrUrl: 'https://i.imgur.com/QWw8pWy.jpeg', // Static QRIS Placeholder
    expiredTime,
    customerName,
    customerEmail,
    customerPhone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'payment_transactions'), transactionData);

  return {
    id: docRef.id,
    ...transactionData,
    expiredTime,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PaymentTransaction;
};

export const getPaymentTransaction = async (
  transactionId: string
): Promise<PaymentTransaction | null> => {
  const docRef = doc(db, 'payment_transactions', transactionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    expiredTime: (data.expiredTime as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
  } as PaymentTransaction;
};

export const getPaymentByReference = async (
  reference: string
): Promise<PaymentTransaction | null> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('reference', '==', reference)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    expiredTime: (data.expiredTime as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
  } as PaymentTransaction;
};

export const getUserPayments = async (userId: string): Promise<PaymentTransaction[]> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);

  const payments = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      expiredTime: (data.expiredTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
    } as PaymentTransaction;
  });

  const now = new Date();
  for (const payment of payments) {
    if (payment.status === 'UNPAID' && now > payment.expiredTime) {
      await updatePaymentStatus(payment.reference, 'EXPIRED');
      payment.status = 'EXPIRED';
    }
  }

  return payments;
};

export const updatePaymentStatus = async (
  reference: string,
  status: 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING_CONFIRMATION'
): Promise<void> => {
  const payment = await getPaymentByReference(reference);

  if (!payment) {
    throw new Error('Payment not found');
  }

  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'PAID') {
    updateData.paidAt = serverTimestamp();
  }

  const docRef = doc(db, 'payment_transactions', payment.id);
  await updateDoc(docRef, updateData);

  if (status === 'PAID') {
    const userTryoutsRef = collection(db, 'user_tryouts');
    await addDoc(userTryoutsRef, {
      userId: payment.userId,
      tryoutId: payment.tryoutId,
      tryoutName: payment.tryoutName,
      purchaseDate: serverTimestamp(),
      status: 'not_started',
      paymentStatus: 'success',
      transactionId: payment.reference,
      attempts: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const confirmPayment = async (transactionId: string): Promise<void> => {
  const docRef = doc(db, 'payment_transactions', transactionId);
  await updateDoc(docRef, {
    status: 'PENDING_CONFIRMATION',
    updatedAt: serverTimestamp(),
  });
};

export const getAllPendingPayments = async (): Promise<PaymentTransaction[]> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('status', '==', 'PENDING_CONFIRMATION')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    expiredTime: (doc.data().expiredTime as Timestamp).toDate(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as PaymentTransaction[];
};

export const getAllPayments = async (): Promise<PaymentTransaction[]> => {
  const snapshot = await getDocs(collection(db, 'payment_transactions'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    expiredTime: (doc.data().expiredTime as Timestamp).toDate(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as PaymentTransaction[];
};

export const checkPaymentStatus = async (reference: string): Promise<PaymentTransaction> => {
  const payment = await getPaymentByReference(reference);
  if (!payment) throw new Error('Payment not found');

  if (payment.status === 'UNPAID' && new Date() > payment.expiredTime) {
    await updatePaymentStatus(reference, 'EXPIRED');
    payment.status = 'EXPIRED';
  }

  return payment;
};

export const createQRISPaymentTransaction = async (
  userId: string,
  tryoutId: string,
  tryoutName: string,
  amount: number,
  _customerName: string,
  _customerEmail: string
): Promise<PaymentTransaction> => {
  const reference = generateReference();
  const expiredTime = new Date();
  expiredTime.setDate(expiredTime.getDate() + 7);

  const transactionData = {
    userId,
    tryoutId,
    tryoutName,
    amount,
    fee: 0,
    totalAmount: amount,
    reference,
    merchantRef: reference,
    paymentMethod: 'QRIS',
    paymentMethodCode: 'QRIS',
    status: 'UNPAID',
    payUrl: undefined,
    checkoutUrl: undefined,
    qrUrl: 'https://i.imgur.com/QWw8pWy.jpeg',
    expiredTime,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'payment_transactions'), transactionData);

  return {
    id: docRef.id,
    ...transactionData,
    expiredTime,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PaymentTransaction;
};
