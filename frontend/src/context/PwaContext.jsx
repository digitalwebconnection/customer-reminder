import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getDetailedPermissions,
  requestAndSubscribePush,
  sendTestMobileAlarmPush,
} from "../utils/pushManager";
import { promptOneSignalPush } from "../utils/oneSignalManager";

const PwaContext = createContext();

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const autoArmedRef = useRef(false);

  // Permission Diagnostics State
  const [permissions, setPermissions] = useState({
    isSupported: true,
    notification: 'default',
    serviceWorkerActive: false,
    pushSubscribed: false,
    storagePersisted: false,
    isStandalone: false,
    ringSound: 'granted',
  });
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const refreshPermissions = useCallback(async () => {
    try {
      const details = await getDetailedPermissions();
      const merged = { ...details, ringSound: 'granted' };
      setPermissions(merged);
      if (details?.isStandalone) {
        setIsInstalled(true);
      }
      return merged;
    } catch (e) {
      console.warn('[PWA] Error checking permissions:', e);
    }
  }, []);

  /**
   * Ringtone Permission Activator (stubbed safely for silent notifications)
   */
  const enableRingPermission = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      const updated = await refreshPermissions();
      return { success: true, permissions: updated };
    } finally {
      setLoadingPermissions(false);
    }
  }, [refreshPermissions]);

  /**
   * Toggle Ringtone Permission
   */
  const toggleRingPermission = useCallback(async () => {
    const updated = await refreshPermissions();
    return { success: true, permissions: updated };
  }, [refreshPermissions]);

  /**
   * 1-Click Master Enabler for all mobile push notifications & background permissions
   */
  const enableAllAlarmPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      // 1. Web Push & Notification & Persistent Storage
      const pushResult = await requestAndSubscribePush();

      // 2. OneSignal SDK fallback prompt
      try {
        await promptOneSignalPush();
      } catch (e) {}

      // 3. Refresh live status
      const updated = await refreshPermissions();
      return { success: pushResult.success, permissions: updated };
    } finally {
      setLoadingPermissions(false);
    }
  }, [refreshPermissions]);

  useEffect(() => {
    // 1. Detect standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isAppleDevice);

    // 3. Listen for Android / Chrome / Edge PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("[PWA] 📱 beforeinstallprompt event captured and ready for mobile install!");
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] 🎉 RemindIQ successfully installed on device!");
      refreshPermissions();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Initial permissions check
    refreshPermissions();

    // 4. Set mobile permissions automatically by default:
    // Prompt immediately if allowed by browser, and fallback to first tap/touch gesture
    const autoSetPermissions = async () => {
      if (autoArmedRef.current) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;

      if (Notification.permission === "granted") {
        autoArmedRef.current = true;
        try {
          await requestAndSubscribePush();
        } catch (e) {}
      } else if (Notification.permission === "default") {
        try {
          const res = await enableAllAlarmPermissions();
          if (res?.success) {
            autoArmedRef.current = true;
          }
        } catch (e) {}
      }
    };

    autoSetPermissions();

    const handleFirstGesture = async () => {
      // Prime and unlock mobile audio context on first user touch gesture
      try {
        await unlockRingAudio();
        refreshPermissions();
      } catch (e) {}

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default" && !autoArmedRef.current) {
          try {
            await enableAllAlarmPermissions();
            autoArmedRef.current = true;
          } catch (e) {}
        } else if (Notification.permission === "granted") {
          try {
            await requestAndSubscribePush();
          } catch (e) {}
        }
      }
    };

    window.addEventListener("touchstart", handleFirstGesture, { once: true });
    window.addEventListener("click", handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
    };
  }, [refreshPermissions, enableAllAlarmPermissions]);

  const promptInstall = async () => {
    if (isIos && !isInstalled) {
      setShowIosModal(true);
      return { success: true, platform: "ios" };
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        refreshPermissions();
        return { success: true, outcome: "accepted" };
      }
      return { success: false, outcome: "dismissed" };
    }

    setShowIosModal(true);
    return { success: false, reason: "manual_instructions" };
  };

  /**
   * Dispatches high-urgency test alarm to verify background phone ringing
   * @param {number} delaySeconds
   */
  const testMobileAlarm = async (delaySeconds = 0) => {
    return await sendTestMobileAlarmPush(delaySeconds);
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIos,
        showIosModal,
        setShowIosModal,
        showAlarmModal,
        setShowAlarmModal,
        permissions,
        loadingPermissions,
        refreshPermissions,
        enableAllAlarmPermissions,
        enableRingPermission,
        toggleRingPermission,
        testMobileAlarm,
        promptInstall,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used within a PwaProvider");
  return ctx;
}

export default PwaContext;
