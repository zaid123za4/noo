
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import dhanService from '@/services/dhanService';

export function useDemoMode() {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [usingRealMoney, setUsingRealMoney] = useState(false);

  useEffect(() => {
    // Check for demo parameter in URL
    const searchParams = new URLSearchParams(location.search);
    const isDemo = searchParams.get('demo') === 'true';
    const isReal = searchParams.get('real') === 'true';
    
    if (isDemo && !isDemoMode) {
      setIsDemoMode(true);
      
      // Add demo funds
      const demoFunds = 1000000; // 10 lakhs
      dhanService.addDemoFunds(demoFunds);
      
      toast({
        title: "Demo Mode Active",
        description: `You're now using a demo account with ₹${demoFunds.toLocaleString()} virtual funds`,
      });
    }

    // Check if user wants to use real money
    if (isReal && !usingRealMoney) {
      setUsingRealMoney(true);
      toast({
        title: "Real Money Trading Active",
        description: "Your wallet is now connected for real money trading",
      });
    }
  }, [location, isDemoMode, usingRealMoney]);

  return { 
    isDemoMode, 
    usingRealMoney,
    toggleRealMoney: () => setUsingRealMoney(!usingRealMoney)
  };
}
