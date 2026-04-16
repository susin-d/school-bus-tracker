/// <reference types="google.maps" />

import { useEffect, useMemo, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth, type School } from '@/contexts/AuthContext';
import {
  getStoredToken,
  listLiveDrivers,
  listSchoolDispatchLocations,
  type ApiLiveDriverMapItem
} from '@/lib/api';
import { Bus, AlertCircle, Clock, Users } from 'lucide-react';

export interface BusLocation {
  id: string;
  busNumber: string;
  route: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'delayed' | 'completed' | 'stopped';
  speed: number;
  passengers: number;
  capacity: number;
  driver: string;
  nextStop: string;
  estimatedArrival: string;
}

interface SchoolLocation extends School {
  latitude: number;
  longitude: number;
}

interface RealTimeMapViewProps {
  buses?: BusLocation[];
  onBusSelect?: (bus: BusLocation) => void;
  height?: string;
}

export function RealTimeMapView({ buses = [], onBusSelect, height = 'h-[600px]' }: RealTimeMapViewProps) {
  const { schools, user } = useAuth();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const busMarkerByTripRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapInitializedRef = useRef(false);

  const [liveBuses, setLiveBuses] = useState<BusLocation[]>(() => buses.map((bus) => ({ ...bus })));
  const [schoolLocations, setSchoolLocations] = useState<SchoolLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const schoolById = useMemo(() => {
    const map = new Map<string, School>();
    for (const school of schools) {
      map.set(school.id, school);
    }
    return map;
  }, [schools]);

  const schoolScopeId = useMemo(() => user?.schoolId ?? schools[0]?.id, [user?.schoolId, schools]);

  useEffect(() => {
    setLiveBuses(buses.map((bus) => ({ ...bus })));
  }, [buses]);

  const mapLiveDriverToBus = (driver: ApiLiveDriverMapItem): BusLocation | null => {
    if (typeof driver.latitude !== 'number' || typeof driver.longitude !== 'number') {
      return null;
    }

    const statusMap: Record<string, BusLocation['status']> = {
      active: 'active',
      paused: 'delayed',
      ready: 'stopped',
      scheduled: 'stopped',
      completed: 'completed',
    };

    return {
      id: driver.tripId,
      busNumber: driver.busLabel || 'BUS',
      route: driver.routeName || 'Assigned Route',
      latitude: driver.latitude,
      longitude: driver.longitude,
      status: statusMap[driver.status] || 'stopped',
      speed: Math.round(driver.speedKph ?? 0),
      passengers: 0,
      capacity: 0,
      driver: driver.driverName || 'Unknown Driver',
      nextStop: driver.nextStopName || 'School',
      estimatedArrival: driver.nextStopEta || '-',
    };
  };

  useEffect(() => {
    let cancelled = false;

    const fetchLiveMapData = async () => {
      if (!schoolScopeId) {
        setSchoolLocations([]);
        setLiveBuses([]);
        setLoading(false);
        return;
      }

      const token = getStoredToken();
      if (!token) {
        setSchoolLocations([]);
        setLiveBuses([]);
        setError('Not authenticated for live map data.');
        setLoading(false);
        return;
      }

      try {
        const [drivers, dispatchLocations] = await Promise.all([
          listLiveDrivers(token, schoolScopeId),
          listSchoolDispatchLocations(token, schoolScopeId),
        ]);

        const mappedSchools = dispatchLocations.map((location) => {
          const school = schoolById.get(location.schoolId);
          return {
            id: location.schoolId,
            name: school?.name || location.schoolName || location.schoolId,
            address: school?.address || '',
            email: school?.email || '',
            contact: school?.contact || '',
            adminUsername: school?.adminUsername || '',
            adminPassword: school?.adminPassword || '',
            createdAt: school?.createdAt || '',
            latitude: location.latitude,
            longitude: location.longitude,
          } satisfies SchoolLocation;
        });

        const mappedBuses = drivers
          .map(mapLiveDriverToBus)
          .filter((bus): bus is BusLocation => bus !== null);

        if (!cancelled) {
          setSchoolLocations(mappedSchools);
          setLiveBuses(mappedBuses);
          setError(null);
          setLoading(false);
        }
      } catch (liveMapError) {
        console.error('Failed to fetch backend live map data:', liveMapError);
        if (!cancelled) {
          setError('Failed to fetch live map data from backend.');
          setLoading(false);
        }
      }
    };

    void fetchLiveMapData();
    const interval = setInterval(() => {
      void fetchLiveMapData();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [schoolScopeId, schoolById]);

  const getMapCenter = () => {
    const firstBus = liveBuses[0];
    if (firstBus) {
      return { lat: firstBus.latitude, lng: firstBus.longitude };
    }

    const firstSchool = schoolLocations[0];
    return {
      lat: firstSchool?.latitude || 12.9916,
      lng: firstSchool?.longitude || 80.2337,
    };
  };

  const createMarkerContent = (label: string, color: string) => {
    const element = document.createElement('div');
    element.className = 'flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg';
    element.style.backgroundColor = color;
    element.textContent = label;
    return element;
  };

  useEffect(() => {
    if (mapInitializedRef.current) {
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    if (!apiKey) {
      setError('Missing Google Maps API key.');
      setLoading(false);
      return;
    }

    setOptions({ key: apiKey });

    let cancelled = false;

    const initializeMap = async () => {
      try {
        const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary;
        await importLibrary('marker');

        if (cancelled || !mapRef.current) {
          return;
        }

        mapInstanceRef.current = new Map(mapRef.current, {
          zoom: 13,
          center: getMapCenter(),
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: true,
        });

        infoWindowRef.current = new google.maps.InfoWindow();
        mapInitializedRef.current = true;

        setLoading(false);
      } catch (mapError) {
        console.error('Error loading Google Maps:', mapError);
        setError('Failed to load Google Maps. Please check your API key.');
        setLoading(false);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const showInfoWindow = (bus: BusLocation, marker: google.maps.marker.AdvancedMarkerElement) => {
    if (!infoWindowRef.current) return;

    const statusBadge = {
      active: 'Active',
      delayed: 'Delayed',
      completed: 'Completed',
      stopped: 'Stopped',
    }[bus.status];

    const content = `
      <div style="padding: 12px; font-family: sans-serif; width: 280px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${bus.busNumber}</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
          <strong>Route:</strong> ${bus.route}<br/>
          <strong>Driver:</strong> ${bus.driver}<br/>
          <strong>Status:</strong> ${statusBadge}<br/>
        </div>
        <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-bottom: 8px;">
          <div style="font-size: 12px; color: #666;">
            <strong>Speed:</strong> ${bus.speed} km/h<br/>
            <strong>Next Stop:</strong> ${bus.nextStop}<br/>
            <strong>ETA:</strong> ${bus.estimatedArrival}
          </div>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
    setSelectedBus(bus);
    onBusSelect?.(bus);
  };

  const showSchoolInfoWindow = (school: SchoolLocation, marker: google.maps.marker.AdvancedMarkerElement) => {
    if (!infoWindowRef.current) return;

    const content = `
      <div style="padding: 12px; font-family: sans-serif; width: 280px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${school.name}</div>
        <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
          <strong>Address:</strong> ${school.address || '-'}<br/>
          <strong>Contact:</strong> ${school.contact || '-'}<br/>
          <strong>Email:</strong> ${school.email || '-'}<br/>
        </div>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
    setSelectedBus(null);
  };

  useEffect(() => {
    if (!mapInstanceRef.current || !mapInitializedRef.current) {
      return;
    }

    const { AdvancedMarkerElement } = google.maps.marker as google.maps.MarkerLibrary;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];
    busMarkerByTripRef.current = new Map();

    liveBuses.forEach((bus) => {
      const statusColor = {
        active: '#22c55e',
        delayed: '#f59e0b',
        completed: '#3b82f6',
        stopped: '#ef4444',
      }[bus.status];

      const marker = new AdvancedMarkerElement({
        position: { lat: bus.latitude, lng: bus.longitude },
        map: mapInstanceRef.current,
        title: bus.busNumber,
        content: createMarkerContent('B', statusColor),
      });

      marker.addListener('gmp-click', () => {
        showInfoWindow(bus, marker);
      });

      markersRef.current.push(marker);
      busMarkerByTripRef.current.set(bus.id, marker);
    });

    schoolLocations.forEach((school, index) => {
      const marker = new AdvancedMarkerElement({
        position: { lat: school.latitude, lng: school.longitude },
        map: mapInstanceRef.current,
        title: school.name,
        content: createMarkerContent('S', index % 2 === 0 ? '#2563eb' : '#7c3aed'),
      });

      marker.addListener('gmp-click', () => {
        showSchoolInfoWindow(school, marker);
      });

      markersRef.current.push(marker);
    });

    mapInstanceRef.current.setCenter(getMapCenter());
  }, [liveBuses, schoolLocations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'stopped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Real-Time Bus Tracking
          </CardTitle>
          <CardDescription>Live location from driver GPS via backend</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={mapRef}
                className={`${height} rounded-lg border border-gray-200 overflow-hidden`}
                style={{ backgroundColor: '#f0f0f0' }}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Buses</CardTitle>
          <CardDescription>{liveBuses.filter((b) => b.status !== 'completed').length} buses in operation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {liveBuses.map((bus) => (
              <div
                key={bus.id}
                onClick={() => {
                  const marker = busMarkerByTripRef.current.get(bus.id);
                  if (marker) showInfoWindow(bus, marker);
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedBus?.id === bus.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{bus.busNumber}</div>
                    <div className="text-xs text-muted-foreground">{bus.route}</div>
                  </div>
                  <Badge className={getStatusColor(bus.status)}>
                    {bus.status === 'delayed' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{bus.estimatedArrival}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{bus.passengers}/{bus.capacity}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Driver:</strong> {bus.driver} | <strong>Speed:</strong> {bus.speed} km/h | <strong>Next:</strong> {bus.nextStop}
                </div>
              </div>
            ))}
            {liveBuses.length === 0 && (
              <p className="text-sm text-muted-foreground">No live buses yet. When a driver starts moving, GPS updates will appear here.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schools on Map</CardTitle>
          <CardDescription>{schoolLocations.length} school dispatch locations from backend</CardDescription>
        </CardHeader>
        <CardContent>
          {schoolLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No school dispatch coordinates found in backend map settings.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {schoolLocations.map((school) => (
                <div key={school.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{school.name}</div>
                      <div className="text-xs text-muted-foreground">{school.address || 'Address not available'}</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">School</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeMapView;
