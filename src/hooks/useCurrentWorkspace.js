import { useParams } from "react-router-dom";
import { fetchWorkspaces } from "../lib/queries.js";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useCurrentWorkspace () {
    const { workspaceId } = useParams();
    const { data: workspaces = [], isLoading } = useQuery({
      queryKey: ["workspaces"],
      queryFn: fetchWorkspaces,
    });
    const id = workspaceId || localStorage.getItem("lastWorkspaceId");
  const current = workspaces.find((w) => w._id === id) || workspaces[0] || null;

  useEffect(() => {
    if (current) localStorage.setItem("lastWorkspaceId", current._id);
  }, [current]);

  return { workspaces, current, isLoading };
}