import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, LogOut, Menu } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCurrentWorkspace } from "../hooks/useCurrentWorkspace.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useClickOutside } from "../hooks/useClickOutside";
import { STATUSES } from "../lib/constants.js";
import NotificationBell from "./NotificationBell.jsx";

function TaskSearch() {
  const navigate = useNavigate();
  const { current } = useCurrentWorkspace();
  const ref = useRef(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const q = useDebounce(text.trim(), 300);
  useClickOutside(ref, () => setOpen(false));

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["task-search", current?._id, q],
    queryFn: () =>
      api.get(`/workspace/${current._id}/search`, { params: { q, limit: 8 } }).then((r) => r.data.tasks),
    enabled: !!current && q.length >= 2,
  });

  const pick = (t) => {
    setOpen(false);
    setText("");
    navigate(`/w/${current._id}/projects/${t.project?._id ?? t.project}`);
  };

  return (
    <div className="relative flex-1 max-w-md" ref={ref}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search tasks…"
        className="  w-full  rounded-xl  border border-slate-300  bg-slate-50/80  py-2.5 pl-10  pr-4  text-sm  text-slate-700 shadow-sm  transition-all duration-200  placeholder:text-slate-400  hover:border-blue-200 hover:bg-white focus:bg-white  focus:border-blue-400  focus:ring-4  focus:ring-blue-100  focus:outline-none"
      />
      {open && q.length >= 2 && (
        <div className="absolute mt-1 w-full card shadow-lg z-30 overflow-hidden">
          {isFetching && results.length === 0 && <p className="p-3 text-sm text-slate-500">Searching…</p>}
          {!isFetching && results.length === 0 && <p className="p-3 text-sm text-slate-500">No tasks found.</p>}
          {results.map((t) => {
            const st = STATUSES.find((s) => s.key === t.status);
            return (
              <button key={t._id} onClick={() => pick(t)}
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st?.dot}`} />
                <span className="text-sm truncate flex-1">{t.title}</span>
                {t.project?.name && <span className="text-xs text-slate-400 shrink-0">{t.project.name}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Topbar({onMenu}) {
  const { user, logout } = useAuth();
  const ref = useRef(null);
  const [menu, setMenu] = useState(false);
  useClickOutside(ref, () => setMenu(false));

  return (
      <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:gap-4 sm:px-6">
  <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
    <Menu size={20}/>
  </button>
      <TaskSearch />

      <div className="ml-auto flex items-center gap-4">
        <NotificationBell />

        <div className="relative" ref={ref}>
          <button onClick={() => setMenu(!menu)}
            className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold grid place-items-center">
            {user.name?.[0]?.toUpperCase()}
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg p-2 z-30">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
              <button onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded hover:bg-slate-100">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}