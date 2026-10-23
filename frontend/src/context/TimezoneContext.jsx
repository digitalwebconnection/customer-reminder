import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const TimezoneContext = createContext();

export const DEFAULT_AU_TIMEZONE = "Australia/Sydney";
export const DEFAULT_IN_TIMEZONE = "Asia/Kolkata";

export function TimezoneProvider({ children }) {
  const { user } = useAuth();

  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    return (
      user?.timezone ||
      localStorage.getItem("preferred_timezone") ||
      localStorage.getItem("preferred_au_timezone") ||
      DEFAULT_AU_TIMEZONE
    );
  });

  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (user?.country) return user.country;
    const savedCountry = localStorage.getItem("preferred_country");
    if (savedCountry) return savedCountry;
    return "Australia";
  });

  // Automatically synchronize country and timezone with authenticated user profile
  useEffect(() => {
    if (user) {
      const userCountry = user.country || "Australia";
      const userTz =
        user.timezone ||
        (userCountry === "India" ? DEFAULT_IN_TIMEZONE : DEFAULT_AU_TIMEZONE);
      setSelectedCountry(userCountry);
      setSelectedTimezone(userTz);
      try {
        localStorage.setItem("preferred_country", userCountry);
        localStorage.setItem("preferred_timezone", userTz);
        localStorage.setItem("preferred_au_timezone", userTz);
      } catch (e) {}
    }
  }, [user]);

  const setTimezone = (tz, country = null) => {
    setSelectedTimezone(tz);
    const resolvedCountry =
      country || (tz === "Asia/Kolkata" ? "India" : "Australia");
    setSelectedCountry(resolvedCountry);
    try {
      localStorage.setItem("preferred_timezone", tz);
      localStorage.setItem("preferred_au_timezone", tz);
      localStorage.setItem("preferred_country", resolvedCountry);
    } catch (e) {}
  };

  const setCountry = (country) => {
    setSelectedCountry(country);
    const defaultTz =
      country === "India" ? DEFAULT_IN_TIMEZONE : DEFAULT_AU_TIMEZONE;
    setTimezone(defaultTz, country);
  };

  return (
    <TimezoneContext.Provider
      value={{ selectedTimezone, selectedCountry, setTimezone, setCountry }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    return {
      selectedTimezone: DEFAULT_AU_TIMEZONE,
      selectedCountry: "Australia",
      setTimezone: () => {},
      setCountry: () => {},
    };
  }
  return context;
}

export default TimezoneContext;
