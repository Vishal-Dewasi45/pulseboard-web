import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Clock, Check, X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { fetchInvitations } from "../lib/queries.js";
import { Skeleton } from "../components/Skeleton.jsx";

const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));

export default function Invitations() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: invitations = [], isLoading } = useQuery({ queryKey: ["invitations"], queryFn: fetchInvitations });

  const respond = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/invitations/${id}/${action}`),
    onSuccess: (_, { action, workspaceId }) => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      if (action === "accept") {
        qc.invalidateQueries({ queryKey: ["workspaces"] });
        navigate(`/w/${workspaceId}/dashboard`);
      }
    },
  });

  const busyId = respond.isPending ? respond.variables?.id : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Invitations</h1>
        <p className="text-sm text-slate-500">Workspaces you've been invited to join.</p>
      </div>

      {respond.error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{getErrorMessage(respond.error)}</div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && invitations.length === 0 && (
        <div className="card p-14 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
            <Mail size={22} />
          </div>
          <p className="font-medium text-slate-800">No pending invitations</p>
          <p className="mt-1 text-sm text-slate-500">When someone invites you to a workspace, it will show up here.</p>
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((inv) => {
          const left = daysLeft(inv.expiresAt);
          const busy = busyId === inv._id;
          return (
            <div key={inv._id} className="card flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white">
                {inv.workspace?.name?.[0]?.toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-slate-900">{inv.workspace?.name}</div>
                <div className="text-sm text-slate-500">
                  Invited by <span className="font-medium text-slate-700">{inv.inviter?.name}</span>
                </div>
                <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  left <= 1 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}>
                  <Clock size={11} /> {left === 0 ? "Expires today" : `${left} day${left === 1 ? "" : "s"} left`}
                </span>
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <button disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: inv._id, action: "accept", workspaceId: inv.workspace._id })}
                  className="btn-primary flex-1 sm:flex-none">
                  <Check size={15} /> {busy && respond.variables?.action === "accept" ? "Joining…" : "Accept"}
                </button>
                <button disabled={respond.isPending}
                  onClick={() => respond.mutate({ id: inv._id, action: "reject" })}
                  className="btn-secondary flex-1 sm:flex-none">
                  <X size={15} /> Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}