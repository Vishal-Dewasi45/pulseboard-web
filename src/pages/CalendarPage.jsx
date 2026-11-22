import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { fetchProjects } from "../lib/queries.js";
import { PRIORITIES, PRIORITY_COLORS } from "../lib/constants.js";
import { dueKey, isOverdue, resolveAssignee, todayKey } from "../lib/utils.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMembers } from "../hooks/useMembers.js";
import Avatar from "../components/Avatars.jsx";
import TaskPanel from "../components/TaskPanel.jsx";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const tone = (t) =>
  t.status === "done"
    ? { chip: "bg-emerald-50 text-emerald-700 line-through", dot: "bg-emerald-500" }
    : isOverdue(t)
    ? { chip: "bg-red-50 text-red-700", dot: "bg-red-500" }
    : { chip: "bg-blue-50 text-blue-700", dot: "bg-blue-500" };

export default function CalendarPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const today = todayKey();

  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [who, setWho] = useState("all");
  const [selected, setSelected] = useState(today);
  const [open, setOpen] = useState(null);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
    const start = Date.UTC(cursor.y, cursor.m, 1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10));
  }, [cursor]);

  const { data: members = [] } = useMembers(workspaceId);
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => fetchProjects(workspaceId),
  });

  const { data: tasks = [], isFetching } = useQuery({
    queryKey: ["calendar", workspaceId, cells[0], who],
    queryFn: () =>
      api.get(`/workspace/${workspaceId}/search`, {
        params: {
          dueFrom: `${cells[0]}T00:00:00.000Z`,
          dueTo: `${cells[41]}T23:59:59.999Z`,
          limit: 100,
          ...(who === "me" && { assignee: user._id }),
        },
      }).then((r) => r.data.tasks),
    placeholderData: keepPreviousData,
  });

  const byDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => { (map[dueKey(t.dueDate)] ||= []).push(t); });
    return map;
  }, [tasks]);

  const monthTasks = tasks.filter((t) => Number(dueKey(t.dueDate).slice(5, 7)) - 1 === cursor.m);
  const stats = {
    total: monthTasks.length,
    done: monthTasks.filter((t) => t.status === "done").length,
    overdue: monthTasks.filter(isOverdue).length,
  };

  const shift = (n) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const goToday = () => {
    const n = new Date();
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
    setSelected(today);
  };

  const title = new Date(Date.UTC(cursor.y, cursor.m, 1)).toLocaleDateString(undefined, {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const selectedTasks = byDay[selected] ?? [];
  const projectOf = (t) => projects.find((p) => p._id === (t.project?._id ?? t.project));

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500">Task due dates across your workspace</p>
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className="input ml-auto !w-auto">
          <option value="all">Everyone's tasks</option>
          <option value="me">Assigned to me</option>
        </select>
      </div>

      {/* Month controls + stats */}
      <div className="card flex flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="btn-secondary !p-2" aria-label="Previous month"><ChevronLeft size={16} /></button>
          <button onClick={() => shift(1)} className="btn-secondary !p-2" aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
        <div className="min-w-40 text-lg font-semibold text-slate-900">{title}</div>
        <button onClick={goToday} className="btn-secondary !py-1.5">Today</button>
        {isFetching && <span className="text-xs text-slate-400">Updating…</span>}

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{stats.total} due</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">{stats.done} done</span>
          <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600">{stats.overdue} overdue</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        {/* Grid */}
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((key, i) => {
              const inMonth = Number(key.slice(5, 7)) - 1 === cursor.m;
              const list = byDay[key] ?? [];
              const isToday = key === today;
              const isSel = key === selected;
              return (
                <div key={key} onClick={() => setSelected(key)}
                  className={`min-h-16 cursor-pointer border-b border-slate-100 p-1 transition sm:min-h-28 sm:p-1.5
                    ${i % 7 !== 6 ? "border-r" : ""}
                    ${inMonth ? "bg-white" : "bg-slate-50/70"}
                    ${isSel ? "bg-blue-50/60 ring-2 ring-inset ring-blue-400" : "hover:bg-blue-50/30"}`}>
                  <div className="mb-1 flex justify-end">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs
                      ${isToday ? "bg-blue-600 font-semibold text-white" : inMonth ? "text-slate-700" : "text-slate-400"}`}>
                      {Number(key.slice(8))}
                    </span>
                  </div>

                  {/* Desktop chips */}
                  <div className="hidden space-y-1 sm:block">
                    {list.slice(0, 3).map((t) => (
                      <button key={t._id}
                        onClick={(e) => { e.stopPropagation(); setOpen(t); }}
                        style={{ borderLeftColor: PRIORITY_COLORS[t.priority] }}
                        className={`flex w-full items-center gap-1 rounded border-l-[3px] px-1.5 py-0.5 text-left text-[11px] font-medium ${tone(t).chip}`}>
                        <span className="flex-1 truncate">{t.title}</span>
                        <Avatar user={resolveAssignee(t, members)} size={14} />
                      </button>
                    ))}
                    {list.length > 3 && <div className="px-1 text-[11px] font-medium text-slate-500">+{list.length - 3} more</div>}
                  </div>

                  {/* Mobile dots */}
                  <div className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {list.slice(0, 4).map((t) => (
                      <span key={t._id} className={`h-1.5 w-1.5 rounded-full ${tone(t).dot}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Upcoming</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Overdue</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Done</span>
            <span className="ml-auto hidden sm:inline">Left border = priority</span>
          </div>
        </div>

        {/* Selected day */}
        <aside className="card h-fit overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-4 py-3.5">
            <h2 className="font-semibold text-slate-900">
              {new Date(`${selected}T00:00:00Z`).toLocaleDateString(undefined, {
                weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
              })}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"} due
            </p>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                <CalendarCheck size={18} />
              </div>
              <p className="text-sm text-slate-500">Nothing due this day.</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {selectedTasks.map((t) => {
                const a = resolveAssignee(t, members);
                const proj = projectOf(t);
                return (
                  <button key={t._id} onClick={() => setOpen(t)}
                    style={{ borderLeftColor: PRIORITY_COLORS[t.priority] }}
                    className="w-full space-y-2 rounded-lg border border-l-4 border-slate-200 p-3 text-left transition hover:bg-slate-50">
                    <div className={`text-sm font-medium ${t.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {t.title}
                    </div>
                    {proj && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: proj.color }} /> {proj.name}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITIES[t.priority].cls}`}>
                        {PRIORITIES[t.priority].label}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        {a ? <><Avatar user={a} size={18} /> {a.name}</> : "Unassigned"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
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