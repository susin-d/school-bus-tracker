import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function RolesAndPermissions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const roles = [
    {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Full system access with administrative capabilities',
      users: 1,
      permissions: 45,
    },
    {
      id: 'admin',
      name: 'School Administrator',
      description: 'School-level administrative access',
      users: 8,
      permissions: 32,
    },
    {
      id: 'staff',
      name: 'School Staff',
      description: 'Limited operational access for staff members',
      users: 24,
      permissions: 15,
    },
    {
      id: 'driver',
      name: 'Driver',
      description: 'Driver-specific application access',
      users: 156,
      permissions: 8,
    },
    {
      id: 'parent',
      name: 'Parent/Guardian',
      description: 'Parent application access',
      users: 1203,
      permissions: 5,
    },
  ];

  const permissions = [
    { id: 'users:read', name: 'Read Users', scope: 'All' },
    { id: 'users:create', name: 'Create Users', scope: 'School' },
    { id: 'users:update', name: 'Update Users', scope: 'School' },
    { id: 'users:delete', name: 'Delete Users', scope: 'School' },
    { id: 'reports:read', name: 'View Reports', scope: 'All' },
    { id: 'reports:export', name: 'Export Reports', scope: 'School' },
    { id: 'security:manage', name: 'Manage Security', scope: 'System' },
    { id: 'audit:view', name: 'View Audit Logs', scope: 'All' },
  ];

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-2">Manage system roles and access control</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>Defined roles and their permissions</CardDescription>
          </div>
          <Button disabled>Add Role</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users Assigned</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                      <TableCell>{role.users}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{role.permissions} permissions</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Permissions</CardTitle>
          <CardDescription>System permissions that can be assigned to roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissions.map((permission) => (
              <div key={permission.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{permission.name}</p>
                    <p className="text-sm text-muted-foreground">ID: {permission.id}</p>
                  </div>
                  <Badge variant="secondary">{permission.scope}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RolesAndPermissions;
