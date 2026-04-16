import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function GlobalMonitoring() {
  const { toast } = useToast();

  const tripData = [
    { time: '08:00', completed: 24, active: 12, delayed: 3 },
    { time: '09:00', completed: 48, active: 8, delayed: 2 },
    { time: '10:00', completed: 94, active: 5, delayed: 1 },
    { time: '11:00', completed: 154, active: 3, delayed: 0 },
    { time: '12:00', completed: 200, active: 0, delayed: 0 },
  ];

  const systemHealth = [
    { component: 'API Server', status: 'healthy', uptime: '99.9%' },
    { component: 'Database', status: 'healthy', uptime: '99.95%' },
    { component: 'Auth Service', status: 'healthy', uptime: '99.8%' },
    { component: 'Map Service', status: 'healthy', uptime: '99.7%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Monitoring</h1>
        <p className="text-muted-foreground mt-2">Real-time monitoring of all system components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">+2 from last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground mt-1">↑ 1% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground mt-1">12 awaiting shift</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground mt-1">All green ✓</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Activity (Today)</CardTitle>
          <CardDescription>Real-time trip completion and delay tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tripData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Active" />
              <Line type="monotone" dataKey="delayed" stroke="#ef4444" name="Delayed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health Status</CardTitle>
          <CardDescription>Core system component status and uptime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((item) => (
              <div key={item.component} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.component}</p>
                  <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.uptime}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    Healthy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalMonitoring;
