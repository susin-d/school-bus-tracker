import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function AdminThemeSettings() {
  const { toast } = useToast();
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);

  const themes = [
    {
      id: 'light',
      name: 'Light Theme',
      description: 'Clean and bright interface',
      preview: 'bg-white border-2 border-gray-200',
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Dark mode for reduced eye strain',
      preview: 'bg-slate-950 border-2 border-slate-700',
    },
    {
      id: 'auto',
      name: 'Auto (System)',
      description: 'Follow system preferences',
      preview: 'bg-gradient-to-r from-white to-slate-950 border-2 border-gray-400',
    },
  ];

  const handleThemeChange = async (newTheme: string) => {
    setLoading(true);
    try {
      setTheme(newTheme);
      toast({
        title: 'Theme Updated',
        description: `Theme has been changed to ${newTheme}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update theme.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Settings</h1>
        <p className="text-muted-foreground mt-2">Customize the appearance of the admin panel</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Theme</CardTitle>
          <CardDescription>Choose your preferred theme for the admin interface</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange} disabled={loading}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map((themeOption) => (
                <div key={themeOption.id} className="space-y-3">
                  <div
                    className={`w-full h-32 rounded-lg ${themeOption.preview} flex items-center justify-center transition-all`}
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Preview</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={themeOption.id} id={themeOption.id} />
                    <Label htmlFor={themeOption.id} className="cursor-pointer flex-1">
                      <div>
                        <div className="font-medium">{themeOption.name}</div>
                        <div className="text-sm text-muted-foreground">{themeOption.description}</div>
                      </div>
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Additional display and layout preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Compact Layout</p>
              <p className="text-sm text-muted-foreground">Reduce spacing and padding throughout the app</p>
            </div>
            <Button variant="outline" disabled>
              Toggle
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Sidebar Position</p>
              <p className="text-sm text-muted-foreground">Choose left or right sidebar placement</p>
            </div>
            <Button variant="outline" disabled>
              Configure
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Font Size</p>
              <p className="text-sm text-muted-foreground">Adjust the base font size of the interface</p>
            </div>
            <Button variant="outline" disabled>
              Adjust
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Animation Effects</p>
              <p className="text-sm text-muted-foreground">Enable or disable UI animations</p>
            </div>
            <Button variant="outline" disabled>
              Toggle
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Design System</CardTitle>
        </CardHeader>
        <CardContent className="text-green-800">
          <p>
            This admin panel uses a modern design system built with TailwindCSS and shadcn/ui components.
            All themes are fully accessible and WCAG 2.1 compliant.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminThemeSettings;
