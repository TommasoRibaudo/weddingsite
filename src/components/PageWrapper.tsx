'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      // Phase 1: fade out current content
      el.style.transition = 'opacity 220ms ease-out';
      el.style.opacity = '0';

      const timer = setTimeout(() => {
        // Phase 2: reset inline styles and replay the enter animation
        el.style.transition = '';
        el.style.opacity = '';
        el.style.animation = 'none';
        void el.offsetHeight; // force reflow to restart animation
        el.style.animation = '';
      }, 240);

      prevPathname.current = pathname;
      return () => clearTimeout(timer);
    }

    prevPathname.current = pathname;
  }, [pathname]);

  return (
    <div ref={ref} className="animate-page-in">
      {children}
    </div>
  );
}
