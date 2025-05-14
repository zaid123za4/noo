
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn } from 'lucide-react';
import dhanService from '@/services/dhanService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import AdminLogin from '@/components/AdminLogin';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we have a code in the URL (after OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);
  
  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      // Exchange the code for an access token
      const success = await dhanService.handleCallback(code);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "You have been authenticated with Dhan",
        });
        navigate('/dashboard');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Could not authenticate with Dhan. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = () => {
    setIsLoading(true);
    try {
      // Redirect to Dhan OAuth page
      const authUrl = dhanService.getOAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login initiation failed:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Could not initiate Dhan authentication. Please try again.",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Dhan Auto Trader
          </CardTitle>
          <CardDescription>
            Log in with your Dhan account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2 rounded-md border p-4">
            <AlertCircle className="h-5 w-5 text-trade-neutral" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Connect Your Account</p>
              <p className="text-xs text-muted-foreground">
                Log in with your Dhan account to start automated trading.
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Login with Dhan"}
            {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <div className="flex justify-center">
            <AdminLogin />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
