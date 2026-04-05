import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface VIPBundlingSettings {
  earlyBirdPrice: number;
  regularPrice: number;
  discountPrice: number;
  earlyBirdLimit: number;
  isActive: boolean;
  includedTryoutIds?: string[]; // IDs of tryout packages included in this bundle
}

export interface VIPBundlingStats {
  totalSales: number;
  lastUpdated: any;
}

const SETTINGS_DOC = 'settings/vip_bundling';
const STATS_DOC = 'vip_bundling_stats/global';

export const VIP_BUNDLING_ID = 'vip_bundling_all_access';

/**
 * Fetch VIP Bundling settings from Firestore
 */
export const getVIPBundlingSettings = async (): Promise<VIPBundlingSettings> => {
  try {
    const settingsSnap = await getDoc(doc(db, SETTINGS_DOC));
    if (settingsSnap.exists()) {
      return settingsSnap.data() as VIPBundlingSettings;
    }
    
    const defaults: VIPBundlingSettings = {
      earlyBirdPrice: 30000,
      regularPrice: 60000,
      discountPrice: 30000,
      earlyBirdLimit: 50,
      isActive: true
    };
    
    // Create defaults in Firestore if they don't exist
    await setDoc(doc(db, SETTINGS_DOC), defaults);
    return defaults;
  } catch (error) {
    console.error('Error fetching VIP Bundling settings:', error);
    return {
      earlyBirdPrice: 30000,
      regularPrice: 60000,
      discountPrice: 30000,
      earlyBirdLimit: 50,
      isActive: true,
      includedTryoutIds: []
    };
  }
};

/**
 * Fetch current VIP Bundling sales stats
 */
export const getVIPBundlingStats = async (): Promise<VIPBundlingStats> => {
  try {
    const statsSnap = await getDoc(doc(db, STATS_DOC));
    if (statsSnap.exists()) {
      return statsSnap.data() as VIPBundlingStats;
    }
    
    const defaults: VIPBundlingStats = {
      totalSales: 0,
      lastUpdated: serverTimestamp()
    };
    
    await setDoc(doc(db, STATS_DOC), defaults);
    return defaults;
  } catch (error) {
    console.error('Error fetching VIP Bundling stats:', error);
    return { totalSales: 0, lastUpdated: new Date() };
  }
};

/**
 * Calculate current price based on sales and settings
 */
export const calculateCurrentVIPPrice = async (): Promise<number> => {
  const [settings, stats] = await Promise.all([
    getVIPBundlingSettings(),
    getVIPBundlingStats()
  ]);
  
  if (stats.totalSales < settings.earlyBirdLimit) {
    return settings.earlyBirdPrice;
  }
  
  return settings.discountPrice > 0 ? settings.discountPrice : settings.regularPrice;
};

/**
 * Record a new sale of VIP Bundling
 */
export const recordVIPBundlingSale = async (): Promise<void> => {
  const statsRef = doc(db, STATS_DOC);
  await updateDoc(statsRef, {
    totalSales: increment(1),
    lastUpdated: serverTimestamp()
  });
};

/**
 * Update VIP Bundling settings
 */
export const updateVIPBundlingSettings = async (settings: Partial<VIPBundlingSettings>): Promise<void> => {
  const settingsRef = doc(db, SETTINGS_DOC);
  await updateDoc(settingsRef, {
    ...settings,
    // Ensure isActive defaults to true if not provided during a partial update
  });
};

/**
 * Reset VIP Bundling stats (Admin only feature)
 */
export const resetVIPBundlingStats = async (): Promise<void> => {
  const statsRef = doc(db, STATS_DOC);
  await setDoc(statsRef, {
    totalSales: 0,
    lastUpdated: serverTimestamp()
  });
};
