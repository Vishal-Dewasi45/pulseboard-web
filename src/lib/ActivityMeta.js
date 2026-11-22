import { FolderKanban, Plus, Pencil, ArrowRightLeft, UserPlus, Trash2 } from "lucide-react";

export const ACTIVITY_META = {
  "project.created": { icon: FolderKanban, cls: "bg-blue-50 text-blue-600" },
  "task.created": { icon: Plus, cls: "bg-emerald-50 text-emerald-600" },
  "task.updated": { icon: Pencil, cls: "bg-slate-100 text-slate-600" },
  "task.status_changed": { icon: ArrowRightLeft, cls: "bg-amber-50 text-amber-600" },
  "task.assigned": { icon: UserPlus, cls: "bg-indigo-50 text-indigo-600" },
  "task.deleted": { icon: Trash2, cls: "bg-red-50 text-red-600" },
};