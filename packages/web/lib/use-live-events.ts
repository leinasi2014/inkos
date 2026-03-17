"use client";

import { useEffect, useRef } from "react";
import type { EventEnvelope } from "./contracts";
import { subscribeToEvents } from "./ws-client";

interface UseLiveEventsOptions {
  enabled?: boolean;
  initialCursor?: number;
  threadIds?: string[];
  isRelevant?: (event: EventEnvelope) => boolean;
  onEvent: (event: EventEnvelope) => void;
  onError?: (error: Error) => void;
}

export function useLiveEvents({
  enabled = true,
  initialCursor = 0,
  threadIds,
  isRelevant,
  onEvent,
  onError,
}: UseLiveEventsOptions) {
  const isRelevantRef = useRef(isRelevant);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    isRelevantRef.current = isRelevant;
    onEventRef.current = onEvent;
    onErrorRef.current = onError;
  }, [isRelevant, onError, onEvent]);

  useEffect(() => {
    if (!enabled) return undefined;
    const nextThreadIds = threadIds ?? [];
    return subscribeToEvents({
      lastCursor: initialCursor,
      threadIds: nextThreadIds,
      onEvent: (event) => {
        if (isRelevantRef.current && !isRelevantRef.current(event)) return;
        onEventRef.current(event);
      },
      onError: (error) => {
        onErrorRef.current?.(error);
      },
    });
  }, [enabled, initialCursor, (threadIds ?? []).join("|")]);
}
