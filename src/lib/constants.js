export const STATUSES = [
    { key: "todo", label: "To do", dot: "bg-slate-400" },
    { key: "in_progress", label: "In progress", dot: "bg-blue-500" },
    { key: "blocked", label: "Blocked", dot: "bg-red-500" },
    { key: "done", label: "Done", dot: "bg-emerald-500" },
  ];
  
  export const PRIORITIES = {
    low: { label: "Low", cls: "bg-slate-100 text-slate-600" },
    medium: { label: "Medium", cls: "bg-blue-50 text-blue-700" },
    high: { label: "High", cls: "bg-amber-50 text-amber-700" },
    urgent: { label: "Urgent", cls: "bg-red-50 text-red-700" },
  };

export const STATUS_COLORS = { todo: "#94a3b8", in_progress: "#3b82f6", blocked: "#ef4444", done: "#10b981" };
export const PRIORITY_COLORS = { low: "#94a3b8", medium: "#3b82f6", high: "#f59e0b", urgent: "#ef4444" };
export const PROJECT_COLORS = ["#2563eb", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#64748b"];