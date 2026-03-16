"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getHealth } from "./api";
import type { HealthRecord } from "./contracts";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface ConnectionState {
  ready: boolean;
  status: ConnectionStatus;
  health: HealthRecord | null;
  canWrite: boolean;
}

const ConnectionStatusContext = createContext<ConnectionState>({
  ready: false,
  status: "disconnected",
  health: null,
  canWrite: false,
});

const RETRY_STEPS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
const STABLE_POLL_MS = 15_000;

export function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [health, setHealth] = useState<HealthRecord | null>(null);
  const failureCountRef = useRef(0);
  const hadSuccessRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let timer: number | null = null;

    async function probe() {
      try {
        const nextHealth = await getHealth();
        if (!alive) return;
        hadSuccessRef.current = true;
        failureCountRef.current = 0;
        setHealth(nextHealth);
        setReady(true);
        setStatus("connected");
        timer = window.setTimeout(() => void probe(), STABLE_POLL_MS);
      } catch {
        if (!alive) return;
        failureCountRef.current += 1;
        setReady(true);
        const isDisconnected = !hadSuccessRef.current || failureCountRef.current >= 4;
        setStatus(isDisconnected ? "disconnected" : "reconnecting");
        const delay = RETRY_STEPS[Math.min(failureCountRef.current - 1, RETRY_STEPS.length - 1)];
        timer = window.setTimeout(() => void probe(), delay);
      }
    }

    void probe();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const value = useMemo<ConnectionState>(
    () => ({
      status,
      ready,
      health,
      canWrite: status === "connected",
    }),
    [health, ready, status],
  );

  return <ConnectionStatusContext.Provider value={value}>{children}</ConnectionStatusContext.Provider>;
}

export function useConnectionStatus() {
  return useContext(ConnectionStatusContext);
}
