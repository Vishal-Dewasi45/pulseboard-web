import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../lib/socket.js";
import { useNavigate } from "react-router-dom";

export function useWorkspaceRealtime(workspaceId) {
  const qc = useQueryClient();

  const navigate=useNavigate();
  // personal notifications
  useEffect(() => {
    const onNotification = () => {
      qc.setQueryData(["unread"], (n = 0) => n + 1);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["invitations"] });
    };
  
    const onRemoved = async ({ workspaceId: removedId, reason }) => {
      await qc.refetchQueries({ queryKey: ["workspaces"] });
      qc.removeQueries({ queryKey: ["members", removedId] });
      if (localStorage.getItem("lastWorkspaceId") === removedId) localStorage.removeItem("lastWorkspaceId");
      if (reason !== "left" && window.location.pathname.includes(removedId)) {
        sessionStorage.setItem(
          "flash",
          reason === "deleted" ? "That workspace was deleted." : "You were removed from that workspace."
        );
        navigate("/", { replace: true });
      }
    };
    const onInviteCancelled = () => qc.invalidateQueries({ queryKey: ["invitations"] });
    const onWorkspaceUpdated = () => qc.invalidateQueries({ queryKey: ["workspaces"] });


    socket.on("workspace:updated", onWorkspaceUpdated); 
    socket.on("invitation:cancelled", onInviteCancelled);
    socket.on("notification:new", onNotification);
    socket.on("workspace:removed", onRemoved);
    return () => {
      socket.off("invitation:cancelled", onInviteCancelled);
      socket.off("notification:new", onNotification);
      socket.off("workspace:removed", onRemoved);
      socket.off("workspace:updated", onWorkspaceUpdated);
    };
  }, [qc, navigate]);

  // workspace room
  useEffect(() => {
    if (!workspaceId) return;

    const refreshDerived = () => {
      ["dashboard", "activity", "my-tasks", "calendar"].forEach((k) =>
        qc.invalidateQueries({ queryKey: [k] })
      );
    };

    const join = () =>
      socket.emit("join-workspace", workspaceId, (res) => {
        if (!res?.success) console.warn("join-workspace failed:", res?.message);
      });

    // upsert by id, so our own events never create duplicates
    const onUpsert = ({ projectId, task }) => {
      qc.setQueryData(["tasks", projectId], (old) => {
        if (!old) return old;
        const i = old.findIndex((t) => t._id === task._id);
        if (i === -1) return [task, ...old];
        const copy = [...old];
        copy[i] = task;
        return copy;
      });
      refreshDerived();
    };

    const onDeleted = ({ projectId, taskId }) => {
      qc.setQueryData(["tasks", projectId], (old) => old?.filter((t) => t._id !== taskId));
      refreshDerived();
    };
    const onMembersChanged = () => {
      qc.invalidateQueries({ queryKey: ["members", workspaceId] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
    };
    const onProject = () => {
      qc.invalidateQueries({ queryKey: ["projects", workspaceId] });
      refreshDerived();
    };
    const onProjectDeleted = ({ projectId }) => {
      onProject();
      qc.removeQueries({ queryKey: ["tasks", projectId] });
      if (window.location.pathname.includes(projectId)) navigate(`/w/${workspaceId}/dashboard`, { replace: true });
    };

    socket.on("project:updated", onProject);
    socket.on("project:deleted", onProjectDeleted);
    socket.on("workspace:members-changed", onMembersChanged);
    socket.on("connect", join);
    socket.on("task:created", onUpsert);
    socket.on("task:updated", onUpsert);
    socket.on("task:deleted", onDeleted);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      socket.off("task:created", onUpsert);
      socket.off("task:updated", onUpsert);
      socket.off("task:deleted", onDeleted);
      socket.emit("leave-workspace", workspaceId);
      socket.off("workspace:members-changed", onMembersChanged);
      socket.off("project:updated", onProject);
      socket.off("project:deleted", onProjectDeleted);
    };
  }, [workspaceId, qc]);
}