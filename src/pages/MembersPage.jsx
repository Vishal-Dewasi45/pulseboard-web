import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, UserPlus, Search, Users, CheckCircle2, Trash2, LogOut, Crown, Clock, X } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMembers } from "../hooks/useMembers.js";
import { useCurrentWorkspace } from "../hooks/useCurrentWorkspace.js";
import { useDebounce } from "../hooks/useDebounce.js";
import Avatar from "../components/Avatars.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import WorkspaceSettings from "../components/WorkspaceSettings.jsx";

export default function MembersPage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { current } = useCurrentWorkspace();
  const { data: members = [], isLoading } = useMembers(workspaceId);

  const ownerId = current?.owner;
  const myRole = members.find((m) => m.user._id === user._id)?.role;
  const isAdmin = myRole === "admin";
  const iAmOwner = ownerId === user._id;
  const adminCount = members.filter((m) => m.role === "admin").length;

  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [confirmId, setConfirmId] = useState(null); // member being removed
  const [confirmLeave, setConfirmLeave] = useState(false);
  const q = useDebounce(email.trim(), 300);

  const refreshMembers = () => {
    qc.invalidateQueries({ queryKey: ["members", workspaceId] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const { data: suggestions = [] } = useQuery({
    queryKey: ["member-search", workspaceId, q],
    queryFn: () =>
      api.get(`/invitations/${workspaceId}/search-members`, { params: { q } }).then((r) => r.data.users),
    enabled: isAdmin && q.length >= 2 && !picked,
  });

  const { data: pending = [] } = useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: () => api.get(`/workspace/${workspaceId}/invitations`).then((r) => r.data.invitations),
    enabled: isAdmin,
  });

  const invite = useMutation({
    mutationFn: () => api.post(`/workspace/${workspaceId}/invitations`, { email: email.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
      setNotice(`Invitation sent to ${email.trim()}`);
      setEmail("");
      setPicked(false);
    },
    onError: () => setNotice(""),
  });

  const changeRole = useMutation({
    mutationFn: ({ memberId, role }) =>
      api.patch(`/workspace/${workspaceId}/members/${memberId}/role`, { role }),
    onSuccess: refreshMembers,
  });

  const cancel = useMutation({
    mutationFn: (id) => api.patch(`/invitations/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] }),
  });

  const remove = useMutation({
    mutationFn: (memberId) => api.delete(`/workspace/${workspaceId}/members/${memberId}`),
    onSuccess: () => { setConfirmId(null); refreshMembers(); },
  });

  const leave = useMutation({
    mutationFn: () => api.post(`/workspace/${workspaceId}/leave`),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["workspaces"] });
      localStorage.removeItem("lastWorkspaceId");
      navigate("/", { replace: true });
    },
  });

  const actionError = changeRole.error || remove.error || leave.error || cancel.error;

  const visible = members.filter((m) => {
    const t = filter.trim().toLowerCase();
    return !t || m.user.name.toLowerCase().includes(t) || m.user.email.toLowerCase().includes(t);
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500">Manage who has access to this workspace.</p>
        </div>

        {!iAmOwner && myRole &&
          (confirmLeave ? (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
              <span className="text-xs font-medium text-red-700">Leave this workspace?</span>
              <button onClick={() => leave.mutate()} disabled={leave.isPending}
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {leave.isPending ? "…" : "Yes, leave"}
              </button>
              <button onClick={() => setConfirmLeave(false)} className="text-xs text-slate-600 hover:underline">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmLeave(true)} className="btn-secondary !text-red-600 hover:!bg-red-50">
              <LogOut size={15} /> Leave workspace
            </button>
          ))}
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{getErrorMessage(actionError)}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Users size={18} /></div>
          <div>
            <div className="text-xl font-semibold leading-none">{members.length}</div>
            <div className="mt-1 text-xs text-slate-500">Members</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 px-4 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Shield size={18} /></div>
          <div>
            <div className="text-xl font-semibold leading-none">{adminCount}</div>
            <div className="mt-1 text-xs text-slate-500">Admins</div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserPlus size={16} className="text-blue-600" /> Invite a teammate
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">They must already have a PulseBoard account.</p>
          </div>
          <div className="p-5">
            <form onSubmit={(e) => { e.preventDefault(); setNotice(""); invite.mutate(); }}
              className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <input value={email}
                  onChange={(e) => { setEmail(e.target.value); setPicked(false); setNotice(""); }}
                  placeholder="Search by name or enter their email" className="input" />
                {!picked && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((u) => (
                      <button type="button" key={u._id}
                        onClick={() => { setEmail(u.email); setPicked(true); }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-blue-50/50">
                        <Avatar user={u} size={28} />
                        <span className="text-sm font-medium text-slate-800">{u.name}</span>
                        <span className="truncate text-xs text-slate-500">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button disabled={!email.includes("@") || invite.isPending} className="btn-primary sm:w-32">
                {invite.isPending ? "Sending…" : "Send invite"}
              </button>
            </form>
            {invite.error && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{getErrorMessage(invite.error)}</p>}
            {notice && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-700">
                <CheckCircle2 size={15} /> {notice}
              </p>
            )}
          </div>
        </div>
      )}

      {isAdmin && pending.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-800">Pending invitations</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">{pending.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pending.map((inv) => {
              const left = Math.max(0, Math.ceil((new Date(inv.expiresAt) - Date.now()) / 86400000));
              return (
                <div key={inv._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Avatar user={inv.invitee} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{inv.invitee?.name}</div>
                    <div className="truncate text-xs text-slate-500">{inv.invitee?.email}</div>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    left <= 1 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Clock size={11} /> {left === 0 ? "Expires today" : `${left}d left`}
                  </span>
                  <button
                    onClick={() => cancel.mutate(inv._id)}
                    disabled={cancel.isPending && cancel.variables === inv._id}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-800">All members</h2>
          <div className="relative ml-auto w-full max-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter members"
              className="input !py-1.5 pl-8" />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No members match "{filter}".</p>
        )}

        <div className="divide-y divide-slate-100">
          {visible.map((m) => {
            const id = m.user._id;
            const isOwner = id === ownerId;
            const isMe = id === user._id;
            const canManage = isAdmin && !isOwner && !isMe;
            return (
              <div key={id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-blue-50/20">
                <Avatar user={m.user} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span className="truncate">{m.user.name}</span>
                    {isMe && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-blue-600">You</span>}
                  </div>
                  <div className="truncate text-xs text-slate-500">{m.user.email}</div>
                </div>

                {m.joined_at && (
                  <span className="hidden text-xs text-slate-400 md:inline">
                    Joined {new Date(m.joined_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                )}

                {isOwner ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Crown size={12} /> Owner
                  </span>
                ) : canManage ? (
                  <select value={m.role} disabled={changeRole.isPending}
                    onChange={(e) => changeRole.mutate({ memberId: id, role: e.target.value })}
                    className="input !w-auto !py-1 text-xs capitalize">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                    m.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {m.role === "admin" && <Shield size={12} />} {m.role}
                  </span>
                )}

                {canManage &&
                  (confirmId === id ? (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1">
                      <span className="text-xs font-medium text-red-700">Remove?</span>
                      <button onClick={() => remove.mutate(id)} disabled={remove.isPending}
                        className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                        {remove.isPending ? "…" : "Yes"}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-xs text-slate-600 hover:underline">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(id)} title="Remove member"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {current && (
        <WorkspaceSettings
          key={current._id + current.name}
          workspace={current}
          isAdmin={isAdmin}
          isOwner={iAmOwner}
        />
      )}
    </div>
  );
}