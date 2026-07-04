'use client';
import { useRef, useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  scale?: boolean;
  as?: 'div' | 'li' | 'section' | 'article';
};

export default function Reveal({ children, delay = 0, className = '', scale = false, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cls = `${scale ? 'reveal-scale' : 'reveal'} ${inView ? 'is-visible' : ''} ${className}`.trim();
  const El = Tag as 'div';
  return (
    <El
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cls}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </El>
  );
}
