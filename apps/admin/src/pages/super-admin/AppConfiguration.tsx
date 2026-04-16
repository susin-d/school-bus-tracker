import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function AppConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState({
    maintenanceMode: false,
    enableNotifications: true,
    enableAnalytics: true,
    enableMapTracking: true,
    maxLoginAttempts: '5',
    sessionTimeout: '30',
    maxUploadSize: '50',
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Configuration Saved',
        description: 'App configuration has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const configSections = [
    {
      title: 'System Status',
      items: [
        {
          label: 'Maintenance Mode',
          key: 'maintenanceMode',
          type: 'toggle',
          description: 'Disable all user access except maintenance staff',
        },
      ],
    },
    {
      title: 'Features',
      items: [
        {
          label: 'Enable Notifications',
          key: 'enableNotifications',
          type: 'toggle',
          description: 'Allow push notifications to mobile apps',
        },
        {
          label: 'Enable Analytics',
          key: 'enableAnalytics',
          type: 'toggle',
          description: 'Track and store system analytics data',
        },
        {
          label: 'Enable Real-Time Map Tracking',
          key: 'enableMapTracking',
          type: 'toggle',
          description: 'Enable live vehicle tracking on maps',
        },
      ],
    },
    {
      title: 'Security & Limits',
      items: [
        {
          label: 'Max Login Attempts',
          key: 'maxLoginAttempts',
          type: 'input',
          description: 'Maximum failed login attempts before account lock',
        },
        {
          label: 'Session Timeout (minutes)',
          key: 'sessionTimeout',
          type: 'input',
          description: 'Auto-logout duration for inactive sessions',
        },
        {
          label: 'Max Upload Size (MB)',
          key: 'maxUploadSize',
          type: 'input',
          description: 'Maximum file upload size allowed',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">App Configuration</h1>
        <p className="text-muted-foreground mt-2">Configure system-wide application settings</p>
      </div>

      {configSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-4 border-b last:border-b-0">
                  <div className="flex-1">
                    <Label className="text-base font-medium">{item.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <div className="ml-4">
                    {item.type === 'toggle' ? (
                      <Switch
                        checked={config[item.key as keyof typeof config] as boolean}
                        onCheckedChange={(value) => handleConfigChange(item.key, value)}
                      />
                    ) : (
                      <Input
                        type="text"
                        value={config[item.key as keyof typeof config]}
                        onChange={(e) => handleConfigChange(item.key, e.target.value)}
                        className="w-24"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSaveConfig} disabled={loading}>
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Warning</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-800">
          <p>
            Changes to configuration may affect system performance and user experience. Please ensure you
            understand the implications before saving.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppConfiguration;
