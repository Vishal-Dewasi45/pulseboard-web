import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ListChecks, CheckCircle2, AlertTriangle, Ban, ArrowRight, UserCheck, TrendingUp } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { STATUSES, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from "../lib/constants.js";
import { ACTIVITY_META } from "../lib/ActivityMeta.js";
import { timeAgo } from "../lib/utils.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCurrentWorkspace } from "../hooks/useCurrentWorkspace.js";
import { Skeleton, ListSkeleton } from "../components/Skeleton.jsx";
import Avatar from "../components/Avatars.jsx";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`grid h-12 w-12 place-items-center rounded-xl ${tone}`}><Icon size={22} /></div>
      <div>
        <div className="text-2xl font-semibold leading-none text-slate-900">{value}</div>
        <div className="mt-1.5 text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const Card = ({ title, action, children, className = "" }) => (
  <div className={`card p-5 ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

function RecentActivity({ workspaceId }) {
    const { data = [], isLoading } = useQuery({
      queryKey: ["activity", workspaceId, "recent"],
      queryFn: () =>
        api.get(`/activity/${workspaceId}`, { params: { page: 1, limit: 5 } }).then((r) => r.data.activities),
    });
  
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r: from-blue-50 to-white px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-800">Recent activity</h2>
          <Link to={`/w/${workspaceId}/activity`}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>
  
        {isLoading && <div className="p-4"><ListSkeleton rows={4} /></div>}
        {!isLoading && data.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No activity yet. Create a task to get started.</p>
        )}
  
        <div className="divide-y divide-slate-100">
          {data.map((a) => {
            const meta = ACTIVITY_META[a.action] ?? ACTIVITY_META["task.updated"];
            const Icon = meta.icon;
            return (
              <div key={a._id}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-blue-50/30">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.cls}`}><Icon size={16} /></div>
                <p className="min-w-0 flex-1 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{a.actor?.name ?? "Someone"}</span> {a.message}
                </p>
                {a.project?.name && (
                  <span className="hidden shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 sm:inline">
                    {a.project.name}
                  </span>
                )}
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                <Avatar user={a.actor} size={24} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
export default function Dashboard() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const { current } = useCurrentWorkspace();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", workspaceId],
    queryFn: () => api.get(`/dashboard/${workspaceId}`).then((r) => r.data.dashboard),
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <div className="text-red-600">{getErrorMessage(error)}</div>;

  const { overview, statusBreakdown, priorityBreakdown, projects } = data;

  const statusCounts = Object.fromEntries(statusBreakdown.map((s) => [s.status, s.count]));
  const statusData = STATUSES.map((s) => ({ key: s.key, name: s.label, value: statusCounts[s.key] ?? 0 }));
  const priorityCounts = Object.fromEntries(priorityBreakdown.map((p) => [p.priority, p.count]));
  const priorityData = Object.entries(PRIORITIES).map(([k, p]) => ({ key: k, name: p.label, count: priorityCounts[k] ?? 0 }));

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {greeting()}, {user.name?.split(" ")[0]} 
        </h1>
        <p className="text-sm text-slate-500">Here's what's happening in {current?.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard icon={ListChecks} label="Total tasks" value={overview.totalTasks} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={overview.completedTasks} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overview.overdueTasks} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Ban} label="Blocked" value={overview.blockedTasks} tone="bg-red-50 text-red-600" />
        <StatCard  icon={UserCheck}  label="My Tasks"  value={overview.myTasksCount}  tone="bg-indigo-50 text-indigo-600"/>
<StatCard icon={TrendingUp} label="Productivity"  value={`${overview.productivityScore}%`} tone="bg-cyan-50 text-cyan-600"/>

      </div>

      {overview.totalTasks === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          No tasks yet. Create a project and add some tasks to see your stats here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Tasks by status">
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={2} stroke="none">
                      {statusData.map((s) => <Cell key={s.key} fill={STATUS_COLORS[s.key]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-blue-600">{overview.completionPercentage}%</div>
                    <div className="text-xs text-slate-500">complete</div>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {statusData.map((s) => (
                  <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.key] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Tasks by priority">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                      {priorityData.map((p) => <Cell key={p.key} fill={PRIORITY_COLORS[p.key]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Project progress">
            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p._id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} /> {p.name}
                    </span>
                    <span className="text-slate-500">{p.completedTasks}/{p.totalTasks} · {p.completionPercentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${p.completionPercentage}%` }} />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-slate-400">No active projects.</p>}
            </div>
          </Card>
        </>
      )}

      <RecentActivity workspaceId={workspaceId} />
    </div>
  );
}