"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HIDE_ACTIVITY_EVENT,
  isHideActivityEnabled,
  setHideActivityEnabled,
} from "@/lib/hide-activity-preference";

export function useHideActivityPreference() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isHideActivityEnabled(window.localStorage);
  });

  useEffect(() => {
    const sync = () => setEnabled(isHideActivityEnabled(window.localStorage));
    window.addEventListener(HIDE_ACTIVITY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HIDE_ACTIVITY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = !isHideActivityEnabled(window.localStorage);
    setHideActivityEnabled(next, window.localStorage);
    setEnabled(next);
  }, []);

  return { hideActivity: enabled, onHideActivityToggle: toggle };
}
