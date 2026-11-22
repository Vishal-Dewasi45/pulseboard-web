import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, CheckSquare, CalendarDays, Activity, Users, Mail,
  Plus, Zap, X, ArchiveRestore, ChevronDown,
} from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { fetchInvitations, fetchProjects } from "../lib/queries.js";
import { useCurrentWorkspace } from "../hooks/useCurrentWorkspace.js";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

function NewProject({ workspaceId, onDone }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api.post(`/project/create/${workspaceId}`, { name }).then((r) => r.data.project),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["projects", workspaceId] });
      setName("");
      setOpen(false);
      onDone();
      navigate(`/w/${workspaceId}/projects/${project._id}`);
    },
  });

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="rounded p-1 text-slate-500 hover:bg-slate-100" title="New project">
        <Plus size={16} />
      </button>
    );

  return (
    <form
      className="absolute left-0 right-0 top-9 z-10 space-y-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg"
      onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
    >
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="input" />
      {create.error && <p className="text-xs text-red-600">{getErrorMessage(create.error)}</p>}
      <div className="flex gap-2">
        <button disabled={name.trim().length < 2 || create.isPending} className="btn-primary flex-1 !py-1.5">Create</button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm text-slate-500">Cancel</button>
      </div>
    </form>
  );
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { workspaces, current } = useCurrentWorkspace();
  const wsId = current?._id;
  const [showArchived, setShowArchived] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", wsId],
    queryFn: () => fetchProjects(wsId),
    enabled: !!wsId,
  });

  const { data: archived = [] } = useQuery({
    queryKey: ["projects", wsId, "archived"],
    queryFn: () =>
      api.get(`/project/get/${wsId}`, { params: { archived: true } }).then((r) => r.data.projects),
    enabled: !!wsId,
  });

  const restore = useMutation({
    mutationFn: (id) => api.patch(`/project/update/${id}`, { status: "active" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", wsId] }),
  });

  const { data: invitations = [] } = useQuery({ queryKey: ["invitations"], queryFn: fetchInvitations });

  const nav = [
    { to: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "my-tasks", label: "My Tasks", icon: CheckSquare },
    { to: "calendar", label: "Calendar", icon: CalendarDays },
    { to: "activity", label: "Activity", icon: Activity },
    { to: "members", label: "Members", icon: Users },
  ];

  return (
    <>
      {/* mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200
          lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-slate-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><Zap size={17} /></span>
              PulseBoard
            </div>
            <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden"><X size={18} /></button>
          </div>

          {wsId ? (
            <select
              value={wsId}
              onChange={(e) => { navigate(`/w/${e.target.value}/dashboard`); onClose(); }}
              className="input w-full rounded-xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              {workspaces.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          ) : (
            <p className="text-sm text-slate-500">No workspace yet</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {wsId && nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={`/w/${wsId}/${to}`} className={linkClass} onClick={onClose}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}

          {wsId && (
            <div className="relative pt-5">
              <div className="mb-1 flex items-center justify-between px-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Projects</span>
                <NewProject workspaceId={wsId} onDone={onClose} />
              </div>

              {projects.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">No projects yet. Click + to add one.</p>
              )}

              {projects.map((p) => (
                <NavLink key={p._id} to={`/w/${wsId}/projects/${p._id}`} className={linkClass} onClick={onClose}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}

              {archived.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex w-full items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown size={12} className={showArchived ? "" : "-rotate-90"} />
                    Archived ({archived.length})
                  </button>

                  {showArchived && archived.map((p) => (
                    <div key={p._id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400">
                      <span className="h-2 w-2 shrink-0 rounded-full opacity-50" style={{ background: p.color }} />
                      <span className="flex-1 truncate">{p.name}</span>
                      <button
                        onClick={() => restore.mutate(p._id)}
                        disabled={restore.isPending}
                        title="Restore"
                        className="rounded p-1 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50"
                      >
                        <ArchiveRestore size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <NavLink to="/invitations" className={linkClass} onClick={onClose}>
            <Mail size={18} /> Invitations
            {invitations.length > 0 && (
              <span className="ml-auto rounded-full bg-blue-600 px-2 text-xs font-medium text-white">{invitations.length}</span>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
}