import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, CalendarDays, Tag, AlignLeft, Flag, CircleDot, User } from "lucide-react";
import { api, getErrorMessage } from "../lib/api.js";
import { STATUSES, PRIORITIES } from "../lib/constants.js";
import { assigneeId, addDaysKey, todayKey, timeAgo } from "../lib/utils.js";
import Avatar from "./Avatars.jsx";

const MAX_LABEL = 40;

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon size={13} /> {label}
      </label>
      {children}
    </div>
  );
}

export default function TaskPanel({ task, defaultStatus, projectId, members = [], onClose }) {
  const qc = useQueryClient();
  const isEdit = !!task;

  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? defaultStatus ?? "todo",
    priority: task?.priority ?? "medium",
    assignee: assigneeId(task),
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  }));
  const [labels, setLabels] = useState(task?.labels ?? []);
  const [labelInput, setLabelInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const onText = (k) => (e) => set(k)(e.target.value);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ----- labels -----
  const addLabel = (raw) => {
    const value = raw.trim().slice(0, MAX_LABEL);
    if (!value) return;
    setLabels((prev) => (prev.some((l) => l.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]));
    setLabelInput("");
  };
  const onLabelKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addLabel(labelInput);
    } else if (e.key === "Backspace" && !labelInput && labels.length) {
      setLabels((prev) => prev.slice(0, -1));
    }
  };

  // ----- due date quick picks -----
  const today = todayKey();
  const quick = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: addDaysKey(today, 1) },
    { label: "Next week", value: addDaysKey(today, 7) },
  ];

  const refreshDerived = () =>
    ["dashboard", "activity", "my-tasks", "calendar"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] })
    );

  const save = useMutation({
    mutationFn: () => {
      const finalLabels = labelInput.trim()
        ? [...labels, labelInput.trim().slice(0, MAX_LABEL)]
        : labels;
      const body = {
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
        labels: [...new Set(finalLabels)],
      };
      return isEdit
        ? api.patch(`/task/update/${task._id}`, body)
        : api.post(`/task/create/${projectId}`, body);
    },
    onSuccess: (res) => {
      const saved = res.data.task;
      qc.setQueryData(["tasks", projectId], (old) => {
        if (!old) return old;
        return old.some((t) => t._id === saved._id)
          ? old.map((t) => (t._id === saved._id ? saved : t))
          : [saved, ...old];
      });
      refreshDerived();
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/task/delete/${task._id}`),
    onSuccess: () => {
      qc.setQueryData(["tasks", projectId], (old) => old?.filter((t) => t._id !== task._id));
      refreshDerived();
      onClose();
    },
  });

  const error = save.error || remove.error;
  const selectedMember = members.find((m) => m.user._id === form.assignee)?.user;
  const canSave = form.title.trim().length >= 2 && !save.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />

      <form
        onSubmit={(e) => { e.preventDefault(); if (canSave) save.mutate(); }}
        className="relative flex h-dvh w-full animate-slide-in flex-col bg-white shadow-2xl sm:max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r: from-blue-50 to-white px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEdit ? "Task details" : "New task"}</h2>
            {isEdit && task.createdAt && (
              <p className="text-xs text-slate-500">Created {timeAgo(task.createdAt)}</p>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              {getErrorMessage(error)}
            </div>
          )}

          <input
            autoFocus
            required
            minLength={2}
            maxLength={150}
            value={form.title}
            onChange={onText("title")}
            placeholder="Task title"
            className="w-full rounded-lg border border-transparent bg-slate-50 px-3 py-2.5 text-lg font-semibold text-slate-900
                       placeholder:font-normal placeholder:text-slate-400 transition hover:border-slate-200
                       focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
          />

          {/* Status */}
          <Field icon={CircleDot} label="Status">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => {
                const active = form.status === s.key;
                return (
                  <button type="button" key={s.key} onClick={() => set("status")(s.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Priority */}
          <Field icon={Flag} label="Priority">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(PRIORITIES).map(([k, p]) => {
                const active = form.priority === k;
                return (
                  <button type="button" key={k} onClick={() => set("priority")(k)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      active
                        ? `${p.cls} border-current ring-2 ring-current/20`
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Assignee + due date */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={User} label="Assignee">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                  {selectedMember ? (
                    <Avatar user={selectedMember} size={22} />
                  ) : (
                    <span className="grid h-22px w-22px place-items-center rounded-full bg-slate-100 text-slate-400">
                      <User size={12} />
                    </span>
                  )}
                </span>
                <select value={form.assignee} onChange={onText("assignee")} className="input pl-10">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </Field>

            <Field icon={CalendarDays} label="Due date">
              <input type="date" value={form.dueDate} onChange={onText("dueDate")} className="input" />
            </Field>
          </div>

          <div className="-mt-3 flex flex-wrap gap-1.5">
            {quick.map((q) => (
              <button type="button" key={q.label} onClick={() => set("dueDate")(q.value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  form.dueDate === q.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {q.label}
              </button>
            ))}
            {form.dueDate && (
              <button type="button" onClick={() => set("dueDate")("")}
                className="rounded-full px-2.5 py-1 text-xs text-slate-500 hover:text-red-600">
                Clear
              </button>
            )}
          </div>

          {/* Description */}
          <Field icon={AlignLeft} label="Description">
            <textarea
              rows={5}
              maxLength={3000}
              value={form.description}
              onChange={onText("description")}
              placeholder="Add more detail about this task…"
              className="input resize-none"
            />
            <div className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/3000</div>
          </Field>

          {/* Labels */}
          <Field icon={Tag} label="Labels">
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 transition
                            focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              {labels.map((l) => (
                <span key={l} className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {l}
                  <button type="button" onClick={() => setLabels((prev) => prev.filter((x) => x !== l))}
                    className="rounded text-blue-400 hover:text-blue-700">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={onLabelKey}
                onBlur={() => addLabel(labelInput)}
                maxLength={MAX_LABEL}
                placeholder={labels.length ? "Add another…" : "Type a label and press Enter"}
                className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-5 py-4">
          {isEdit &&
            (confirmDelete ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5">
                <span className="text-xs font-medium text-red-700">Delete task?</span>
                <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {remove.isPending ? "…" : "Yes"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-600 hover:underline">
                  No
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} title="Delete task"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                <Trash2 size={18} />
              </button>
            ))}

          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button disabled={!canSave} className="btn-primary min-w-28">
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}