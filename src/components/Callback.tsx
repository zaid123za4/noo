
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import dhanService from '@/services/dhanService';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const Callback = () => {
  const [status, setStatus] = useState('Authorizing...');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        
        if (!code) {
          toast({
            variant: "destructive",
            title: "Authorization failed",
            description: "No authorization code was received from Dhan.",
          });
          navigate('/');
          return;
        }
        
        setStatus('Processing your authorization...');
        
        // Exchange the code for an access token
        const success = await dhanService.handleCallback(code);
        
        if (success) {
          setStatus('Setting up your trading dashboard...');
          
          toast({
            title: "Login successful",
            description: "You have been authenticated with Dhan",
          });
          
          // Redirect to dashboard after a slight delay to show the message
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Login failed:', error);
        setStatus('Authentication failed');
        
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Could not authenticate with Dhan. Please try again.",
        });
        
        // Redirect back to login page after showing the error
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [location, navigate]);
  
  const handleManualRedirect = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-center text-muted-foreground">
            You're being securely redirected after successfully authenticating with Dhan.
          </p>
          
          <div className="flex items-center space-x-2 py-4">
            <Loader className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{status}</span>
          </div>
          
          <p className="text-sm text-center">
            If you aren't redirected automatically in a few seconds,{" "}
            <button 
              onClick={handleManualRedirect}
              className="text-primary hover:underline focus:outline-none"
            >
              click here
            </button>{" "}
            to continue.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Callback;
