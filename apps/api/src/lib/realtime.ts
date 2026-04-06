import { EventEmitter } from "node:events";

import type { RealtimeEventEnvelope } from "@school-bus/shared";

const MAX_EVENTS = 750;
const realtimeEmitter = new EventEmitter();
const eventHistory: RealtimeEventEnvelope[] = [];

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type RealtimeEventType = RealtimeEventEnvelope["type"];

type RealtimeEventInput = {
  type: RealtimeEventType;
  schoolId: string;
  tripId?: string;
  payload: Record<string, unknown>;
};

export function publishRealtimeEvent(input: RealtimeEventInput) {
  const event: RealtimeEventEnvelope = {
    id: randomId(),
    type: input.type,
    schoolId: input.schoolId,
    tripId: input.tripId,
    occurredAt: new Date().toISOString(),
    payload: input.payload
  };

  eventHistory.push(event);
  if (eventHistory.length > MAX_EVENTS) {
    eventHistory.splice(0, eventHistory.length - MAX_EVENTS);
  }

  realtimeEmitter.emit("event", event);
  return event;
}

export function listRealtimeEvents(options?: {
  since?: string;
  schoolId?: string;
  tripId?: string;
}) {
  const sinceTime = options?.since ? Date.parse(options.since) : null;
  return eventHistory.filter((event) => {
    if (sinceTime != null && Number.isFinite(sinceTime) && Date.parse(event.occurredAt) <= sinceTime) {
      return false;
    }

    if (options?.schoolId && event.schoolId !== options.schoolId) {
      return false;
    }

    if (options?.tripId && event.tripId !== options.tripId) {
      return false;
    }

    return true;
  });
}

export function subscribeRealtimeEvents(listener: (event: RealtimeEventEnvelope) => void) {
  realtimeEmitter.on("event", listener);

  return () => {
    realtimeEmitter.off("event", listener);
  };
}

