import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import Login from "../features/auth/Login";
import CategoryList from "../features/categories/CategoryList";
import ProjectList from "../features/projects/ProjectList";
import ProjectDashboard from "../features/projects/ProjectDashboard";
import ProjectsAll from "../features/projects/ProjectsAll";
import InventoryList from "../features/inventory/InventoryList";

import NavBar from "./NavBar";

export default function App() {
  const { user, loading } = useAuth();

  // Still checking auth session
  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <>
      <NavBar />
      <main className="app-main">
        <Routes>
          {/* PUBLIC ROUTE */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTES */}
          {user ? (
            <>
              <Route path="/" element={<CategoryList />} />
              <Route path="/projects/archived" element={<ProjectsAll />} />
              <Route path="/category/:id" element={<ProjectList />} />
              <Route path="/project/:id" element={<ProjectDashboard />} />
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/timer" element={<div className="container"><div className="panel"><h2>Timer</h2><p>Use the project timer on project pages (visit a project to use it).</p></div></div>} />
            </>
          ) : (
            // If not logged in, redirect everything else to login
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </main>
    </>
  );
}
