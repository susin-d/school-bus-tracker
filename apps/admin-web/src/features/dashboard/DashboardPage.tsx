import { motion } from "framer-motion";
import { 
  Activity, 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Calendar
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { AppShell } from "../../app/AppShell";
import { useRequiredAdminUser } from "../../core/auth";

const SAMPLE_CHART_DATA = [
  { name: "06:00", active: 20 },
  { name: "07:00", active: 45 },
  { name: "08:00", active: 120 },
  { name: "09:00", active: 80 },
  { name: "10:00", active: 60 },
  { name: "11:00", active: 55 },
  { name: "12:00", active: 70 },
];

export function DashboardPage() {
  useRequiredAdminUser();
  const unresolvedAlerts = 0;
  const delayedTrips = 0;
  const activeTrips = 0;
  const onboardStudents = 0;
  const onTimeRate =
    activeTrips > 0
      ? Math.max(0, Math.min(100, Math.round(((activeTrips - delayedTrips) / activeTrips) * 100)))
      : 100;
  const alertPressure = Math.min(100, unresolvedAlerts * 10);
  const hasLiveActivity = activeTrips > 0 || onboardStudents > 0;

  return (
    <AppShell title="Operations Dashboard" subtitle="Real-time monitoring and coordination" activeRoute="dashboard">
      <section className="dashboard-kpi-grid">
        <MetricCard 
          label="Active Trips" 
          value={String(activeTrips)} 
          icon={Activity}
          description="In-progress routes"
        />
        <MetricCard 
          label="Delayed Trips" 
          value={String(delayedTrips)} 
          tone="warm" 
          icon={Clock}
          description="Needs attention"
        />
        <MetricCard 
          label="Students Onboard" 
          value={String(onboardStudents)} 
          icon={Users}
          description="Total tracked"
        />
        <MetricCard 
          label="Open Alerts" 
          value={String(unresolvedAlerts)} 
          tone={unresolvedAlerts > 0 ? "warm" : "default"} 
          icon={AlertTriangle}
          description="Awaiting resolution"
        />
      </section>

      <section className="dashboard-main-grid">
        <article className="panel panel-surface flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2>Fleet Activity</h2>
              <p className="text-sm text-slate-500 font-medium pt-1">
                {hasLiveActivity ? "Trip density over the last 6 hours" : "No active telemetry yet for this window"}
              </p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className={`w-2 h-2 rounded-full ${hasLiveActivity ? "bg-orange-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">{hasLiveActivity ? "LIVE" : "STANDBY"}</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_CHART_DATA}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f57c00" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f57c00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    fontWeight: 700
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#f57c00" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!hasLiveActivity && (
            <div className="dashboard-empty-state" role="status" aria-live="polite">
              <p>Trips begin populating here once route execution starts for the day.</p>
            </div>
          )}
        </article>

        <div className="flex flex-col gap-6">
          <article className="panel panel-surface">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-600 border border-orange-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2>Efficiency Health</h2>
            </div>
            <HealthBar label="On-time rate" value={onTimeRate} tone="good" />
            <HealthBar label="Alert pressure" value={alertPressure} tone="warning" />
          </article>

          <article className="panel panel-surface">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <h2>Priority Queue</h2>
            </div>
            <div className="dashboard-priority-list">
              <PriorityRow label="Safety Protocol Alerts" value={String(unresolvedAlerts)} tone={unresolvedAlerts > 0 ? "warm" : "default"} />
              <PriorityRow label="Pending Leave Requests" value="3" tone="warm" />
              <PriorityRow label="Schedule Conflicts" value="0" />
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  description?: string;
  icon: any;
  tone?: "default" | "warm";
}) {
  return (
    <motion.article 
      whileHover={{ y: -4 }}
      className={tone === "warm" ? "metric-card warm panel-surface !bg-orange-50/30" : "metric-card panel-surface"}
    >
      <div className="flex justify-between items-start">
        <span>{label}</span>
        <Icon className={`w-5 h-5 ${tone === "warm" ? "text-orange-500" : "text-slate-400"}`} />
      </div>
      <strong>{value}</strong>
      {description && <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">{description}</p>}
    </motion.article>
  );
}

function HealthBar({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "good" | "warning";
}) {
  return (
    <div className="dashboard-health-row">
      <div className="dashboard-health-meta">
        <span className="text-slate-500">{label}</span>
        <strong className={tone === "good" ? "text-emerald-600" : "text-orange-600"}>{value}%</strong>
      </div>
      <div className="dashboard-health-track" aria-hidden="true">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={tone === "good" ? "dashboard-health-fill good" : "dashboard-health-fill warning"}
        />
      </div>
    </div>
  );
}

function PriorityRow({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warm";
}) {
  return (
    <div className={tone === "warm" ? "priority-row warm" : "priority-row"}>
      <span className="text-slate-600">{label}</span>
      <strong className={tone === "warm" ? "text-orange-700" : "text-slate-900"}>{value}</strong>
    </div>
  );
}
