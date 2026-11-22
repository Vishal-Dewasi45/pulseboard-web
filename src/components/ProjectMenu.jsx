import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Archive, Trash2, X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { PROJECT_COLORS } from "../lib/constants.js";
import { useClickOutside } from "../hooks/useClickOutside.js";

export default function ProjectMenu({ project, workspaceId }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ name: project.name, description: project.description ?? "", color: project.color });
  useClickOutside(ref, () => setMenu(false));

  const refresh = () => {
    ["projects", "dashboard", "activity", "my-tasks", "calendar"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] })
    );
  };

  const update = useMutation({
    mutationFn: (body) => api.patch(`/project/update/${project._id}`, body),
    onSuccess: (_, body) => {
      refresh();
      setEditing(false);
      if (body.status === "archived") navigate(`/w/${workspaceId}/dashboard`);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/project/delete/${project._id}`),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["tasks", project._id] });
      refresh();
      navigate(`/w/${workspaceId}/dashboard`);
    },
  });

  const error = update.error || remove.error;
  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50";

  return (
    <>
      <div className="relative" ref={ref}>
        <button onClick={() => setMenu(!menu)} aria-label="Project settings"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
          <MoreHorizontal size={16} />
        </button>
        {menu && (
          <div className="card absolute right-0 z-20 mt-2 w-48 overflow-hidden shadow-lg">
            <button className={`${item} text-slate-700`}
              onClick={() => { setMenu(false); setEditing(true); }}><Pencil size={14} /> Edit project</button>
            <button className={`${item} text-slate-700`}
              onClick={() => { setMenu(false); update.mutate({ status: "archived" }); }}><Archive size={14} /> Archive</button>
            <button className={`${item} text-red-600`}
              onClick={() => { setMenu(false); setConfirmDelete(true); }}><Trash2 size={14} /> Delete</button>
          </div>
        )}
      </div>

      {error && !editing && !confirmDelete && (
        <span className="text-xs text-red-600">{getErrorMessage(error)}</span>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setEditing(false)} />
          <form onSubmit={(e) => { e.preventDefault(); update.mutate(form); }}
            className="card relative w-full max-w-md space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Edit project</h2>
              <button type="button" onClick={() => setEditing(false)} className="rounded p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {error && <div className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{getErrorMessage(error)}</div>}
            <input required minLength={2} maxLength={100} className="input" placeholder="Project name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea rows={3} maxLength={1000} className="input resize-none" placeholder="Description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{ background: c }}
                  className={`h-7 w-7 rounded-full ring-offset-2 transition ${form.color === c ? "ring-2 ring-blue-500" : ""}`} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button disabled={update.isPending || form.name.trim().length < 2} className="btn-primary">
                {update.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setConfirmDelete(false)} />
          <div className="card relative w-full max-w-sm space-y-4 p-6 shadow-xl">
            <h2 className="font-semibold text-slate-900">Delete "{project.name}"?</h2>
            <p className="text-sm text-slate-600">This permanently deletes the project and all its tasks. This can't be undone. You can archive it instead.</p>
            {error && <div className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{getErrorMessage(error)}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => remove.mutate()} disabled={remove.isPending}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {remove.isPending ? "Deleting…" : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}