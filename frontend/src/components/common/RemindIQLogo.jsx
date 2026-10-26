import React from "react";

/**
 * RemindIQ Official Logo
 * High-definition transparent logo matching the approved reference design:
 * - 3 vibrant ascending geometric shards (coral-red to orchid-purple)
 * - REMIND in bold dark charcoal
 * - IQ highlighted in radiant coral-rose to purple gradient
 */
export default function RemindIQLogo({
  className = "",
  size = "md", // "xs" | "sm" | "md" | "lg" | "xl"
  iconOnly = false,
  alt = "REMINDIQ",
}) {
  // Height presets for different placements
  const sizeMap = {
    xs: { h: "h-5 max-h-5", iconH: "h-5 w-5" },
    sm: { h: "h-6.5 max-h-6.5", iconH: "h-6.5 w-6.5" },
    md: { h: "h-7.5 sm:h-8 max-h-8", iconH: "h-7.5 w-7.5" },
    lg: { h: "h-9 sm:h-10 max-h-10", iconH: "h-9 w-9" },
    xl: { h: "h-12 sm:h-14 max-h-14", iconH: "h-12 w-12" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/remindiq-logo-icon.png"
          alt="RemindIQ Mark"
          className={`${currentSize.iconH} object-contain transition-transform duration-200 group-hover:scale-105`}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/remindiq-logo-full.png"
        alt={alt}
        className={`${currentSize.h} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
