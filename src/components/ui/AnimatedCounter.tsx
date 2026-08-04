import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const startRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = 0;
    startTimeRef.current = null;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startRef.current + (value - startRef.current) * easedProgress;

      if (ref.current) {
        ref.current.textContent = `${prefix}${currentValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
