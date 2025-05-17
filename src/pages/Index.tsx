
import React, { useEffect } from 'react';
import LoginPage from '@/components/LoginPage';
import { useNavigate } from 'react-router-dom';
import dhanService from '@/services/dhanService';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already authenticated, redirect to dashboard
    if (dhanService.isAuthenticated()) {
      navigate('/dashboard');
    }
    
    // Check URL for demo parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === 'true';
    
    if (isDemo) {
      // If demo parameter is present, redirect to dashboard with demo mode
      navigate('/dashboard?demo=true');
    }
  }, [navigate]);
  
  return <LoginPage />;
};

export default Index;
