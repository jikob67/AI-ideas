import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ProjectType, Usage } from '../types';
import { DAILY_LIMITS, PRO_LIMITS, MONTHLY_LIMITS, PRO_MONTHLY_LIMITS } from '../constants';
import { useAuth } from '../hooks/useAuth';

interface UsageContextType {
  usage: Usage;
  incrementUsage: (feature: ProjectType, amount?: number) => void;
  isLimitReached: (feature: ProjectType, amount?: number) => boolean;
}

const initialUsage = Object.keys(ProjectType).reduce((acc, key) => {
  acc[key as ProjectType] = 0;
  return acc;
}, {} as Usage);

export const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const UsageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, updateUser } = useAuth();
  const [dailyUsage, setDailyUsage] = useState<Usage>(initialUsage);
  const [monthlyUsage, setMonthlyUsage] = useState<Usage>(initialUsage);
  
  useEffect(() => {
    if (!currentUser?.email) return;
    
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM

    // Daily usage logic
    const DAILY_USAGE_DATE_KEY = `usageDate_${currentUser.email}`;
    const DAILY_USAGE_KEY = `dailyUsage_${currentUser.email}`;
    const storedDailyDate = localStorage.getItem(DAILY_USAGE_DATE_KEY);
    const storedDailyUsage = localStorage.getItem(DAILY_USAGE_KEY);

    if (storedDailyDate === today && storedDailyUsage) {
      setDailyUsage(JSON.parse(storedDailyUsage));
    } else {
      localStorage.setItem(DAILY_USAGE_DATE_KEY, today);
      localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(initialUsage));
      setDailyUsage(initialUsage);
    }
    
    // Monthly usage logic
    const MONTHLY_USAGE_DATE_KEY = `monthlyUsageDate_${currentUser.email}`;
    const MONTHLY_USAGE_KEY = `monthlyUsage_${currentUser.email}`;
    const storedMonthlyDate = localStorage.getItem(MONTHLY_USAGE_DATE_KEY);
    const storedMonthlyUsage = localStorage.getItem(MONTHLY_USAGE_KEY);

    if (storedMonthlyDate === thisMonth && storedMonthlyUsage) {
      setMonthlyUsage(JSON.parse(storedMonthlyUsage));
    } else {
      localStorage.setItem(MONTHLY_USAGE_DATE_KEY, thisMonth);
      localStorage.setItem(MONTHLY_USAGE_KEY, JSON.stringify(initialUsage));
      setMonthlyUsage(initialUsage);
    }

  }, [currentUser]);

  const updateStoredUsage = (newUsage: Usage, type: 'daily' | 'monthly') => {
    if (!currentUser?.email) return;
    if (type === 'daily') {
        const DAILY_USAGE_KEY = `dailyUsage_${currentUser.email}`;
        localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(newUsage));
        setDailyUsage(newUsage);
    } else {
        const MONTHLY_USAGE_KEY = `monthlyUsage_${currentUser.email}`;
        localStorage.setItem(MONTHLY_USAGE_KEY, JSON.stringify(newUsage));
        setMonthlyUsage(newUsage);
    }
  };

  const isLimitReached = useCallback((feature: ProjectType, amount = 1): boolean => {
    if (!currentUser) return true;
    if (currentUser.plan === 'premium') return false;

    // Check for monthly limits first
    const monthlyLimit = currentUser.plan === 'pro' ? PRO_MONTHLY_LIMITS[feature] : MONTHLY_LIMITS[feature];
    if (monthlyLimit !== undefined) {
        return (monthlyUsage[feature] || 0) + amount > monthlyLimit;
    }

    // Fallback to daily limits
    const dailyLimit = currentUser.plan === 'pro' ? PRO_LIMITS[feature] : DAILY_LIMITS[feature];
    if (dailyLimit !== undefined) {
        return (dailyUsage[feature] || 0) + amount > dailyLimit;
    }

    return false; // No limit defined
  }, [dailyUsage, monthlyUsage, currentUser]);

  const incrementUsage = useCallback((feature: ProjectType, amount = 1): void => {
    if (!currentUser || currentUser.plan === 'premium') return;
    
    // Assume limit has been checked before calling this function.
    const isMonthly = MONTHLY_LIMITS[feature] !== undefined;

    if (isMonthly) {
        const newUsage = { ...monthlyUsage, [feature]: (monthlyUsage[feature] || 0) + amount };
        updateStoredUsage(newUsage, 'monthly');
    } else {
        const newUsage = { ...dailyUsage, [feature]: (dailyUsage[feature] || 0) + amount };
        updateStoredUsage(newUsage, 'daily');
    }

    // Award points for usage
    const pointsPerAction = 10;
    const newPoints = (currentUser.points || 0) + (amount * pointsPerAction);
    updateUser({ points: newPoints });
  }, [dailyUsage, monthlyUsage, currentUser, updateUser]);

  // Merge usages for the context value for simplicity in components that don't care about the type of limit
  const combinedUsage = { ...dailyUsage, ...monthlyUsage };

  return (
    <UsageContext.Provider value={{ usage: combinedUsage, incrementUsage, isLimitReached }}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = React.useContext(UsageContext);
  if (context === undefined) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};