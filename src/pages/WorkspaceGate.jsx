import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../lib/api.js";
import { useCurrentWorkspace } from "../hooks/useCurrentWorkspace.js";

export default function WorkspaceGate() {
  const qc = useQueryClient();
  const { current, isLoading } = useCurrentWorkspace();
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api.post("/workspace/create", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading…</div>;
  if (current) return <Navigate to={`/w/${current._id}/dashboard`} replace />;

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        className="w-full max-w-md bg-white rounded-xl shadow p-8 space-y-4"
      >
        <h1 className="text-2xl font-bold text-blue-600">Welcome to PulseBoard</h1>
        <p className="text-slate-500 text-sm">Create your first workspace to get started.</p>
        {create.error && <div className="text-sm text-red-600 bg-red-50 rounded p-2">{getErrorMessage(create.error)}</div>}
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name"
          className="w-full border rounded-lg px-3 py-2"
        />
        <button disabled={name.trim().length < 2 || create.isPending}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-60">
          {create.isPending ? "Creating…" : "Create workspace"}
        </button>
        <p className="text-sm text-slate-500 text-center">
          Were you invited? <Link to="/invitations" className="text-blue-600 hover:underline">Check invitations</Link>
        </p>
      </form>
    </div>
  );
}