"use client";

import { useEffect } from "react";

type PrintAutoTriggerProps = {
  enabled: boolean;
};

export function PrintAutoTrigger({ enabled }: PrintAutoTriggerProps) {
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return null;
}
