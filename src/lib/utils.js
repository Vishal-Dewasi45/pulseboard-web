
export const formatDue = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }) : "";

  export const isOverdue = (task) =>
  !!task.dueDate && task.status !== "done" && dueKey(task.dueDate) < todayKey();

export const assigneeId = (task) => task?.assignee?._id ?? task?.assignee ?? "";

export const resolveAssignee = (task, members = []) =>
  task?.assignee && typeof task.assignee === "object"
    ? task.assignee
    : members.find((m) => m.user?._id === task?.assignee)?.user ?? null;


    export const dueKey = (iso) => (iso ? iso.slice(0, 10) : "");
    export const addDaysKey = (key, n) => {
      const d = new Date(`${key}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };
    export const localDateKey = (d = new Date()) => {
      const date = d instanceof Date ? d : new Date(d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    
    export const todayKey = () => localDateKey();
    export const timeAgo = (iso) => {
      const s = Math.floor((Date.now() - new Date(iso)) / 1000);
      if (s < 60) return "just now";
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      if (d < 7) return `${d}d ago`;
      return new Date(iso).toLocaleDateString();
    };