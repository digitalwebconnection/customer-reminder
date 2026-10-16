import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUSTRALIAN_TIMEZONES, DEFAULT_AUSTRALIAN_TIMEZONE } from '../utils/timezones';
import api from '../api/axios';

const TimezoneContext = createContext();

export function TimezoneProvider({ children }) {
  const [timezone, setTimezoneState] = useState(() => {
    return localStorage.getItem('user_timezone') || DEFAULT_AUSTRALIAN_TIMEZONE;
  });

  const [currentTzTime, setCurrentTzTime] = useState('');

  // Fetch settings from server on mount
  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data?.data?.timezone) {
          setTimezoneState(res.data.data.timezone);
          localStorage.setItem('user_timezone', res.data.data.timezone);
        }
      })
      .catch(() => {
        // Fallback to local storage or default
      });
  }, []);

  // Update live clock in selected timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-AU', {
          timeZone: timezone,
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setCurrentTzTime(timeStr);
      } catch (err) {
        setCurrentTzTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const setTimezone = async (newTz) => {
    setTimezoneState(newTz);
    localStorage.setItem('user_timezone', newTz);
    try {
      await api.patch('/settings', { timezone: newTz });
    } catch (err) {
      console.warn('Could not persist timezone to server:', err);
    }
  };

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        setTimezone,
        currentTzTime,
        supportedTimezones: AUSTRALIAN_TIMEZONES,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}
