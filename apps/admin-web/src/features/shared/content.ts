import type { AdminView, Metric, ModuleCard } from "./types";

export const roleContent: Record<
  AdminView,
  {
    title: string;
    subtitle: string;
    metrics: Metric[];
    primaryModules: ModuleCard[];
    secondaryModules: ModuleCard[];
  }
> = {
  school_admin: {
    title: "School Admin Control Room",
    subtitle:
      "Run one school's transport day from a single surface: students, buses, routes, alerts, and leave approvals.",
    metrics: [
      { label: "Active Trips", value: "12" },
      { label: "Delayed Trips", value: "2", tone: "warm" },
      { label: "Pending Leave Requests", value: "18" },
      { label: "Open Alerts", value: "3", tone: "warm" }
    ],
    primaryModules: [
      {
        title: "Daily Operations",
        summary: "Live transport monitoring for one school.",
        bullets: [
          "Track active trips and recent location freshness",
          "Review boarding exceptions and attendance anomalies",
          "Resolve delays before parent escalations spread"
        ]
      },
      {
        title: "Students and Guardians",
        summary: "School-scoped visibility into families and assignments.",
        bullets: [
          "Search students, guardians, routes, and buses",
          "Open attendance history without leaving the dashboard",
          "Confirm that every child has an active transport assignment"
        ]
      },
      {
        title: "Resources",
        summary: "Manage buses, routes, stops, and driver assignments.",
        bullets: [
          "Route stop ordering and timing checks",
          "Bus capacity and active status review",
          "Assignment quality checks before the next school day"
        ]
      }
    ],
    secondaryModules: [
      {
        title: "Alerts Center",
        summary: "Acknowledge and resolve school-scoped alerts.",
        bullets: [
          "Prioritize SOS and delay alerts",
          "Leave an audit trail for every resolution",
          "Escalate unresolved incidents to central operations"
        ]
      },
      {
        title: "Leave Requests",
        summary: "Review parent-submitted transport exceptions.",
        bullets: [
          "Approve pickup or drop-off exemptions",
          "Flag repeat absences for follow-up",
          "Reduce day-of-trip confusion for drivers and parents"
        ]
      }
    ]
  },
  super_admin: {
    title: "Super Admin Global Console",
    subtitle:
      "See every school, every school admin, and the highest-risk operations signals across the platform.",
    metrics: [
      { label: "Schools", value: "24" },
      { label: "School Admins", value: "39" },
      { label: "Open Alerts", value: "8", tone: "warm" },
      { label: "Users Across Schools", value: "8,420" }
    ],
    primaryModules: [
      {
        title: "School Network",
        summary: "View the entire school portfolio at once.",
        bullets: [
          "Create schools and review rollout readiness",
          "Spot schools with repeated transport incidents",
          "Audit onboarding quality before scale expands"
        ]
      },
      {
        title: "Admin Governance",
        summary: "Manage school admins and system-level permissions.",
        bullets: [
          "Create or deactivate school admins",
          "Verify every school has an accountable operations owner",
          "Review privileged users without opening each school separately"
        ]
      },
      {
        title: "Cross-School Reporting",
        summary: "Compare operational health across the network.",
        bullets: [
          "Alert trends by school and region",
          "Utilization and assignment quality snapshots",
          "Platform-wide backlog views for support and rollout planning"
        ]
      }
    ],
    secondaryModules: [
      {
        title: "System Controls",
        summary: "Platform-level management and risk visibility.",
        bullets: [
          "Manage schools, users, and status across the platform",
          "Review unresolved alerts that require central intervention",
          "Prepare future settings pages for notifications and policy controls"
        ]
      },
      {
        title: "Executive Snapshot",
        summary: "A readout layer for leadership and expansion planning.",
        bullets: [
          "School readiness and support needs",
          "User growth and role distribution",
          "Operational consistency across all schools"
        ]
      }
    ]
  }
};

export const screenPlan = {
  parent: [
    "Login",
    "Parent Home",
    "Live Trip Tracking",
    "Attendance History",
    "Leave Request",
    "Notifications",
    "Profile"
  ],
  schoolAdmin: [
    "Dashboard",
    "Students",
    "Parents",
    "Drivers",
    "Buses",
    "Routes & Stops",
    "Assignments",
    "Alerts",
    "Leave Requests"
  ],
  superAdmin: [
    "Global Dashboard",
    "Schools",
    "School Admins",
    "Users",
    "Operations Overview",
    "Platform Settings"
  ]
};
