import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // Every 1 minute: 00 to 59
const PERIODS = ['AM', 'PM'];

const ITEM_HEIGHT = 38; // Height in px for each wheel row

/**
 * Reusable vertical wheel column with PURE MOUSE WHEEL SCROLLING, DRAG, TOUCH & CLICK
 * Clearly displays upper number, selected center number, and lower number.
 */
function WheelColumn({ items, selectedValue, onSelect, formatLabel }) {
  const containerRef = useRef(null);
  const selectedIndex = Math.max(0, items.indexOf(selectedValue));
  const targetIndexRef = useRef(selectedIndex);
  const isInteractingRef = useRef(false);
  const wheelResetTimerRef = useRef(null);
  const wheelAccumulatorRef = useRef(0);
  const touchScrollTimerRef = useRef(null);

  // Mouse drag interaction refs
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startYRef = useRef(0);
  const startScrollTopRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  // Sync targetIndexRef whenever selectedValue changes
  useEffect(() => {
    targetIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Initial scroll into center position on mount & when opened
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
      const raf = requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  // Sync scroll if selectedValue changed externally and user is NOT interacting
  useEffect(() => {
    if (containerRef.current && !isInteractingRef.current) {
      const targetScroll = selectedIndex * ITEM_HEIGHT;
      if (Math.abs(containerRef.current.scrollTop - targetScroll) > 1) {
        containerRef.current.scrollTop = targetScroll;
      }
    }
  }, [selectedIndex]);

  // Dedicated Mouse Wheel Scroll Handler - Pure Mouse Scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      isInteractingRef.current = true;
      clearTimeout(wheelResetTimerRef.current);

      const direction = e.deltaY > 0 ? 1 : -1;
      let delta = Math.abs(e.deltaY);
      if (e.deltaMode === 1) delta *= 38; // DOM_DELTA_LINE
      if (e.deltaMode === 2) delta *= 380; // DOM_DELTA_PAGE

      let steps = 1;
      if (delta >= 180) {
        steps = Math.min(5, Math.floor(delta / 90));
      } else if (delta < 38) {
        wheelAccumulatorRef.current += e.deltaY;
        if (Math.abs(wheelAccumulatorRef.current) >= 25) {
          steps = 1;
          wheelAccumulatorRef.current = 0;
        } else {
          return;
        }
      }

      const current = targetIndexRef.current;
      const nextIndex = Math.max(0, Math.min(items.length - 1, current + direction * steps));

      if (nextIndex !== current) {
        targetIndexRef.current = nextIndex;
        el.scrollTo({
          top: nextIndex * ITEM_HEIGHT,
          behavior: 'smooth',
        });
        onSelect(items[nextIndex]);
      }

      wheelResetTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
        wheelAccumulatorRef.current = 0;
      }, 250);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelResetTimerRef.current);
    };
  }, [items, onSelect]);

  // Mouse Drag-To-Slide Handler
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !containerRef.current) return;
    isDraggingRef.current = true;
    isInteractingRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startScrollTopRef.current = containerRef.current.scrollTop;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    const handleWindowMouseMove = (moveEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const currentY = moveEvent.clientY;
      const deltaY = currentY - startYRef.current;

      if (Math.abs(deltaY) > 3) {
        hasMovedRef.current = true;
      }

      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = (lastYRef.current - currentY) / dt;
      }
      lastYRef.current = currentY;
      lastTimeRef.current = now;

      const newScroll = startScrollTopRef.current - deltaY;
      containerRef.current.scrollTop = newScroll;

      const liveIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.round(newScroll / ITEM_HEIGHT))
      );
      if (items[liveIndex] && items[liveIndex] !== selectedValue) {
        targetIndexRef.current = liveIndex;
        onSelect(items[liveIndex]);
      }
    };

    const handleWindowMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      if (!containerRef.current) return;

      const flick = velocityRef.current;
      let finalIndex;
      if (Math.abs(flick) > 0.3) {
        const momentumDistance = flick * 70;
        const targetScroll = containerRef.current.scrollTop + momentumDistance;
        finalIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(targetScroll / ITEM_HEIGHT))
        );
      } else {
        finalIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(containerRef.current.scrollTop / ITEM_HEIGHT))
        );
      }

      targetIndexRef.current = finalIndex;
      containerRef.current.scrollTo({
        top: finalIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      if (items[finalIndex]) {
        onSelect(items[finalIndex]);
      }

      setTimeout(() => {
        isInteractingRef.current = false;
      }, 200);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Touch scroll live updates & smooth snap for mobile touch devices
  const handleScroll = (e) => {
    if (isDraggingRef.current || isInteractingRef.current) return;
    const scrollTop = e.currentTarget.scrollTop;
    const liveIndex = Math.max(0, Math.min(items.length - 1, Math.round(scrollTop / ITEM_HEIGHT)));
    if (items[liveIndex] && items[liveIndex] !== selectedValue) {
      targetIndexRef.current = liveIndex;
      onSelect(items[liveIndex]);
    }

    // Auto-snap cleanly to nearest center row after mobile touch gesture completes
    clearTimeout(touchScrollTimerRef.current);
    touchScrollTimerRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const finalScrollTop = containerRef.current.scrollTop;
      const finalIndex = Math.max(0, Math.min(items.length - 1, Math.round(finalScrollTop / ITEM_HEIGHT)));
      const targetScroll = finalIndex * ITEM_HEIGHT;
      if (Math.abs(finalScrollTop - targetScroll) > 1) {
        containerRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }
      if (items[finalIndex] && items[finalIndex] !== selectedValue) {
        onSelect(items[finalIndex]);
      }
    }, 120);
  };

  const handleItemClick = (index, item) => {
    if (hasMovedRef.current) return;
    targetIndexRef.current = index;
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });
    }
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onMouseDown={handleMouseDown}
      style={{
        height: ITEM_HEIGHT * 3,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y relative z-0 cursor-grab active:cursor-grabbing select-none [&::-webkit-scrollbar]:hidden"
    >
      {/* Top spacer so index 0 centers in middle row */}
      <div style={{ height: ITEM_HEIGHT }} className="shrink-0 pointer-events-none" />

      {items.map((item, index) => {
        const isSelected = item === selectedValue;
        return (
          <button
            key={item}
            type="button"
            onClick={() => handleItemClick(index, item)}
            style={{ height: ITEM_HEIGHT }}
            className={`w-full flex items-center justify-center transition-all duration-150 select-none cursor-pointer outline-hidden ${
              isSelected
                ? 'text-white text-base sm:text-sm font-extrabold tracking-tight scale-105'
                : 'text-zinc-400 hover:text-zinc-200 text-xs sm:text-xs font-medium opacity-80 hover:opacity-100'
            }`}
          >
            {formatLabel ? formatLabel(item) : item}
          </button>
        );
      })}

      {/* Bottom spacer so last index centers in middle row */}
      <div style={{ height: ITEM_HEIGHT }} className="shrink-0 pointer-events-none" />
    </div>
  );
}

export default function VisualTimePicker({
  value,
  onChange,
  label = 'Call Time',
  required = true,
  timezoneHint,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    left: 0,
    width: 260,
    openUp: false,
  });

  // Parse value ('HH:mm') into hour ('01'-'12'), minute ('00'-'59'), period ('AM'|'PM')
  const parseTime = (val) => {
    if (!val) return { hour: '10', minute: '00', period: 'AM' };
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 10;
    const m = mStr ? String(parseInt(mStr, 10) || 0).padStart(2, '0') : '00';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour: String(h).padStart(2, '0'), minute: m, period };
  };

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
    }
  }, [value]);

  // Responsive floating position calculation (full width of button on mobile, aligned on desktop)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    // Full width of trigger button on mobile screen, or aligned width on desktop
    const dropdownWidth = isMobile
      ? Math.min(rect.width, window.innerWidth - 24)
      : Math.max(220, Math.min(rect.width, 320));

    const dropdownHeight = 172; // 38 * 3 (114px) + button (38px) + padding

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Open upwards only if space below is limited and space above is sufficient
    const openUp = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

    let top = openUp ? rect.top - dropdownHeight - 6 : rect.bottom + 6;
    top = Math.max(8, Math.min(window.innerHeight - dropdownHeight - 8, top));

    // On mobile, align left edge directly with trigger button (full width)
    let left = isMobile ? rect.left : (rect.right - dropdownWidth);
    if (left < 12) left = 12;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = window.innerWidth - dropdownWidth - 12;
    }

    setDropdownCoords({ top, left, width: dropdownWidth, openUp });
  }, []);

  // Handle position recalculation, scroll/resize, outside click & escape
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const formatDisplayTime = (val) => {
    if (!val) return '';
    const { hour, minute, period } = parseTime(val);
    return `${hour}:${minute} ${period}`;
  };

  const emitTime = useCallback(
    (h, m, p) => {
      let hNum = parseInt(h, 10);
      if (p === 'PM' && hNum < 12) hNum += 12;
      if (p === 'AM' && hNum === 12) hNum = 0;
      const time24 = `${String(hNum).padStart(2, '0')}:${m}`;
      onChange(time24);
    },
    [onChange]
  );

  const handleHourSelect = (h) => {
    setSelectedHour(h);
    emitTime(h, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (m) => {
    setSelectedMinute(m);
    emitTime(selectedHour, m, selectedPeriod);
  };

  const handlePeriodSelect = (p) => {
    setSelectedPeriod(p);
    emitTime(selectedHour, selectedMinute, p);
  };

  return (
    <div className="relative w-full">
      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm text-left transition cursor-pointer select-none ${
          isOpen
            ? 'border-slate-500/80 ring-2 ring-slate-500/20 bg-zinc-900 text-white shadow-inner'
            : 'border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 shadow-inner'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="font-mono font-bold text-white text-sm tracking-wide">
            {formatDisplayTime(value) || `${selectedHour}:${selectedMinute} ${selectedPeriod}`}
          </span>
        </div>

    
      </button>

      {timezoneHint && (
        <p className="text-[11px] text-zinc-500 mt-1 font-mono">
          {timezoneHint}
        </p>
      )}

      {/* Full-width on mobile screen, with clearly visible upper and lower numbers */}
      {isOpen &&
        createPortal(
          <>
            {/* Mobile backdrop to dismiss cleanly on outside tap without triggering background fields */}
            <div
              className="fixed inset-0 z-99998 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            <div
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: `${dropdownCoords.top}px`,
                left: `${dropdownCoords.left}px`,
                width: `${dropdownCoords.width}px`,
                zIndex: 99999,
              }}
              className="bg-[#121217] border border-zinc-800 rounded-xl shadow-xl p-2 select-none animate-fade-in space-y-1.5"
            >
              {/* iOS Cylinder Wheel Drum (3 rows = upper number, selected center number, lower number) */}
              <div className="relative flex items-center justify-center bg-zinc-950/80 rounded-lg border border-zinc-800/80 overflow-hidden shadow-inner">
                {/* Center Selection Highlight Bar */}
                <div
                  style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
                  className="absolute left-1 right-1 rounded-md bg-white/10 border border-white/20 pointer-events-none shadow-xs z-0"
                />

                {/* Column 1: Hours (01 to 12) */}
                <WheelColumn
                  items={HOURS}
                  selectedValue={selectedHour}
                  onSelect={handleHourSelect}
                />

                {/* Colon Divider */}
                <div className="text-zinc-300 font-bold text-sm px-1 z-10 pointer-events-none select-none">
                  :
                </div>

                {/* Column 2: Minutes (00 to 59: 1-by-1 minute step) */}
                <WheelColumn
                  items={MINUTES}
                  selectedValue={selectedMinute}
                  onSelect={handleMinuteSelect}
                />

                {/* Column 3: AM / PM */}
                <WheelColumn
                  items={PERIODS}
                  selectedValue={selectedPeriod}
                  onSelect={handlePeriodSelect}
                />

                {/* Subtle top edge fade that does NOT hide the upper number */}
                <div
                  style={{ height: 8 }}
                  className="absolute top-0 left-0 right-0 bg-linear-to-b from-[#121217]/50 to-transparent pointer-events-none z-10"
                />

                {/* Subtle bottom edge fade that does NOT hide the lower number */}
                <div
                  style={{ height: 8 }}
                  className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#121217]/50 to-transparent pointer-events-none z-10"
                />
              </div>

              {/* Compact Bottom Confirm Action (Min 36px tap target on mobile) */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-1.5 min-h-9"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
