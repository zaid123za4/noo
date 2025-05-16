
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import dhanService from '@/services/dhanService';
import { UserProfile, Funds, Order, TradeLog } from '@/services/tradingLearning';
import { adaptUserProfile, adaptFunds, adaptOrders, adaptTradeLogs, isErrorInstance } from '@/utils/typeAdapters';

export function useDashboardData() {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: '',
    user_name: '',
    email: '',
    user_type: ''
  });
  
  const [funds, setFunds] = useState<Funds>({
    equity: {
      available: {
        cash: 0,
        collateral: 0
      },
      utilized: {
        m2m_unrealised: 0
      }
    }
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<TradeLog[]>([]);
  
  // Effect to check login status and fetch user data
  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      
      try {
        // Check if user is logged in
        const loggedIn = await Promise.resolve(dhanService.isAuthenticated());
        setIsLoggedIn(!!loggedIn);
        
        if (loggedIn) {
          // Get user profile, funds, orders
          const profile = await dhanService.getProfile();
          const userFunds = await dhanService.getFunds();
          const userOrders = await dhanService.getOrders();
          const tradingLogs = await dhanService.getLogs();
          
          // Use our adapter functions to ensure type compatibility
          setUserProfile(adaptUserProfile(profile));
          setFunds(adaptFunds(userFunds));
          setOrders(adaptOrders(userOrders));
          setLogs(adaptTradeLogs(tradingLogs));
        }
      } catch (error) {
        if (isErrorInstance(error)) {
          console.error('Error checking login status:', error.message);
        } else {
          console.error('Unknown error checking login status');
        }
        
        // Show toast notification for error
        toast({
          title: "Authentication Error",
          description: "Could not verify login status. Please try again or log in.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, [toast]);
  
  return {
    isLoggedIn,
    isLoading,
    userProfile,
    funds,
    orders,
    logs
  };
}
