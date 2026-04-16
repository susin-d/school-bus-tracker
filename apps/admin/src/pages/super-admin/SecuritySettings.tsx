import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function SecuritySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const securityAudits = [
    {
      id: 1,
      event: 'User Login',
      user: 'rls.super.admin@schoolbus.local',
      timestamp: '2026-04-16 10:45:23',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: 2,
      event: 'Data Export',
      user: 'admin.school@susindran.in',
      timestamp: '2026-04-16 09:32:15',
      status: 'success',
      ipAddress: '192.168.1.105',
    },
    {
      id: 3,
      event: 'Configuration Change',
      user: 'rls.super.admin@schoolbus.local',
      timestamp: '2026-04-15 15:20:44',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: 4,
      event: 'Failed Login Attempt',
      user: 'unknown@email.com',
      timestamp: '2026-04-15 14:10:30',
      status: 'failed',
      ipAddress: '203.0.113.42',
    },
    {
      id: 5,
      event: 'Permission Change',
      user: 'rls.super.admin@schoolbus.local',
      timestamp: '2026-04-15 11:05:12',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
  ];

  const securityMetrics = [
    {
      metric: 'Failed Login Attempts (24h)',
      value: 3,
      threshold: 10,
      status: 'safe',
    },
    {
      metric: 'Suspicious Activities Detected',
      value: 0,
      threshold: 5,
      status: 'safe',
    },
    {
      metric: 'Active Security Sessions',
      value: 12,
      threshold: 100,
      status: 'safe',
    },
    {
      metric: 'API Rate Limit Violations',
      value: 0,
      threshold: 50,
      status: 'safe',
    },
  ];

  const handleEnableMFA = async () => {
    setLoading(true);
    try {
      toast({
        title: 'MFA Configuration',
        description: 'Multi-factor authentication settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update MFA settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Session Revoked',
        description: 'The selected session has been revoked.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke session.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-2">Monitor and configure system security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {securityMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Threshold: {metric.threshold}</p>
              <Badge
                variant={metric.status === 'safe' ? 'outline' : 'destructive'}
                className="mt-2 bg-green-50 text-green-700 border-green-200"
              >
                {metric.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Actions</CardTitle>
          <CardDescription>Configure security features and policies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Multi-Factor Authentication (MFA)</p>
                <p className="text-sm text-muted-foreground">Require MFA for all admin accounts</p>
              </div>
              <Button onClick={handleEnableMFA} disabled={loading}>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">IP Whitelist</p>
                <p className="text-sm text-muted-foreground">Restrict admin access to specific IPs</p>
              </div>
              <Button variant="outline" disabled>
                Edit Whitelist
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Password Policy</p>
                <p className="text-sm text-muted-foreground">Configure minimum password requirements</p>
              </div>
              <Button variant="outline" disabled>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Session Management</p>
                <p className="text-sm text-muted-foreground">Manage active admin sessions</p>
              </div>
              <Button variant="outline" onClick={handleRevokeSession} disabled={loading}>
                Manage Sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Recent security events and administrative actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.event}</TableCell>
                    <TableCell>{audit.user}</TableCell>
                    <TableCell className="text-sm">{audit.timestamp}</TableCell>
                    <TableCell className="text-sm">{audit.ipAddress}</TableCell>
                    <TableCell>
                      <Badge
                        variant={audit.status === 'success' ? 'outline' : 'destructive'}
                        className={
                          audit.status === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {audit.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySettings;
