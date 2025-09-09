'use client';

import React, { useRef, useCallback, ReactNode } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  minDistance?: number;
  maxTime?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

// Enhanced swipe gesture hook
export function useSwipeGestures(handlers: SwipeHandlers, config: SwipeConfig = {}) {
  const {
    minDistance = 50,
    maxTime = 300,
    velocityThreshold = 0.3,
    preventScroll = false
  } = config;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventScroll && touchStart.current) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || e.changedTouches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Check if swipe meets minimum criteria
    if (deltaTime <= maxTime && velocity >= velocityThreshold) {
      // Determine primary direction
      if (absX > absY && absX > minDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absY > absX && absY > minDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    touchStart.current = null;
  }, [handlers, minDistance, maxTime, velocityThreshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

// Swipeable container component
export function SwipeContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = '',
  preventScroll = false,
  minDistance = 50,
  showSwipeIndicators = false
}: {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  preventScroll?: boolean;
  minDistance?: number;
  showSwipeIndicators?: boolean;
}) {
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  }, {
    minDistance,
    preventScroll
  });

  return (
    <div
      className={`relative ${className}`}
      {...swipeHandlers}
    >
      {children}
      
      {/* Optional swipe indicators */}
      {showSwipeIndicators && (
        <div className="absolute inset-0 pointer-events-none">
          {onSwipeLeft && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          )}
          {onSwipeRight && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
          {onSwipeUp && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-400 opacity-30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          )}
          {onSwipeDown && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gray-400 opacity-30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Swipeable card stack
export function SwipeCardStack({
  items,
  onSwipeLeft,
  onSwipeRight,
  renderCard,
  className = ''
}: {
  items: any[];
  onSwipeLeft?: (item: any, index: number) => void;
  onSwipeRight?: (item: any, index: number) => void;
  renderCard: (item: any, index: number) => ReactNode;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleSwipeLeft = useCallback(() => {
    if (currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      onSwipeLeft?.(items[currentIndex], currentIndex);
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, items, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    if (currentIndex < items.length - 1) {
      const nextIndex = currentIndex + 1;
      onSwipeRight?.(items[currentIndex], currentIndex);
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, items, onSwipeRight]);

  if (currentIndex >= items.length) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-lg font-medium">All done!</p>
          <p className="text-sm">You've gone through all items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <SwipeContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        showSwipeIndicators={true}
        className="relative"
      >
        {renderCard(items[currentIndex], currentIndex)}
        
        {/* Next card preview (slightly visible behind) */}
        {currentIndex + 1 < items.length && (
          <div className="absolute inset-0 -z-10 transform scale-95 opacity-50">
            {renderCard(items[currentIndex + 1], currentIndex + 1)}
          </div>
        )}
      </SwipeContainer>
      
      {/* Progress indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {items.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-500' : index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Swipeable tabs
export function SwipeTabs({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: {
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
  
  const handleSwipeLeft = useCallback(() => {
    const nextIndex = (activeIndex + 1) % tabs.length;
    onTabChange(tabs[nextIndex].id);
  }, [activeIndex, tabs, onTabChange]);

  const handleSwipeRight = useCallback(() => {
    const prevIndex = activeIndex === 0 ? tabs.length - 1 : activeIndex - 1;
    onTabChange(tabs[prevIndex].id);
  }, [activeIndex, tabs, onTabChange]);

  const activeContent = tabs[activeIndex]?.content;

  return (
    <div className={className}>
      {/* Tab headers */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab.id === activeTab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <SwipeContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        className="min-h-[200px]"
      >
        {activeContent}
      </SwipeContainer>
      
      {/* Swipe hint */}
      <div className="text-center mt-2 text-xs text-gray-400">
        Swipe left or right to change tabs
      </div>
    </div>
  );
}

// Dismissible notification with swipe to dismiss
export function SwipeDismissNotification({
  children,
  onDismiss,
  className = '',
  position = 'top'
}: {
  children: ReactNode;
  onDismiss: () => void;
  className?: string;
  position?: 'top' | 'bottom';
}) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [translateX, setTranslateX] = React.useState(0);
  
  const touchStart = useRef<{ x: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0].clientX,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStart.current.x;
    setTranslateX(deltaX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current) return;

    const threshold = 100; // Minimum distance to dismiss
    if (Math.abs(translateX) > threshold) {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Allow animation to complete
    } else {
      setTranslateX(0); // Snap back
    }

    touchStart.current = null;
  }, [translateX, onDismiss]);

  if (!isVisible) return null;

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4';

  return (
    <div
      className={`fixed left-4 right-4 ${positionClasses} z-50 transform transition-all duration-300 ${className}`}
      style={{
        transform: `translateX(${translateX}px) ${!isVisible ? 'scale(0.8) opacity-0' : ''}`,
        opacity: 1 - Math.abs(translateX) / 200
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-white rounded-lg shadow-lg border p-4 relative">
        {children}
        
        {/* Dismiss hint */}
        {Math.abs(translateX) > 20 && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-90 text-white text-sm font-medium rounded-lg">
            Release to dismiss
          </div>
        )}
      </div>
    </div>
  );
}