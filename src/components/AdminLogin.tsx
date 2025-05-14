
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    toast({
      title: "Admin access granted",
      description: "Welcome to admin panel",
    });
    navigate('/admin-panel');
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleAdminAccess}
      className="bg-slate-800 text-white hover:bg-slate-700"
    >
      Admin Access
    </Button>
  );
};

export default AdminLogin;
