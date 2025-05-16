
import React, { useEffect } from 'react';
import NotFoundComponent from '@/components/NotFound';
import { useLocation } from 'react-router-dom';

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the error for tracking purposes
    console.error(`404 error: Page not found at path ${location.pathname}`);
  }, [location]);
  
  return <NotFoundComponent />;
};

export default NotFound;
