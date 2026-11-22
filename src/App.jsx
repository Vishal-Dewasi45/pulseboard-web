import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes.jsx";
import Applayout from "./components/Applayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import WorkspaceGate from "./pages/WorkspaceGate.jsx";
import Invitations from "./pages/Invitations.jsx";
import ProjectBoard from "./pages/ProjectBoard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import MembersPage from "./pages/MembersPage.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

const Placeholder = ({ title }) => (
  <div className="card p-8">
    <h1 className="text-xl font-semibold">{title}</h1>
    <p className="text-slate-500 text-sm mt-1">Coming in the next step.</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<WorkspaceGate />} />
        <Route element={<Applayout />}>
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/w/:workspaceId">
          <Route path="activity" element={<ActivityPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="projects/:projectId" element={<ProjectBoard/>} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="calendar" element={<CalendarPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}