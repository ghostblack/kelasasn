export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TryoutPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: 'free' | 'premium';
  type: 'SKD' | 'SKB' | 'BOTH';
  features: string[];
  imageUrl?: string;
  totalDuration: number;
  twkQuestions: number;
  tiuQuestions: number;
  tkpQuestions: number;
  totalQuestions: number;
  passingGradeTWK: number;
  passingGradeTIU: number;
  passingGradeTKP: number;
  isActive: boolean;
  isDraft?: boolean;
  createdAt: Date;
  questionIds: string[];
  isBundle?: boolean;
  includedTryoutIds?: string[];
  isEarlyBirdActive?: boolean;
  earlyBirdPrice?: number;
  earlyBirdQuota?: number;
  currentSales?: number;
  releaseDate?: any;
}

export interface UserTryout {
  id: string;
  userId: string;
  tryoutId: string;
  tryoutName: string;
  purchaseDate: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Date;
  paymentStatus: 'pending' | 'success' | 'failed';
  transactionId?: string;
  attempts: number;
  lastAttemptAt?: Date;
}

export interface Question {
  id: string;
  questionText: string;
  questionImage?: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
  };
  correctAnswer?: 'a' | 'b' | 'c' | 'd' | 'e';
  explanation?: string;
  category: 'TWK' | 'TIU' | 'TKP';
  subcategory?: string;
  weight: number;
  tryoutId: string;
  tkpScoring?: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
  };
  optionImages?: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };
}

export interface TryoutSession {
  id: string;
  userId: string;
  userTryoutId: string;
  tryoutId: string;
  startTime: Date;
  endTime?: Date;
  currentQuestion: number;
  answers: Record<string, string>;
  twkAnswers: Record<string, string>;
  tiuAnswers: Record<string, string>;
  tkpAnswers: Record<string, string>;
  status: 'active' | 'paused' | 'completed' | 'expired';
  totalTimeLeft: number;
  shuffledQuestionIds?: string[];
}

export interface TryoutResult {
  id: string;
  userId: string;
  tryoutId: string;
  tryoutName: string;
  totalScore: number;
  maxTotalScore: number;
  twkScore: number;
  tiuScore: number;
  tkpScore: number;
  maxTwkScore: number;
  maxTiuScore: number;
  maxTkpScore: number;
  twkCorrect: number;
  tiuCorrect: number;
  tkpCorrect: number;
  twkTotal: number;
  tiuTotal: number;
  tkpTotal: number;
  isPassed: boolean;
  passedTWK: boolean;
  passedTIU: boolean;
  passedTKP: boolean;
  rank: number;
  totalParticipants: number;
  answers: Record<string, string>;
  completedAt: Date;
  attemptNumber: number;
  shuffledQuestionIds?: string[];
}

export interface Jabatan {
  id: string;
  kodeJabatan: string;
  namaJabatan: string;
  instansi: string;
  formasi: number;
  passingGrade: number;
  kategori: 'Teknis' | 'Kesehatan' | 'Pendidikan' | 'Umum';
  kualifikasi: string[];
  relatedTryouts: string[];
  createdAt: Date;
}

export interface UserStats {
  totalTryouts: number;
  highestScore: number;
  averageScore: number;
  bestRank: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  displayName: string;
  createdAt: Date;
}

export interface TripayPaymentChannel {
  code: string;
  name: string;
  group: string;
  fee_merchant: {
    flat: number;
    percent: number;
  };
  fee_customer: {
    flat: number;
    percent: number;
  };
  total_fee: {
    flat: number;
    percent: number;
  };
  minimum_fee: number;
  maximum_fee: number;
  icon_url: string;
  active: boolean;
}

export interface TripayTransaction {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_method_code?: string;
  payment_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  fee_merchant?: number;
  fee_customer?: number;
  total_fee?: number;
  amount_received?: number;
  pay_code?: string;
  pay_url?: string;
  checkout_url?: string;
  qr_string?: string;
  qr_url?: string;
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND';
  expired_time: number;
  order_items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  instructions?: Array<{
    title: string;
    steps: string[];
  }>;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  tryoutId: string;
  tryoutName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  reference: string;
  merchantRef: string;
  tripayReference?: string;
  paymentMethod: string;
  paymentMethodCode: string;
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING_CONFIRMATION';
  payUrl?: string | null;
  checkoutUrl?: string | null;
  qrUrl?: string | null;
  qrString?: string | null;
  instructions?: Array<{ title: string; steps: string[] }>;
  proofImageUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiredTime: Date;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

export interface ClaimCode {
  id: string;
  code: string;
  tryoutId: string;
  tryoutName: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiryDate?: Date;
  usedBy: string[];
  createdAt: Date;
  createdBy: string;
}

export interface FormasiAccessCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  expiryDate?: Date;
  usedBy: string[];
  createdAt: Date;
  createdBy: string;
}

export interface UserFormasiAccess {
  userId: string;
  unlockedAt: Date;
  expiresAt: Date;
}
