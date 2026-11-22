import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { api } from "../lib/api.js";
import { fetchProjects } from "../lib/queries.js";
import { STATUSES } from "../lib/constants.js";
import { assigneeId } from "../lib/utils.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMembers } from "../hooks/useMembers.js";
import TaskCard from "../components/TaskCard.jsx";
import TaskPanel from "../components/TaskPanel.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import ProjectMenu from "../components/ProjectMenu.jsx";

export default function ProjectBoard() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [panel, setPanel] = useState(null);
  const [text, setText] = useState("");
  const [who, setWho] = useState("all");
  const [dragOver, setDragOver] = useState(null);
  const [tab, setTab] = useState("todo"); // mobile: active status tab

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId),
  });
  const project = projects.find((p) => p._id === projectId);

  const { data: members = [] } = useMembers(workspaceId);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api.get(`/task/get/${projectId}`).then((r) => r.data.tasks),
  });

  const myRole = members.find((m) => m.user._id === user._id)?.role;
  const canManage = project && (myRole === "admin" || project.createdBy === user._id);

  // Status change with optimistic update and rollback (drag on desktop, dropdown on mobile)
  const move = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/task/update/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["tasks", projectId] });
      const prev = qc.getQueryData(["tasks", projectId]);
      qc.setQueryData(["tasks", projectId], (old = []) =>
        old.map((t) => (t._id === id ? { ...t, status } : t))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(["tasks", projectId], ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
      ["dashboard", "activity", "my-tasks", "calendar"].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] })
      );
    },
  });

  const visible = tasks.filter((t) => {
    if (text && !t.title.toLowerCase().includes(text.toLowerCase())) return false;
    if (who === "me") return assigneeId(t) === user._id;
    if (who === "unassigned") return !assigneeId(t);
    return true;
  });

  const onDrop = (e, status) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const t = tasks.find((x) => x._id === id);
    if (t && t.status !== status) move.mutate({ id, status });
  };

  const editing = panel?.taskId ? tasks.find((t) => t._id === panel.taskId) : null;
  const openTask = (task) => setPanel({ taskId: task._id });

  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">
        Could not load this project.
      </div>
    );

  const EmptyState = ({ active }) => (
    <div
      className={`flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition ${
        active ? "border-blue-400 bg-blue-100/50" : "border-slate-300/80 bg-white/40"
      }`}
    >
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
        <Plus size={16} />
      </div>
      <p className="text-xs font-medium text-slate-500">No tasks here</p>
      <p className="mt-1 text-[11px] text-slate-400">
        <span className="hidden md:inline">Drag tasks here or create a new one</span>
        <span className="md:hidden">Tap + to create one</span>
      </p>
    </div>
  );

  const mobileItems = visible.filter((t) => t.status === tab);
  const tabMeta = STATUSES.find((s) => s.key === tab);

  return (
    // Desktop: fixed height so columns scroll internally. Mobile: normal page scroll.
    <div className="flex min-h-0 flex-col sm:h-[calc(100dvh-7rem)]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:mb-6 sm:pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
            style={{ background: project?.color || "#3b82f6" }}
          />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <LayoutGrid size={15} className="text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</span>
            </div>
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {project?.name ?? "Project"}
            </h1>
            {project?.description && (
              <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-relaxed text-slate-500">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-48"
            />
          </div>

          <div className="relative min-w-0 flex-1 sm:flex-none">
            <SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={who}
              onChange={(e) => setWho(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-600 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Everyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <button
            onClick={() => setPanel({ defaultStatus: tab === "todo" || window.innerWidth >= 768 ? "todo" : tab })}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden min-[400px]:inline">New task</span>
          </button>

          {canManage && <ProjectMenu key={project._id} project={project} workspaceId={workspaceId} />}
        </div>
      </div>

      {/* LOADING */}
      {isLoading && (
        <>
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="hidden min-h-0 flex-1 gap-4 overflow-x-auto pb-4 md:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-full min-h-96 w-72 shrink-0 rounded-2xl lg:w-auto lg:flex-1" />
            ))}
          </div>
        </>
      )}

      {!isLoading && (
        <>
          {/* MOBILE: status tabs + single list */}
          <div className="md:hidden">
            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {STATUSES.map((s) => {
                const count = visible.filter((t) => t.status === s.key).length;
                const active = tab === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setTab(s.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : s.dot}`} />
                    {s.label}
                    <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pb-6">
              {mobileItems.map((t) => (
                <div key={t._id} className="space-y-1.5">
                  <TaskCard task={t} members={members} onOpen={openTask} />
                  <label className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
                    Move to
                    <select
                      value={t.status}
                      onChange={(e) => move.mutate({ id: t._id, status: e.target.value })}
                      className="rounded-md border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs font-medium text-slate-700"
                    >
                      {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </label>
                </div>
              ))}
              {mobileItems.length === 0 && <EmptyState />}
              <button
                onClick={() => setPanel({ defaultStatus: tab })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
              >
                <Plus size={16} /> Add task to {tabMeta?.label}
              </button>
            </div>
          </div>

          {/* TABLET / DESKTOP: kanban */}
          <div className="hidden min-h-0 flex-1 gap-4 overflow-x-auto pb-4 md:flex">
            {STATUSES.map((col) => {
              const items = visible.filter((t) => t.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => onDrop(e, col.key)}
                  className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-all duration-200
                    lg:w-auto lg:min-w-60 lg:flex-1 ${
                    dragOver === col.key
                      ? "border-blue-300 bg-blue-50/80 ring-2 ring-blue-500/10"
                      : "border-slate-200/80 bg-slate-100/70"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                    <h2 className="text-sm font-bold text-slate-800">{col.label}</h2>
                    <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">
                      {items.length}
                    </span>
                    <button
                      onClick={() => setPanel({ defaultStatus: col.key })}
                      title={`Add task to ${col.label}`}
                      className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-blue-600 hover:shadow-sm"
                    >
                      <Plus size={17} />
                    </button>
                  </div>

                  <div className="min-h-30 flex-1 space-y-3 overflow-y-auto pr-1">
                    {items.map((t) => (
                      <TaskCard key={t._id} task={t} members={members} onOpen={openTask} />
                    ))}
                    {items.length === 0 && <EmptyState active={dragOver === col.key} />}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TASK PANEL */}
      {panel && (panel.taskId ? editing : true) && (
        <TaskPanel
          key={panel.taskId ?? `new-${panel.defaultStatus}`}
          task={editing}
          defaultStatus={panel.defaultStatus}
          projectId={projectId}
          members={members}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}