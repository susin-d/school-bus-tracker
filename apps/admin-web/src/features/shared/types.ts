export type AdminView = "school_admin" | "super_admin";

export type Metric = {
  label: string;
  value: string;
  tone?: "default" | "warm";
};

export type ModuleCard = {
  title: string;
  summary: string;
  bullets: string[];
};
