import { CalendarDays } from "lucide-react";
import Avatar from "./Avatars.jsx";
import { PRIORITIES } from "../lib/constants.js";
import { formatDue, isOverdue, resolveAssignee } from "../lib/utils.js";

export default function TaskCard({ task, members, onOpen }) {
  const assignee = resolveAssignee(task, members);
  const pr = PRIORITIES[task.priority];
  const overdue = isOverdue(task);

  return (
    <div
  draggable
  onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
  onClick={() => onOpen(task)}
  className="
    bg-white
    border border-blue-100
    rounded-xl
    p-4
    shadow-sm
    hover:shadow-lg
    hover:border-blue-300
    hover:-translate-y-1
    transition-all duration-200
    cursor-pointer
    active:cursor-grabbing
    space-y-3
  "
>
  <div className="text-sm font-semibold text-slate-800 line-clamp-2">
    {task.title}
  </div>

  {task.labels?.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {task.labels.slice(0, 3).map((l) => (
        <span
          key={l}
          className="
            text-[11px]
            px-2 py-1
            rounded-full
            bg-blue-50
            text-blue-700
            border border-blue-100
            font-medium
          "
        >
          {l}
        </span>
      ))}
    </div>
  )}

  <div className="flex items-center justify-between">
    <span
      className={`
        text-[11px]
        px-2.5 py-1
        rounded-full
        font-semibold
        shadow-sm
        ${pr.cls}
      `}
    >
      {pr.label}
    </span>

    <div className="flex items-center gap-3">
      {task.dueDate && (
        <span
          className={`flex items-center gap-1 text-xs ${
            overdue
              ? "text-red-600 font-semibold"
              : "text-slate-600"
          }`}
        >
          <CalendarDays size={13} />
          {formatDue(task.dueDate)}
        </span>
      )}

      <Avatar user={assignee} />
    </div>
  </div>
</div>
  );
}