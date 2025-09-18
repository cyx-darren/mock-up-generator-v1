import React, { useState, useEffect } from 'react';
import Button from './Button';


const MobileBottomBar = ({ onSignupClick, onDemoClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement?.scrollHeight;
      
      // Show when scrolled down and not at the very bottom
      const shouldShow = currentScrollY > 200 && 
                        currentScrollY < documentHeight - windowHeight - 100;
      
      setIsVisible(shouldShow);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!isVisible) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onDemoClick}
            iconName="Play"
            iconPosition="left"
            className="flex-1"
          >
            Demo
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSignupClick}
            iconName="Zap"
            iconPosition="left"
            className="flex-1 shadow-cta"
          >
            Start Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomBar;