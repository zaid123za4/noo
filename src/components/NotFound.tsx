
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft, RefreshCcw } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  // Extract error details from URL if they exist
  const urlParams = new URLSearchParams(window.location.search);
  const errorType = urlParams.get('type') || 'not-found';
  const errorCode = urlParams.get('code') || '404';
  const errorMessage = urlParams.get('message') || 'The page you\'re looking for doesn\'t exist or you may have entered an incorrect URL.';
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg overflow-hidden p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{errorCode}</h1>
          <p className="text-xl font-medium text-muted-foreground">
            {errorType === 'not-found' ? 'Page Not Found' : 'An Error Occurred'}
          </p>
          <p className="text-muted-foreground text-sm">
            {errorMessage}
          </p>
          
          {errorType !== 'not-found' && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800 w-full">
              <p className="font-medium">If you're seeing this error:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Try refreshing the page</li>
                <li>Check your network connection</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button onClick={() => navigate('/')} className="w-full flex items-center justify-center">
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              className="w-full"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
