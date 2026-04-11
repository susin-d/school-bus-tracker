import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeEventEnvelope } from "@school-bus/shared";

import { AppShell } from "../../app/AppShell";
import {
  bulkGeocodeStudentsBySchool,
  getSchoolMapSettings,
  listRealtimeMapEvents,
  listLiveDriversMap,
  optimizeSchoolRoutesDaily,
  updateSchoolMapSettings
} from "../../core/api";
import { useRequiredAdminUser } from "../../core/auth";
import { useResource } from "../../core/useResource";

declare global {
  interface Window {
    google?: {
      maps?: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => {
          setCenter: (value: { lat: number; lng: number }) => void;
          setZoom: (value: number) => void;
        };
        Marker: new (options: Record<string, unknown>) => {
          setMap: (map: unknown) => void;
        };
      };
    };
  }
}

let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

export function LiveMapPage() {
  const currentUser = useRequiredAdminUser();
  const [selectedSchoolId, setSelectedSchoolId] = useState(currentUser.schoolId ?? "");
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionFeedback, setActionFeedback] = useState("");
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [dispatchStartTime, setDispatchStartTime] = useState("");
  const [noShowWaitSeconds, setNoShowWaitSeconds] = useState("120");
  const [maxDetourMinutes, setMaxDetourMinutes] = useState("15");
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(undefined);
  const [mapError, setMapError] = useState<string | undefined>(undefined);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const schoolScope = useMemo(() => {
    if (currentUser.role === "super_admin") {
      return selectedSchoolId.trim() || undefined;
    }

    return currentUser.schoolId;
  }, [currentUser.role, currentUser.schoolId, selectedSchoolId]);

  const { data, isLoading, error } = useResource(
    () => listLiveDriversMap(currentUser, schoolScope),
    [currentUser.id, currentUser.role, schoolScope, refreshTick]
  );
  const { data: eventsData } = useResource(
    () => listRealtimeMapEvents(currentUser, {
      schoolId: schoolScope,
      since: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }),
    [currentUser.id, currentUser.role, schoolScope, refreshTick]
  );
  const { data: settingsData } = useResource(
    () => schoolScope ? getSchoolMapSettings(currentUser, schoolScope) : Promise.resolve(undefined),
    [currentUser.id, currentUser.role, schoolScope, refreshTick]
  );

  useEffect(() => {
    const settings = settingsData?.settings;
    if (!settings) {
      return;
    }
    setDispatchStartTime(settings.dispatchStartTime ?? "");
    setNoShowWaitSeconds(String(settings.noShowWaitSeconds));
    setMaxDetourMinutes(String(settings.maxDetourMinutes));
  }, [settingsData?.settings?.dispatchStartTime, settingsData?.settings?.maxDetourMinutes, settingsData?.settings?.noShowWaitSeconds]);

  const delayedCount = data?.drivers.filter((driver) => driver.isDelayed).length ?? 0;
  const driverCount = data?.drivers.length ?? 0;
  const baseEvents = (eventsData?.events ?? []) as RealtimeEventEnvelope[];
  const recentEvents = baseEvents
    .filter((event) => (selectedTripId ? event.tripId === selectedTripId : true))
    .slice(0, 8);
  const driversBySchool = useMemo(() => {
    if (!data?.drivers?.length) {
      return [] as Array<{ schoolId: string; total: number; delayed: number }>;
    }
    const group = new Map<string, { schoolId: string; total: number; delayed: number }>();
    for (const driver of data.drivers) {
      const schoolId = driver.schoolId || "unknown";
      const entry = group.get(schoolId) ?? { schoolId, total: 0, delayed: 0 };
      entry.total += 1;
      if (driver.isDelayed) {
        entry.delayed += 1;
      }
      group.set(schoolId, entry);
    }
    return Array.from(group.values()).sort((left, right) => right.total - left.total);
  }, [data?.drivers]);
  const driverClusters = useMemo(() => {
    if (!data?.drivers?.length) {
      return [] as Array<{ key: string; total: number; delayed: number; lat: number; lng: number }>;
    }

    const cells = new Map<string, { key: string; total: number; delayed: number; lat: number; lng: number }>();
    for (const driver of data.drivers) {
      if (driver.latitude == null || driver.longitude == null) {
        continue;
      }
      const latCell = Math.round(driver.latitude * 20) / 20;
      const lngCell = Math.round(driver.longitude * 20) / 20;
      const key = `${latCell},${lngCell}`;
      const existing = cells.get(key) ?? { key, total: 0, delayed: 0, lat: latCell, lng: lngCell };
      existing.total += 1;
      if (driver.isDelayed) {
        existing.delayed += 1;
      }
      cells.set(key, existing);
    }
    return Array.from(cells.values()).sort((left, right) => right.total - left.total);
  }, [data?.drivers]);

  useEffect(() => {
    if (!data?.drivers?.length || !mapContainerRef.current) {
      return;
    }

    const driversWithCoords = data.drivers.filter((driver) => driver.latitude != null && driver.longitude != null);
    if (!driversWithCoords.length) {
      return;
    }

    let isDisposed = false;
    const markers: Array<{ setMap: (map: unknown) => void }> = [];
    void loadGoogleMapsScript()
      .then(() => {
        if (isDisposed || !window.google?.maps || !mapContainerRef.current) {
          return;
        }

        const first = driversWithCoords[0]!;
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: first.latitude!, lng: first.longitude! },
          zoom: currentUser.role === "super_admin" ? 10 : 13,
          mapTypeControl: false,
          streetViewControl: false
        });

        if (currentUser.role === "super_admin" && !schoolScope) {
          for (const cluster of driverClusters) {
            const marker = new window.google.maps.Marker({
              map,
              position: { lat: cluster.lat, lng: cluster.lng },
              title: `Cluster ${cluster.key}: ${cluster.total} buses`,
              label: `${cluster.total}`
            });
            markers.push(marker);
          }
          return;
        }

        for (const driver of driversWithCoords) {
          const marker = new window.google.maps.Marker({
            map,
            position: { lat: driver.latitude!, lng: driver.longitude! },
            title: `${driver.driverName ?? "Driver"} (${driver.tripId})`,
            label: driver.isDelayed ? "!" : undefined
          });
          markers.push(marker);
        }
      })
      .catch((error) => {
        if (!isDisposed) {
          setMapError(error instanceof Error ? error.message : "Map unavailable");
        }
      });

    return () => {
      isDisposed = true;
      for (const marker of markers) {
        marker.setMap(null);
      }
    };
  }, [currentUser.role, data?.drivers, driverClusters, schoolScope]);

  async function runBulkGeocode() {
    if (!schoolScope) {
      setActionFeedback("Select a school ID before running bulk geocoding.");
      return;
    }

    setIsRunningAction(true);
    setActionFeedback("");
    try {
      const result = await bulkGeocodeStudentsBySchool(currentUser, schoolScope, false);
      setActionFeedback(
        `Geocoding complete: ${result.successCount}/${result.totalStudents} students resolved.`
      );
      setRefreshTick((value) => value + 1);
    } catch (actionError) {
      setActionFeedback(actionError instanceof Error ? actionError.message : "Bulk geocode failed.");
    } finally {
      setIsRunningAction(false);
    }
  }

  async function runOptimizeDaily() {
    if (!schoolScope) {
      setActionFeedback("Select a school ID before optimizing routes.");
      return;
    }

    setIsRunningAction(true);
    setActionFeedback("");
    try {
      const result = await optimizeSchoolRoutesDaily(currentUser, schoolScope, {
        reason: "manual_dispatch_replan"
      });
      setActionFeedback(
        `Optimization complete: ${result.plannedTrips}/${result.processedTrips} trips planned.`
      );
      setRefreshTick((value) => value + 1);
    } catch (actionError) {
      setActionFeedback(actionError instanceof Error ? actionError.message : "Route optimization failed.");
    } finally {
      setIsRunningAction(false);
    }
  }

  async function saveMapSettings() {
    if (!schoolScope) {
      setActionFeedback("Select a school ID before saving map settings.");
      return;
    }

    const noShow = Number(noShowWaitSeconds);
    const detour = Number(maxDetourMinutes);
    if (!Number.isFinite(noShow) || noShow < 30 || noShow > 900) {
      setActionFeedback("No-show wait must be between 30 and 900 seconds.");
      return;
    }
    if (!Number.isFinite(detour) || detour < 1 || detour > 120) {
      setActionFeedback("Max detour must be between 1 and 120 minutes.");
      return;
    }

    setIsRunningAction(true);
    setActionFeedback("");
    try {
      await updateSchoolMapSettings(currentUser, schoolScope, {
        dispatchStartTime: dispatchStartTime || undefined,
        noShowWaitSeconds: Math.round(noShow),
        maxDetourMinutes: Math.round(detour)
      });
      setActionFeedback("Map settings saved successfully.");
      setRefreshTick((value) => value + 1);
    } catch (actionError) {
      setActionFeedback(actionError instanceof Error ? actionError.message : "Map settings update failed.");
    } finally {
      setIsRunningAction(false);
    }
  }

  return (
    <AppShell
      title="Live Driver Map"
      subtitle=""
      activeRoute="liveMap"
    >
      <section className="stats-grid">
        <MetricCard label="Active Drivers" value={String(driverCount)} />
        <MetricCard label="Delayed Trips" value={String(delayedCount)} tone="warm" />
        <MetricCard
          label="School Scope"
          value={schoolScope ?? "All"}
        />
        <MetricCard label="Refresh Interval" value="10s" />
        <MetricCard label="Realtime Stream" value="Polling" />
      </section>

      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <h2>Routing Controls</h2>
          </div>
        </header>
        <div className="resource-form">
          {currentUser.role === "super_admin" && (
            <input
              className="resource-input"
              onChange={(event) => setSelectedSchoolId(event.target.value)}
              placeholder="School ID (leave empty for all)"
              value={selectedSchoolId}
            />
          )}
          <button
            className="resource-action"
            disabled={isRunningAction}
            onClick={() => void runBulkGeocode()}
            type="button"
          >
            {isRunningAction ? "Running..." : "Bulk Geocode Students"}
          </button>
          <button
            className="resource-action subtle"
            disabled={isRunningAction}
            onClick={() => void runOptimizeDaily()}
            type="button"
          >
            {isRunningAction ? "Running..." : "Optimize Daily Routes"}
          </button>
        </div>
        {actionFeedback && <p className="panel-summary">{actionFeedback}</p>}
      </section>

      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <h2>Map Settings</h2>
          </div>
        </header>
        <div className="resource-form">
          <input
            className="resource-input"
            onChange={(event) => setDispatchStartTime(event.target.value)}
            placeholder="Dispatch start ISO time"
            value={dispatchStartTime}
          />
          <input
            className="resource-input"
            onChange={(event) => setNoShowWaitSeconds(event.target.value)}
            placeholder="No-show wait seconds"
            value={noShowWaitSeconds}
          />
          <input
            className="resource-input"
            onChange={(event) => setMaxDetourMinutes(event.target.value)}
            placeholder="Max detour minutes"
            value={maxDetourMinutes}
          />
          <button
            className="resource-action subtle"
            disabled={isRunningAction}
            onClick={() => void saveMapSettings()}
            type="button"
          >
            {isRunningAction ? "Saving..." : "Save Map Settings"}
          </button>
        </div>
      </section>

      {currentUser.role === "super_admin" && driversBySchool.length > 0 && (
        <section className="panel-grid compact">
          {driversBySchool.map((group) => (
            <article className="panel" key={group.schoolId}>
              <h2>School {group.schoolId}</h2>
              <p className="panel-summary">
                Active drivers: {group.total} | Delayed: {group.delayed}
              </p>
            </article>
          ))}
        </section>
      )}

      {currentUser.role === "super_admin" && schoolScope == null && driverClusters.length > 0 && (
        <section className="panel-grid compact">
          {driverClusters.map((cluster) => (
            <article className="panel" key={cluster.key}>
              <h2>Cluster {cluster.key}</h2>
              <p className="panel-summary">
                Drivers: {cluster.total} | Delayed: {cluster.delayed}
              </p>
              <p className="panel-summary">
                Center: {cluster.lat}, {cluster.lng}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <h2>Realtime Events</h2>
          </div>
        </header>
        <div className="panel-grid compact">
          {recentEvents.map((event) => (
            <article className="panel" key={event.id}>
              <h2>{event.type}</h2>
              <p className="panel-summary">
                School: {event.schoolId} | Trip: {event.tripId ?? "-"}
              </p>
              <p className="panel-summary">{event.occurredAt}</p>
            </article>
          ))}
          {recentEvents.length === 0 && (
            <article className="panel panel-span-all">
              <h2>No recent events</h2>
              <p className="panel-summary">No trip updates yet.</p>
            </article>
          )}
        </div>
      </section>

      <section className="resource-panel">
        <header className="resource-header">
          <div>
            <h2>Live Vehicle Map</h2>
          </div>
        </header>
        {mapError && <p className="panel-summary error-copy">{mapError}</p>}
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: 360,
            borderRadius: 14,
            border: "1px solid var(--table-border)",
            background: "var(--card-surface)"
          }}
        />
      </section>

      {isLoading && <p className="panel-summary">Loading live drivers map data.</p>}
      {error && <p className="panel-summary error-copy">{error}</p>}
      {data && (
        <section className="panel-grid compact">
          {data.drivers.map((driver) => {
            return (
              <article className="panel" key={`${driver.tripId}-${driver.driverId ?? "driver"}`}>
                <h2>{driver.driverName ?? "Assigned Driver"}</h2>
                <p className="panel-summary">
                  Trip: {driver.tripId} | Route: {driver.routeName ?? "-"} | Bus: {driver.busLabel ?? "-"}
                </p>
                <p className="panel-summary">
                  Status: {driver.status} | Delay: {driver.etaDelayMinutes ?? 0} min
                </p>
                <p className="panel-summary">
                  Next Stop: {driver.nextStopName ?? "Not available"} | ETA: {driver.nextStopEta ?? "n/a"}
                </p>
                <button
                  className="resource-action subtle"
                  onClick={() => setSelectedTripId(driver.tripId)}
                  type="button"
                >
                  Drilldown Trip Events
                </button>
                <p className="panel-summary">Lat: {driver.latitude ?? "-"} | Lng: {driver.longitude ?? "-"}</p>
              </article>
            );
          })}
          {data.drivers.length === 0 && (
            <article className="panel panel-span-all">
              <h2>No active driver location</h2>
              <p className="panel-summary">No active trips in this scope.</p>
            </article>
          )}
        </section>
      )}
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warm";
}) {
  return (
    <article className={tone === "warm" ? "metric-card warm" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
