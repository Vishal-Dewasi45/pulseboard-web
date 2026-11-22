import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, AlertTriangle, Clock, ListChecks, CheckCircle2, PartyPopper } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { fetchProjects } from "../lib/queries.js";
import { STATUSES, PRIORITIES } from "../lib/constants.js";
import { addDaysKey, dueKey, formatDue, todayKey } from "../lib/utils.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMembers } from "../hooks/useMembers.js";
import { Skeleton } from "../components/Skeleton.jsx";
import TaskPanel from "../components/TaskPanel.jsx";

const GROUPS = [
  { key: "overdue", label: "Overdue", icon: AlertTriangle, head: "text-red-600", badge: "bg-red-50 text-red-600" },
  { key: "today", label: "Due today", icon: Clock, head: "text-blue-600", badge: "bg-blue-50 text-blue-600" },
  { key: "week", label: "Next 7 days", icon: CalendarDays, head: "text-slate-700", badge: "bg-slate-100 text-slate-600" },
  { key: "later", label: "Later", icon: CalendarDays, head: "text-slate-700", badge: "bg-slate-100 text-slate-600" },
  { key: "none", label: "No due date", icon: ListChecks, head: "text-slate-500", badge: "bg-slate-100 text-slate-500" },
  { key: "done", label: "Completed", icon: CheckCircle2, head: "text-emerald-600", badge: "bg-emerald-50 text-emerald-600" },
];

function bucket(task) {
  if (task.status === "done") return "done";
  const k = dueKey(task.dueDate);
  if (!k) return "none";
  const today = todayKey();
  if (k < today) return "overdue";
  if (k === today) return "today";
  if (k <= addDaysKey(today, 7)) return "week";
  return "later";
}

function Stat({ label, value, tone }) {
  return (
    <div className="card px-4 py-3">
      <div className={`text-2xl font-semibold leading-none ${tone}`}>{value}</div>
      <div className="mt-1.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-slate-600">
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-18px" : "left-0.5"}`} />
      </span>
      {children}
    </button>
  );
}

function TaskRow({ task, project, overdue, onOpen }) {
  const st = STATUSES.find((s) => s.key === task.status);
  const pr = PRIORITIES[task.priority];
  const done = task.status === "done";

  return (
    <button onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-blue-50/40">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st?.dot}`} title={st?.label} />
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {project && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: project.color }} />
              {project.name}
            </span>
          )}
          <span className="text-slate-300">•</span>
          <span>{st?.label}</span>
        </div>
      </div>
      <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${pr.cls}`}>{pr.label}</span>
      {task.dueDate && (
        <span className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
          overdue ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
        }`}>
          <CalendarDays size={12} /> {formatDue(task.dueDate)}
        </span>
      )}
    </button>
  );
}

export default function MyTasks() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [showDone, setShowDone] = useState(false);
  const [open, setOpen] = useState(null);

  const { data: members = [] } = useMembers(workspaceId);
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId),
  });

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["my-tasks", workspaceId, user._id],
    queryFn: () =>
      api.get(`/workspace/${workspaceId}/search`, { params: { assignee: user._id, limit: 100 } })
        .then((r) => r.data.tasks),
  });

  const projectOf = (t) => projects.find((p) => p._id === (t.project?._id ?? t.project));

  const grouped = Object.fromEntries(GROUPS.map((g) => [g.key, []]));
  tasks.forEach((t) => grouped[bucket(t)].push(t));
  Object.values(grouped).forEach((list) =>
    list.sort((a, b) => (dueKey(a.dueDate) || "9999").localeCompare(dueKey(b.dueDate) || "9999"))
  );

  const openCount = tasks.filter((t) => t.status !== "done").length;
  const visibleGroups = GROUPS.filter((g) => (g.key !== "done" || showDone) && grouped[g.key].length > 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-500">
            {openCount} open task{openCount === 1 ? "" : "s"} assigned to you
          </p>
        </div>
        <Toggle checked={showDone} onChange={setShowDone}>Show completed</Toggle>
      </div>

      {!isLoading && !error && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Overdue" value={grouped.overdue.length} tone="text-red-600" />
          <Stat label="Due today" value={grouped.today.length} tone="text-blue-600" />
          <Stat label="Open" value={openCount} tone="text-slate-900" />
          <Stat label="Completed" value={grouped.done.length} tone="text-emerald-600" />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      )}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{getErrorMessage(error)}</div>}

      {!isLoading && !error && visibleGroups.length === 0 && (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
            <PartyPopper size={22} />
          </div>
          <p className="font-medium text-slate-800">You're all caught up</p>
          <p className="mt-1 text-sm text-slate-500">Tasks assigned to you will show up here.</p>
        </div>
      )}

      <div className="space-y-7">
        {visibleGroups.map((g) => {
          const Icon = g.icon;
          return (
            <section key={g.key}>
              <h2 className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${g.head}`}>
                <Icon size={15} /> {g.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${g.badge}`}>{grouped[g.key].length}</span>
              </h2>
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {grouped[g.key].map((t) => (
                  <TaskRow key={t._id} task={t} project={projectOf(t)} overdue={g.key === "overdue"}
                    onOpen={() => setOpen(t)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {open && (
        <TaskPanel
          key={open._id}
          task={open}
          projectId={open.project?._id ?? open.project}
          members={members}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}