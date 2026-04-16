import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function SystemAnalytics() {
  const analyticsData = [
    { month: 'Jan', trips: 2400, students: 2210, drivers: 2290 },
    { month: 'Feb', trips: 1398, students: 2210, drivers: 2290 },
    { month: 'Mar', trips: 9800, students: 2290, drivers: 2000 },
    { month: 'Apr', trips: 3908, students: 2000, drivers: 2181 },
    { month: 'May', trips: 4800, students: 2181, drivers: 2500 },
    { month: 'Jun', trips: 3800, students: 2500, drivers: 2100 },
  ];

  const tripsByType = [
    { name: 'Morning Routes', value: 45 },
    { name: 'Afternoon Routes', value: 35 },
    { name: 'Special Trips', value: 20 },
  ];

  const performanceMetrics = [
    { metric: 'On-Time Completion Rate', value: '98.2%', trend: '+2.1%' },
    { metric: 'Average Trip Duration', value: '42 min', trend: '-3 min' },
    { metric: 'Student Attendance Rate', value: '94.8%', trend: '+1.2%' },
    { metric: 'Driver Safety Score', value: '9.7/10', trend: '+0.3' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Analytics</h1>
        <p className="text-muted-foreground mt-2">Comprehensive analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <Card key={metric.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-green-600 mt-1">{metric.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Trends (6 Months)</CardTitle>
          <CardDescription>Trips, student registrations, and driver onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trips" stroke="#3b82f6" name="Trips" />
              <Line type="monotone" dataKey="students" stroke="#10b981" name="Students" />
              <Line type="monotone" dataKey="drivers" stroke="#f59e0b" name="Drivers" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trips by Route Type</CardTitle>
            <CardDescription>Distribution of trip types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tripsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tripsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Completion Rate</CardTitle>
            <CardDescription>Monthly completion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { month: 'Jan', rate: 96 },
                  { month: 'Feb', rate: 97 },
                  { month: 'Mar', rate: 98 },
                  { month: 'Apr', rate: 98.2 },
                  { month: 'May', rate: 97.8 },
                  { month: 'Jun', rate: 98.1 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[95, 100]} />
                <Tooltip />
                <Bar dataKey="rate" fill="#10b981" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SystemAnalytics;
