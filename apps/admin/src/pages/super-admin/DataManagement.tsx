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

export function DataManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const dataCollections = [
    {
      name: 'Users',
      count: 2345,
      size: '12.4 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
    {
      name: 'Schools',
      count: 45,
      size: '2.1 MB',
      lastUpdated: '2026-04-15',
      status: 'active',
    },
    {
      name: 'Students',
      count: 8923,
      size: '45.6 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
    {
      name: 'Drivers',
      count: 234,
      size: '8.9 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
    {
      name: 'Buses/Vehicles',
      count: 156,
      size: '6.2 MB',
      lastUpdated: '2026-04-15',
      status: 'active',
    },
    {
      name: 'Routes & Assignments',
      count: 523,
      size: '18.3 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
    {
      name: 'Trip History',
      count: 45230,
      size: '142.7 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
    {
      name: 'Announcements',
      count: 342,
      size: '4.5 MB',
      lastUpdated: '2026-04-16',
      status: 'active',
    },
  ];

  const handleExport = async (collection: string) => {
    setLoading(true);
    try {
      toast({
        title: 'Export Started',
        description: `Exporting ${collection} data...`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Backup Started',
        description: 'System backup has been initiated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create backup.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground mt-2">Manage, backup, and export system data</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Database Collections</CardTitle>
            <CardDescription>Overview of all data collections in the system</CardDescription>
          </div>
          <Button onClick={handleBackup} disabled={loading} variant="outline">
            Full System Backup
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collection</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataCollections.map((collection) => (
                  <TableRow key={collection.name}>
                    <TableCell className="font-medium">{collection.name}</TableCell>
                    <TableCell>{collection.count.toLocaleString()}</TableCell>
                    <TableCell>{collection.size}</TableCell>
                    <TableCell>{collection.lastUpdated}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {collection.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(collection.name)}
                        disabled={loading}
                      >
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Data Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">265.8 MB</div>
            <p className="text-xs text-muted-foreground mt-1">Across all collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">57,798</div>
            <p className="text-xs text-muted-foreground mt-1">All collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">2026-04-15</div>
            <p className="text-xs text-muted-foreground mt-1">23:45 UTC</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Data Retention Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ul className="list-disc list-inside space-y-2">
            <li>Trip history is retained for 2 years</li>
            <li>User audit logs are retained for 1 year</li>
            <li>Deleted user data is purged after 90 days</li>
            <li>System backups are created daily and retained for 30 days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataManagement;
