import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackToHomeProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const BackToHome: React.FC<BackToHomeProps> = ({ 
  className = '', 
  variant = 'ghost',
  size = 'default'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate('/')}
      className={`text-muted-foreground hover:text-foreground ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Home
    </Button>
  );
};

export default BackToHome;