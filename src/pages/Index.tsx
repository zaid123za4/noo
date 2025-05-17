
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Dhan Trading Dashboard</CardTitle>
          <CardDescription>
            Your personal trading portal powered by Dhan API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This application uses a static API token to access your Dhan trading account data.
            Click below to enter the dashboard.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => navigate('/dashboard')}>
            Enter Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
