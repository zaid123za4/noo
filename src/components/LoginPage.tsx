
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import zerodhaService from '@/services/zerodhaService';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // In a real app, this would redirect to Zerodha OAuth
  const handleLogin = async () => {
    try {
      // In production, this would redirect to the Zerodha login page
      await zerodhaService.login();
      
      // For demo purposes, we'll simulate a successful login
      const success = await zerodhaService.handleCallback('mock_request_token');
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Zerodha Auto Trader
          </CardTitle>
          <CardDescription>
            Log in with your Zerodha account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2 rounded-md border p-4">
            <AlertCircle className="h-5 w-5 text-trade-neutral" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Demo Mode</p>
              <p className="text-xs text-muted-foreground">
                This is a simulation. No real trades will be executed.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full font-semibold" onClick={handleLogin}>
            Connect to Zerodha
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
