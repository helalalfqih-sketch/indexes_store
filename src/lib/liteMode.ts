import { useState, useEffect } from "react";

export type LiteModeSetting = "auto" | "on" | "off";

const PREFERENCE_KEY = "indexes_lite_mode_preference";

export function getLiteModePreference(): LiteModeSetting {
  try {
    const pref = localStorage.getItem(PREFERENCE_KEY);
    if (pref === "on" || pref === "off" || pref === "auto") {
      return pref as LiteModeSetting;
    }
  } catch {
    // Fallback
  }
  return "auto";
}

export function setLiteModePreference(pref: LiteModeSetting): void {
  try {
    localStorage.setItem(PREFERENCE_KEY, pref);
    window.dispatchEvent(new Event("indexes_lite_mode_changed"));
  } catch {
    // Ignore storage write error
  }
}

/**
  Checks whether network condition indicates slow connection or data-saver mode
 */
export function detectSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;

  // Check network information API if available
  const connection = (
    navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }
  ).connection;
  if (connection) {
    if (connection.saveData) return true;
    if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") return true;
  }

  // Check offline state
  if (typeof navigator.onLine !== "undefined" && !navigator.onLine) {
    return true;
  }

  return false;
}

export function isLiteModeActive(): boolean {
  const pref = getLiteModePreference();
  if (pref === "on") return true;
  if (pref === "off") return false;
  // 'auto' mode
  return detectSlowConnection();
}

/**
 * Custom React Hook for listening to Lite Mode state changes & network updates
 */
export function useLiteMode() {
  // Browser preferences and connection state are restored after hydration.
  const [pref, setPref] = useState<LiteModeSetting>("auto");
  const [isActive, setIsActive] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function updateState() {
      const currentPref = getLiteModePreference();
      setPref(currentPref);
      setIsActive(isLiteModeActive());
      setIsOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);
    }

    updateState();
    window.addEventListener("indexes_lite_mode_changed", updateState);
    window.addEventListener("online", updateState);
    window.addEventListener("offline", updateState);

    // Network connection change listener if available
    const connection = (navigator as unknown as { connection?: EventTarget }).connection;
    if (connection) {
      connection.addEventListener("change", updateState);
    }

    return () => {
      window.removeEventListener("indexes_lite_mode_changed", updateState);
      window.removeEventListener("online", updateState);
      window.removeEventListener("offline", updateState);
      if (connection) {
        connection.removeEventListener("change", updateState);
      }
    };
  }, []);

  const toggle = () => {
    const nextPref: LiteModeSetting = isActive ? "off" : "on";
    setLiteModePreference(nextPref);
  };

  return {
    pref,
    setPref: setLiteModePreference,
    isActive,
    isOffline,
    toggle,
  };
}
