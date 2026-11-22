import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { addDaysKey, localDateKey, timeAgo, todayKey } from "../lib/utils.js";
import Avatar from "../components/Avatars.jsx";
import { ListSkeleton } from "../components/Skeleton.jsx";
import { ACTIVITY_META as ICONS } from "../lib/ActivityMeta.js";

const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "tasks", label: "Tasks", match: (a) => a.startsWith("task.") && a !== "task.assigned" },
  { key: "assign", label: "Assignments", match: (a) => a === "task.assigned" },
  { key: "projects", label: "Projects", match: (a) => a.startsWith("project.") },
];

const localKey = (iso) => localDateKey(iso);

function dayLabel(key) {
  const today = todayKey();
  if (key === today) return "Today";
  if (key === addDaysKey(today, -1)) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function ActivityPage() {
  const { workspaceId } = useParams();
  const [filter, setFilter] = useState("all");

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["activity", workspaceId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get(`/activity/${workspaceId}`, { params: { page: pageParam, limit: 30 } }).then((r) => r.data),
    getNextPageParam: (last) => (last.pagination.hasNextPage ? last.pagination.page + 1 : undefined),
  });

  const all = data?.pages.flatMap((p) => p.activities) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const groups = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    const map = new Map();
    all.filter((a) => f.match(a.action)).forEach((a) => {
      const k = localKey(a.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    });
    return [...map.entries()];
  }, [all, filter]);

  const shownCount = groups.reduce((n, [, l]) => n + l.length, 0);

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Activity</h1>
          <p className="text-sm text-slate-500">
            Everything that happens in this workspace{total > 0 && ` · ${total} events`}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <ListSkeleton rows={8} />}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{getErrorMessage(error)}</div>}

      {!isLoading && !error && shownCount === 0 && (
        <div className="card p-14 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
            <Activity size={22} />
          </div>
          <p className="font-medium text-slate-800">
            {all.length === 0 ? "No activity yet" : "Nothing matches this filter"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {all.length === 0 ? "Create a project or task and it will show up here." : "Try another filter or load more."}
          </p>
        </div>
      )}

      {groups.map(([key, list]) => (
        <section key={key}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            {dayLabel(key)}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{list.length}</span>
          </h2>

          <div className="card divide-y divide-slate-100 overflow-hidden">
            {list.map((a) => {
              const meta = ICONS[a.action] ?? ICONS["task.updated"];
              const Icon = meta.icon;
              return (
                <div key={a._id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition hover:bg-blue-50/30
                             md:grid-cols-[220px_auto_1fr_180px_110px]">
                  {/* person */}
                  <div className="hidden items-center gap-2.5 md:flex">
                    <Avatar user={a.actor} size={28} />
                    <span className="truncate text-sm font-medium text-slate-800">{a.actor?.name ?? "Someone"}</span>
                  </div>

                  {/* icon */}
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls}`}>
                    <Icon size={16} />
                  </div>

                  {/* message */}
                  <p className="min-w-0 text-sm text-slate-700">
                    <span className="font-medium text-slate-900 md:hidden">{a.actor?.name ?? "Someone"} </span>
                    {a.message}
                  </p>

                  {/* project */}
                  <div className="hidden truncate text-xs text-slate-500 md:block">
                    {a.project?.name && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">{a.project.name}</span>
                    )}
                  </div>

                  {/* time */}
                  <span className="text-right text-xs text-slate-400" title={new Date(a.createdAt).toLocaleString()}>
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-secondary mx-auto flex">
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}