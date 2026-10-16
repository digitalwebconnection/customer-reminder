import React, { createContext, useContext, useState, useEffect } from 'react';

const TimezoneContext = createContext();

export const DEFAULT_AU_TIMEZONE = 'Australia/Sydney';

export function TimezoneProvider({ children }) {
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    return localStorage.getItem('preferred_au_timezone') || DEFAULT_AU_TIMEZONE;
  });

  const setTimezone = (tz) => {
    setSelectedTimezone(tz);
    try {
      localStorage.setItem('preferred_au_timezone', tz);
    } catch (e) {}
  };

  return (
    <TimezoneContext.Provider value={{ selectedTimezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    return {
      selectedTimezone: DEFAULT_AU_TIMEZONE,
      setTimezone: () => {},
    };
  }
  return context;
}
