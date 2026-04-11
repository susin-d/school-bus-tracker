import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeEventEnvelope } from "@school-bus/shared";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

import { AppShell } from "../../app/AppShell";
import {
  bulkGeocodeStudentsBySchool,
  getSchoolMapSettings,
  listSchoolDispatchLocations,
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
        SymbolPath?: {
          CIRCLE: number;
        };
      };
    };
  }
}

let googleMapsLoaderPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }

  setOptions({ key: apiKey, v: "weekly" });

  googleMapsLoaderPromise = Promise.all([
    importLibrary("maps"),
    importLibrary("marker")
  ]).then(() => undefined);
  return googleMapsLoaderPromise;
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
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Array<{ setMap: (map: unknown) => void }>>([]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 10000);
    return () => window.clearInterval(interval);
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
  const { data: schoolLocationsData } = useResource(
    () => listSchoolDispatchLocations(currentUser, schoolScope),
    [currentUser.id, currentUser.role, schoolScope, refreshTick]
  );

  useEffect(() => {
    const settings = settingsData?.settings;
    if (!settings) return;
    setDispatchStartTime(settings.dispatchStartTime ?? "");
    setNoShowWaitSeconds(String(settings.noShowWaitSeconds));
    setMaxDetourMinutes(String(settings.maxDetourMinutes));
  }, [settingsData?.settings?.dispatchStartTime, settingsData?.settings?.maxDetourMinutes, settingsData?.settings?.noShowWaitSeconds]);

  const baseEvents = (eventsData?.events ?? []) as RealtimeEventEnvelope[];
  const recentEvents = baseEvents
    .filter((e) => (selectedTripId ? e.tripId === selectedTripId : true))
    .slice(0, 8);

  const driversBySchool = useMemo(() => {
    if (!data?.drivers?.length) return [] as Array<{ schoolId: string; total: number; delayed: number }>;
    const group = new Map<string, { schoolId: string; total: number; delayed: number }>();
    for (const driver of data.drivers) {
      const schoolId = driver.schoolId || "unknown";
      const entry = group.get(schoolId) ?? { schoolId, total: 0, delayed: 0 };
      entry.total += 1;
      if (driver.isDelayed) entry.delayed += 1;
      group.set(schoolId, entry);
    }
    return Array.from(group.values()).sort((a, b) => b.total - a.total);
  }, [data?.drivers]);

  const driverClusters = useMemo(() => {
    if (!data?.drivers?.length) return [] as Array<{ key: string; total: number; delayed: number; lat: number; lng: number }>;
    const cells = new Map<string, { key: string; total: number; delayed: number; lat: number; lng: number }>();
    for (const driver of data.drivers) {
      if (driver.latitude == null || driver.longitude == null) continue;
      const latCell = Math.round(driver.latitude * 20) / 20;
      const lngCell = Math.round(driver.longitude * 20) / 20;
      const key = `${latCell},${lngCell}`;
      const existing = cells.get(key) ?? { key, total: 0, delayed: 0, lat: latCell, lng: lngCell };
      existing.total += 1;
      if (driver.isDelayed) existing.delayed += 1;
      cells.set(key, existing);
    }
    return Array.from(cells.values()).sort((a, b) => b.total - a.total);
  }, [data?.drivers]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const driversWithCoords = (data?.drivers ?? []).filter((d) => d.latitude != null && d.longitude != null);
    const schoolsWithCoords = (schoolLocationsData?.schools ?? []).filter((s) => s.latitude != null && s.longitude != null);
    const settingsCenter = settingsData?.settings;
    const defaultCenter = { lat: settingsCenter?.dispatchLatitude ?? 13.0827, lng: settingsCenter?.dispatchLongitude ?? 80.2707 };

    let isDisposed = false;
    void loadGoogleMapsScript()
      .then(() => {
        const mapElement = mapContainerRef.current;
        if (isDisposed || !window.google?.maps || !mapElement) return;
        setMapError(undefined);
        const first = driversWithCoords[0];
        const firstSchool = schoolsWithCoords[0];
        const center = first
          ? { lat: first.latitude!, lng: first.longitude! }
          : firstSchool ? { lat: firstSchool.latitude, lng: firstSchool.longitude }
            : defaultCenter;
        const zoom = driversWithCoords.length ? (currentUser.role === "super_admin" ? 10 : 13) : 11;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapElement, {
            center, zoom, mapTypeControl: false, streetViewControl: false
          });
        }

        const map = mapInstanceRef.current;
        for (const marker of markersRef.current) marker.setMap(null);
        markersRef.current = [];

        for (const school of schoolsWithCoords) {
          const marker = new window.google.maps.Marker({
            map, position: { lat: school.latitude, lng: school.longitude },
            title: `School: ${school.schoolName ?? school.schoolId}`, label: "S"
          });
          markersRef.current.push(marker);
        }

        if (currentUser.role === "super_admin" && !schoolScope && driverClusters.length > 0) {
          for (const cluster of driverClusters) {
            const marker = new window.google.maps.Marker({
              map, position: { lat: cluster.lat, lng: cluster.lng },
              title: `Cluster ${cluster.key}: ${cluster.total} buses`, label: `${cluster.total}`
            });
            markersRef.current.push(marker);
          }
        }

        for (const driver of driversWithCoords) {
          const marker = new window.google.maps.Marker({
            map, position: { lat: driver.latitude!, lng: driver.longitude! },
            title: `${driver.driverName ?? "Driver"} (${driver.tripId})`,
            label: driver.isDelayed ? "!" : undefined
          });
          markersRef.current.push(marker);
        }
      })
      .catch((err) => {
        if (!isDisposed) setMapError(err instanceof Error ? err.message : "Map unavailable");
      });

    return () => { isDisposed = true; };
  }, [currentUser.role, data?.drivers, driverClusters, schoolLocationsData?.schools, schoolScope, settingsData?.settings]);

  async function runBulkGeocode() {
    if (!schoolScope) { setActionFeedback("Select a school ID before running bulk geocoding."); return; }
    setIsRunningAction(true); setActionFeedback("");
    try {
      const result = await bulkGeocodeStudentsBySchool(currentUser, schoolScope, false);
      setActionFeedback(`Geocoding complete: ${result.successCount}/${result.totalStudents} students resolved.`);
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setActionFeedback(e instanceof Error ? e.message : "Bulk geocode failed.");
    } finally { setIsRunningAction(false); }
  }

  async function runOptimizeDaily() {
    if (!schoolScope) { setActionFeedback("Select a school ID before optimizing routes."); return; }
    setIsRunningAction(true); setActionFeedback("");
    try {
      const result = await optimizeSchoolRoutesDaily(currentUser, schoolScope, { reason: "manual_dispatch_replan" });
      setActionFeedback(`Optimization complete: ${result.plannedTrips}/${result.processedTrips} trips planned.`);
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setActionFeedback(e instanceof Error ? e.message : "Route optimization failed.");
    } finally { setIsRunningAction(false); }
  }

  async function saveMapSettings() {
    if (!schoolScope) { setActionFeedback("Select a school ID before saving map settings."); return; }
    const noShow = Number(noShowWaitSeconds);
    const detour = Number(maxDetourMinutes);
    if (!Number.isFinite(noShow) || noShow < 30 || noShow > 900) { setActionFeedback("No-show wait must be between 30 and 900 seconds."); return; }
    if (!Number.isFinite(detour) || detour < 1 || detour > 120) { setActionFeedback("Max detour must be between 1 and 120 minutes."); return; }
    setIsRunningAction(true); setActionFeedback("");
    try {
      await updateSchoolMapSettings(currentUser, schoolScope, {
        dispatchStartTime: dispatchStartTime || undefined,
        noShowWaitSeconds: Math.round(noShow),
        maxDetourMinutes: Math.round(detour)
      });
      setActionFeedback("Map settings saved successfully.");
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setActionFeedback(e instanceof Error ? e.message : "Map settings update failed.");
    } finally { setIsRunningAction(false); }
  }

  return (
    <AppShell title="Live Driver Map" subtitle="" activeRoute="liveMap">

      {/* ── Main two-column layout: map + sidebar ── */}
      <div className="live-map-layout">

        {/* Left: map takes up most of the space */}
        <div className="live-map-main">
          <section className="resource-panel">
            <header className="resource-header">
              <div>
                <h2>Live Vehicle Map</h2>
              </div>
              {isLoading && <span className="panel-badge">Refreshing…</span>}
            </header>
            {mapError && <p className="panel-summary error-copy">{mapError}</p>}
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: 480,
                borderRadius: 12,
                border: "1px solid var(--table-border)",
                background: "var(--card-surface)"
              }}
            />
          </section>

          {/* Driver cards below the map */}
          {error && <p className="panel-summary error-copy">{error}</p>}
          {data && (
            <section className="resource-panel">
              <header className="resource-header">
                <div><h2>Active Drivers</h2></div>
              </header>
              <div className="panel-grid compact">
                {data.drivers.map((driver) => (
                  <article
                    className={`panel${driver.isDelayed ? " panel-warn" : ""}`}
                    key={`${driver.tripId}-${driver.driverId ?? "driver"}`}
                  >
                    <h2>{driver.driverName ?? "Assigned Driver"}</h2>
                    <p className="panel-summary">
                      Trip: {driver.tripId} &nbsp;|&nbsp; Route: {driver.routeName ?? "—"} &nbsp;|&nbsp; Bus: {driver.busLabel ?? "—"}
                    </p>
                    <p className="panel-summary">
                      Status: <strong>{driver.status}</strong> &nbsp;|&nbsp; Delay: {driver.etaDelayMinutes ?? 0} min
                    </p>
                    <p className="panel-summary">
                      Next stop: {driver.nextStopName ?? "n/a"} &nbsp;|&nbsp; ETA: {driver.nextStopEta ?? "n/a"}
                    </p>
                    <p className="panel-summary">
                      {driver.latitude ?? "—"}, {driver.longitude ?? "—"}
                    </p>
                    <button
                      className="resource-action subtle"
                      onClick={() => setSelectedTripId(driver.tripId)}
                      type="button"
                    >
                      Trip Events
                    </button>
                  </article>
                ))}
                {data.drivers.length === 0 && (
                  <article className="panel panel-span-all">
                    <h2>No active drivers</h2>
                    <p className="panel-summary">No active trips in this scope.</p>
                  </article>
                )}
              </div>
            </section>
          )}

          {/* Per-school breakdown (super admin only) */}
          {currentUser.role === "super_admin" && driversBySchool.length > 0 && (
            <section className="resource-panel">
              <header className="resource-header">
                <div><h2>Drivers by School</h2></div>
              </header>
              <div className="panel-grid compact">
                {driversBySchool.map((group) => (
                  <article className="panel" key={group.schoolId}>
                    <h2>School {group.schoolId}</h2>
                    <p className="panel-summary">
                      Active: {group.total} &nbsp;|&nbsp; Delayed: {group.delayed}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Cluster view (super admin, no school filter) */}
          {currentUser.role === "super_admin" && schoolScope == null && driverClusters.length > 0 && (
            <section className="resource-panel">
              <header className="resource-header">
                <div><h2>Geographic Clusters</h2></div>
              </header>
              <div className="panel-grid compact">
                {driverClusters.map((cluster) => (
                  <article className="panel" key={cluster.key}>
                    <h2>Cluster {cluster.key}</h2>
                    <p className="panel-summary">
                      Drivers: {cluster.total} &nbsp;|&nbsp; Delayed: {cluster.delayed}
                    </p>
                    <p className="panel-summary">
                      {cluster.lat}, {cluster.lng}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar: controls + events */}
        <aside className="live-map-sidebar">

          {/* Routing controls */}
          <section className="resource-panel">
            <header className="resource-header">
              <div><h2>Routing Controls</h2></div>
            </header>
            <div className="resource-form">
              {currentUser.role === "super_admin" && (
                <input
                  className="resource-input"
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
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
                {isRunningAction ? "Running…" : "Bulk Geocode Students"}
              </button>
              <button
                className="resource-action subtle"
                disabled={isRunningAction}
                onClick={() => void runOptimizeDaily()}
                type="button"
              >
                {isRunningAction ? "Running…" : "Optimize Daily Routes"}
              </button>
            </div>
            {actionFeedback && <p className="panel-summary">{actionFeedback}</p>}
          </section>

          {/* Map settings (collapsed by default to reduce sidebar height) */}
          <section className="resource-panel">
            <header
              className="resource-header"
              style={{ cursor: "pointer" }}
              onClick={() => setSettingsPanelOpen((v) => !v)}
            >
              <div><h2>Map Settings</h2></div>
              <span className="panel-badge">{settingsPanelOpen ? "▲ Hide" : "▼ Show"}</span>
            </header>
            {settingsPanelOpen && (
              <div className="resource-form">
                <input
                  className="resource-input"
                  onChange={(e) => setDispatchStartTime(e.target.value)}
                  placeholder="Dispatch start ISO time"
                  value={dispatchStartTime}
                />
                <input
                  className="resource-input"
                  onChange={(e) => setNoShowWaitSeconds(e.target.value)}
                  placeholder="No-show wait (seconds)"
                  value={noShowWaitSeconds}
                />
                <input
                  className="resource-input"
                  onChange={(e) => setMaxDetourMinutes(e.target.value)}
                  placeholder="Max detour (minutes)"
                  value={maxDetourMinutes}
                />
                <button
                  className="resource-action subtle"
                  disabled={isRunningAction}
                  onClick={() => void saveMapSettings()}
                  type="button"
                >
                  {isRunningAction ? "Saving…" : "Save Map Settings"}
                </button>
              </div>
            )}
          </section>

          {/* Realtime events feed */}
          <section className="resource-panel">
            <header className="resource-header">
              <div><h2>Realtime Events</h2></div>
              {selectedTripId && (
                <button
                  className="resource-action subtle"
                  onClick={() => setSelectedTripId(undefined)}
                  type="button"
                  style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                >
                  Clear filter
                </button>
              )}
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentEvents.map((event) => (
                <article className="panel" key={event.id}>
                  <h2>{event.type}</h2>
                  <p className="panel-summary">
                    School: {event.schoolId} &nbsp;|&nbsp; Trip: {event.tripId ?? "—"}
                  </p>
                  <p className="panel-summary">{event.occurredAt}</p>
                </article>
              ))}
              {recentEvents.length === 0 && (
                <article className="panel">
                  <h2>No recent events</h2>
                  <p className="panel-summary">No trip updates yet.</p>
                </article>
              )}
            </div>
          </section>

        </aside>
      </div>
    </AppShell>
  );
}