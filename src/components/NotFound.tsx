
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg overflow-hidden p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-medium text-muted-foreground">Page Not Found</p>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist or you may have entered an incorrect URL.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button onClick={() => navigate('/')} className="w-full">
            Return to Home
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
