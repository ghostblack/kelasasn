import React, { createContext, useContext, useEffect, useState } from 'react';
import { onMaintenanceStatusChange, MaintenanceStatus } from '@/services/maintenanceService';

interface MaintenanceContextType {
  isMaintenance: boolean;
  maintenanceMessage: string;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenance: false,
  maintenanceMessage: '',
  loading: true,
});

export const useMaintenanceMode = () => useContext(MaintenanceContext);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<MaintenanceStatus>({ isActive: false, message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onMaintenanceStatusChange((newStatus) => {
      setStatus(newStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance: status.isActive,
        maintenanceMessage: status.message,
        loading,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};
