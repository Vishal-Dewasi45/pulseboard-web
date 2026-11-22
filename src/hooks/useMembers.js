import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export function useMembers(workspaceId) {
  return useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => api.get(`/workspace/${workspaceId}/members`).then((r) => r.data.members),
    enabled: !!workspaceId,
  });
}