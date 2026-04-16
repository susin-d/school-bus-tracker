import { useState } from 'react';
import RealTimeMapView, { BusLocation } from '@/components/RealTimeMapView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, Users, Clock } from 'lucide-react';

export function BusTracking() {
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);

  const stats = [
    { label: 'Active Routes', value: '5', icon: '🚌' },
    { label: 'Total Students', value: '347', icon: '👥' },
    { label: 'On-Time Rate', value: '98%', icon: '✓' },
    { label: 'Avg. Speed', value: '32 km/h', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Real-Time Bus Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor live location and status of all school buses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <span>{stat.icon}</span>
                <span>{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-Time Map */}
      <RealTimeMapView onBusSelect={setSelectedBus} />

      {/* Selected Bus Details */}
      {selectedBus && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Bus {selectedBus.busNumber}
                  <Badge
                    className={
                      selectedBus.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedBus.status === 'delayed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }
                  >
                    {selectedBus.status.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>{selectedBus.route}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{selectedBus.speed} km/h</div>
                <div className="text-sm text-muted-foreground">Current Speed</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Driver</div>
                <div className="font-semibold">{selectedBus.driver}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Passengers
                </div>
                <div className="font-semibold">
                  {selectedBus.passengers}/{selectedBus.capacity}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Next Stop
                </div>
                <div className="font-semibold">{selectedBus.nextStop}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">ETA</div>
                <div className="font-semibold">{selectedBus.estimatedArrival}</div>
              </div>
            </div>

            {selectedBus.status === 'delayed' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Route Delay Detected</p>
                  <p className="text-amber-800 text-sm">
                    This bus is running approximately 15 minutes behind schedule. Traffic conditions may
                    be affecting the route.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How to Use */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Using Real-Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Click on map markers to view detailed bus information</li>
            <li>Select a bus from the list to highlight it on the map</li>
            <li>Bus locations update every 5 seconds in real-time</li>
            <li>Status indicators show whether buses are on-time, delayed, or stopped</li>
            <li>Passenger counts help monitor crowding during peak hours</li>
            <li>Driver information is displayed for quick reference</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default BusTracking;
