'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { pageTransitions, durations, easingFunctions } from './AnimationUtils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'entered' | 'exiting'>(
    'entered'
  );

  useEffect(() => {
    setTransitionStage('exiting');

    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('entering');

      setTimeout(() => {
        setTransitionStage('entered');
      }, 50);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  const getTransitionStyle = () => {
    switch (transitionStage) {
      case 'entering':
        return {
          animation: `${pageTransitions.slideUp} ${durations.normal} ${easingFunctions.easeOut}`,
          opacity: 0,
        };
      case 'entered':
        return {
          opacity: 1,
          transform: 'translateY(0)',
        };
      case 'exiting':
        return {
          opacity: 0,
          transform: 'translateY(10px)',
          transition: `all ${durations.fast} ${easingFunctions.easeIn}`,
        };
      default:
        return {};
    }
  };

  return (
    <div className={`transition-wrapper ${className}`} style={getTransitionStyle()}>
      {displayChildren}
    </div>
  );
}

// Higher-order component for page transitions
export function withPageTransition<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  transitionType: 'fadeIn' | 'slideUp' | 'scaleIn' = 'slideUp'
) {
  return function TransitionedComponent(props: P) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      setIsVisible(true);
    }, []);

    const animationStyle = {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      transition: `all ${durations.normal} ${easingFunctions.easeOut}`,
    };

    return (
      <div style={animationStyle}>
        <WrappedComponent {...props} />
      </div>
    );
  };
}

// Staggered children animation
export function StaggeredChildren({
  children,
  staggerDelay = 100,
  className = '',
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  const [visibleIndexes, setVisibleIndexes] = useState<Set<number>>(new Set());

  useEffect(() => {
    const childArray = React.Children.toArray(children);

    childArray.forEach((_, index) => {
      setTimeout(() => {
        setVisibleIndexes((prev) => new Set(prev).add(index));
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          style={{
            opacity: visibleIndexes.has(index) ? 1 : 0,
            transform: visibleIndexes.has(index) ? 'translateY(0)' : 'translateY(20px)',
            transition: `all ${durations.normal} ${easingFunctions.easeOut}`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Route transition wrapper
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (pathname !== currentPath) {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentPath(pathname);
        setIsTransitioning(false);
      }, 150);
    }
  }, [pathname, currentPath]);

  return (
    <div className="route-transition-container relative overflow-hidden">
      <div
        className={`transition-content ${isTransitioning ? 'transitioning' : ''}`}
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(-20px)' : 'translateX(0)',
          transition: `all ${durations.fast} ${easingFunctions.easeInOut}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
