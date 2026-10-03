"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EXPERIMENTAL_UI_EVENT,
  isExperimentalUiEnabled,
  setExperimentalUiEnabled,
} from "@/lib/experimental-ui-preference";

export function useExperimentalUiPreference() {
  const [experimentalUi, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return isExperimentalUiEnabled(window.localStorage);
  });

  useEffect(() => {
    const sync = () => setEnabled(isExperimentalUiEnabled(window.localStorage));
    window.addEventListener(EXPERIMENTAL_UI_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EXPERIMENTAL_UI_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = !isExperimentalUiEnabled(window.localStorage);
    setExperimentalUiEnabled(next, window.localStorage);
    setEnabled(next);
  }, []);

  return { experimentalUi, onExperimentalUiToggle: toggle };
}
