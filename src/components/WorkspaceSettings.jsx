import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, TriangleAlert, CheckCircle2 } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";

export default function WorkspaceSettings({ workspace, isAdmin, isOwner }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(workspace.name);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const rename = useMutation({
    mutationFn: () => api.patch(`/workspace/${workspace._id}`, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const remove = useMutation({
    mutationFn: () =>
      api.delete(`/workspace/${workspace._id}`, { data: { confirmName: confirmText } }),
    onSuccess: async () => {
      localStorage.removeItem("lastWorkspaceId");
      await qc.refetchQueries({ queryKey: ["workspaces"] });
      navigate("/", { replace: true });
    },
  });

  if (!isAdmin) return null;
  const unchanged = name.trim() === workspace.name;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Settings size={16} className="text-blue-600" /> Workspace settings
          </h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); rename.mutate(); }}
          className="flex flex-col gap-2 p-5 sm:flex-row"
        >
          <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60}
            className="input flex-1" placeholder="Workspace name" />
          <button disabled={unchanged || name.trim().length < 2 || rename.isPending} className="btn-primary sm:w-32">
            {rename.isPending ? "Saving…" : "Rename"}
          </button>
        </form>
        {rename.error && <p className="mx-5 mb-5 rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{getErrorMessage(rename.error)}</p>}
        {saved && (
          <p className="mx-5 mb-5 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-700">
            <CheckCircle2 size={15} /> Workspace renamed
          </p>
        )}
      </div>

      {isOwner && (
        <div className="card overflow-hidden border-red-200">
          <div className="border-b border-red-100 bg-red-50/60 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <TriangleAlert size={16} /> Danger zone
            </h2>
          </div>
          <div className="space-y-3 p-5">
            <p className="text-sm text-slate-600">
              Deleting this workspace permanently removes all its projects, tasks, activity and invitations,
              and removes every member. This can't be undone.
            </p>

            {!confirming ? (
              <button onClick={() => setConfirming(true)}
                className="inline-flex items-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Delete workspace
              </button>
            ) : (
              <div className="space-y-3 rounded-xl bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  Type <span className="font-semibold">{workspace.name}</span> to confirm.
                </p>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                  className="input" placeholder={workspace.name} autoFocus />
                {remove.error && <p className="text-sm text-red-600">{getErrorMessage(remove.error)}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => remove.mutate()}
                    disabled={confirmText !== workspace.name || remove.isPending}
                    className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    {remove.isPending ? "Deleting…" : "Delete permanently"}
                  </button>
                  <button onClick={() => { setConfirming(false); setConfirmText(""); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}