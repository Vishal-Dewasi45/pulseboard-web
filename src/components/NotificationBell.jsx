import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, UserPlus, ArrowRightLeft, Mail, FolderKanban } from "lucide-react";
import { api } from "../lib/api.js";
import { fetchUnreadCount } from "../lib/queries.js";
import { timeAgo } from "../lib/utils.js";
import { useClickOutside } from "../hooks/useClickOutside.js";
import { Skeleton } from "./Skeleton.jsx";

const TYPE_META = {
  "task.assigned": { icon: UserPlus, cls: "bg-indigo-50 text-indigo-600" },
  "task.status_changed": { icon: ArrowRightLeft, cls: "bg-amber-50 text-amber-600" },
  "workspace.invitation": { icon: Mail, cls: "bg-blue-50 text-blue-600" },
  "project.created": { icon: FolderKanban, cls: "bg-emerald-50 text-emerald-600" },
};

export default function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  useClickOutside(ref, () => setOpen(false));

  const { data: unread = 0 } = useQuery({ queryKey: ["unread"], queryFn: fetchUnreadCount });
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications", { params: { limit: 20 } }).then((r) => r.data.notifications),
    enabled: open,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["unread"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOne = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: refresh,
  });
  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: refresh,
  });

  const go = (n) => {
    if (!n.isRead) markOne.mutate(n._id);
    setOpen(false);
    if (n.type === "workspace.invitation") navigate("/invitations");
    else if (n.project?._id) navigate(`/w/${n.workspace}/projects/${n.project._id}`);
  };

  const shown = tab === "unread" ? list.filter((n) => !n.isRead) : list;

  return (
    <div className="sm:relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Notifications"
        className={`relative rounded-lg p-2 transition ${open ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-100"}`}>
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="card fixed inset-x-3 top-[4.25rem] z-40 overflow-hidden shadow-xl animate-fade-in
                        sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r: from-blue-50 to-white px-8 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {unread > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">{unread} new</span>
              )}
            </div>
            <button disabled={unread === 0 || markAll.isPending} onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800 disabled:text-slate-400">
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  tab === t.key ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-26rem overflow-y-auto">
            {isLoading && (
              <div className="space-y-4 p-4">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && shown.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <BellOff size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {tab === "unread" ? "No unread notifications" : "You're all caught up"}
                </p>
                <p className="mt-1 text-xs text-slate-500">New updates will appear here.</p>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {shown.map((n) => {
                const meta = TYPE_META[n.type] ?? TYPE_META["task.assigned"];
                const Icon = meta.icon;
                return (
                  <button key={n._id} onClick={() => go(n)}
                    className={`relative flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                      n.isRead ? "" : "bg-blue-50/40"
                    }`}>
                    {!n.isRead && <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />}
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${n.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-slate-600">{n.message}</p>
                      {n.actor?.name && <p className="mt-1 text-xs text-slate-400">by {n.actor.name}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}