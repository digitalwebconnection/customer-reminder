import React, { useEffect, useRef, useState } from "react";

/**
 * Magic UI - NumberTicker Component
 * Smoothly animates numbers up or down to target count with cubic ease-out interpolation
 */
export function NumberTicker({
  value = 0,
  startValue = 0,
  duration = 800,
  decimalPlaces = 0,
  className = "",
}) {
  const [displayValue, setDisplayValue] = useState(startValue);
  const startTimeRef = useRef(null);
  const startValRef = useRef(startValue);

  useEffect(() => {
    let animationFrameId;
    startValRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValRef.current + (value - startValRef.current) * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = Intl.NumberFormat("en-AU", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Number(displayValue.toFixed(decimalPlaces)));

  return (
    <span className={`inline-block tabular-nums font-mono ${className}`}>
      {formatted}
    </span>
  );
}

export default NumberTicker;
