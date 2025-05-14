
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const AdminLogin: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [enteredCode, setEnteredCode] = useState<string>('');
  const correctPasscode = '2580';
  const navigate = useNavigate();

  const handleNumberClick = (num: number) => {
    if (enteredCode.length < 4) {
      setEnteredCode(prev => prev + num);
    }
  };

  const handleClear = () => {
    setEnteredCode('');
  };

  const handleBackspace = () => {
    setEnteredCode(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    // Check if entered code is correct
    if (enteredCode.length === 4) {
      if (enteredCode === correctPasscode) {
        toast({
          title: "Admin access granted",
          description: "Welcome to admin panel",
        });
        setIsOpen(false);
        navigate('/admin-panel');
      } else {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Incorrect passcode",
        });
        handleClear();
      }
    }
  }, [enteredCode, navigate]);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="bg-slate-800 text-white hover:bg-slate-700"
      >
        Admin Access
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Admin Authentication</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-xs bg-slate-100 p-2 rounded-md text-center text-2xl font-bold h-12 flex items-center justify-center">
              {enteredCode.split('').map((_, i) => '•').join('')}
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button 
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-12 w-12 text-xl font-bold"
                >
                  {num}
                </Button>
              ))}
              <Button onClick={handleClear} className="h-12 w-12 bg-red-500 hover:bg-red-600">C</Button>
              <Button onClick={() => handleNumberClick(0)} className="h-12 w-12 text-xl font-bold">0</Button>
              <Button onClick={handleBackspace} className="h-12 w-12 bg-yellow-500 hover:bg-yellow-600">←</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminLogin;
