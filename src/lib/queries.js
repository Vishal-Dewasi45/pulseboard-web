import { api } from "./api.js";

export const fetchWorkspaces = () => api.get("/workspace/get").then((r) => r.data.workspaces);
export const fetchProjects = (wsId) => api.get(`/project/get/${wsId}`).then((r) => r.data.projects);
export const fetchInvitations = () => api.get("/invitations").then((r) => r.data.invitations);
export const fetchUnreadCount = () => api.get("/notifications/unread-count").then((r) => r.data.unreadCount);