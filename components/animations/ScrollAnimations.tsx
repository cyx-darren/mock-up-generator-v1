'use client';

import React, { useState, useEffect, useRef } from 'react';
import { scrollAnimations, durations, easingFunctions } from './AnimationUtils';

// Hook for intersection observer
function useIntersectionObserver(threshold = 0.1, rootMargin = '0px 0px -50px 0px') {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsIntersecting(true);
          setHasAnimated(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasAnimated]);

  return { ref, isIntersecting, hasAnimated };
}

// Reveal animation on scroll
export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = '600ms',
  className = '',
}: {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: string;
  className?: string;
}) {
  const { ref, isIntersecting } = useIntersectionObserver();

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(40px)';
      case 'down':
        return 'translateY(-40px)';
      case 'left':
        return 'translateX(40px)';
      case 'right':
        return 'translateX(-40px)';
      default:
        return 'translateY(40px)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isIntersecting ? 1 : 0,
        transform: isIntersecting ? 'translate(0)' : getInitialTransform(),
        transition: `all ${duration} ${easingFunctions.easeOut}`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Staggered scroll reveal
export function StaggeredScrollReveal({
  children,
  staggerDelay = 100,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}) {
  const { ref, isIntersecting } = useIntersectionObserver();

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollReveal
          key={index}
          direction={direction}
          delay={isIntersecting ? index * staggerDelay : 0}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

// Parallax scroll effect
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = '',
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const scrollTop = window.pageYOffset;
      const rate = scrollTop * -speed;
      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          transform: `translateY(${offset}px)`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Count up animation
export function CountUp({
  end,
  start = 0,
  duration = 2000,
  className = '',
  suffix = '',
  prefix = '',
}: {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(start);
  const { ref, isIntersecting } = useIntersectionObserver();

  useEffect(() => {
    if (!isIntersecting) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (end - start) + start));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isIntersecting, start, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Progress bar reveal
export function ProgressReveal({
  progress,
  color = 'blue-500',
  height = '8px',
  className = '',
}: {
  progress: number;
  color?: string;
  height?: string;
  className?: string;
}) {
  const { ref, isIntersecting } = useIntersectionObserver();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (!isIntersecting) return;

    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [isIntersecting, progress]);

  return (
    <div
      ref={ref}
      className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className={`bg-${color} rounded-full h-full transition-all duration-1000 ease-out`}
        style={{
          width: `${Math.min(100, Math.max(0, animatedProgress))}%`,
        }}
      />
    </div>
  );
}

// Typewriter effect
export function TypeWriter({
  text,
  speed = 100,
  className = '',
  cursor = '|',
}: {
  text: string;
  speed?: number;
  className?: string;
  cursor?: string;
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const { ref, isIntersecting } = useIntersectionObserver();

  useEffect(() => {
    if (!isIntersecting) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setShowCursor(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, isIntersecting]);

  useEffect(() => {
    if (!showCursor) return;

    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, [showCursor]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        {cursor}
      </span>
    </span>
  );
}

// Scroll triggered fade in/out
export function ScrollFade({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      let newOpacity = 1;

      if (rect.top < 0) {
        newOpacity = Math.max(0, 1 + rect.top / 200);
      } else if (rect.bottom > windowHeight) {
        const overflow = rect.bottom - windowHeight;
        newOpacity = Math.max(0, 1 - overflow / 200);
      }

      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity,
        transition: 'opacity 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// Sticky reveal header
export function StickyRevealHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`transition-transform duration-300 ${className}`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      {children}
    </div>
  );
}
