
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import dhanService from '@/services/dhanService';

export function useDemoMode() {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check for demo parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const isDemo = searchParams.get('demo') === 'true';
    
    if (isDemo && !isDemoMode) {
      setIsDemoMode(true);
      
      // Add demo funds
      const demoFunds = 1000000; // 10 lakhs
      // Updating funds directly since addDemoFunds doesn't exist
      if (dhanService.mockFunds) {
        dhanService.mockFunds.equity.available.cash = demoFunds;
        dhanService.addLog("Demo mode activated with ₹" + demoFunds.toLocaleString(), "info");
      }
      
      toast({
        title: "Demo Mode Active",
        description: `You're now using a demo account with ₹${demoFunds.toLocaleString()} virtual funds`,
      });
    }
  }, [location, isDemoMode]);

  return isDemoMode;
}
