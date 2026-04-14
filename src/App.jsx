import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Contacts from "./pages/Contacts";
import Groups from "./pages/Groups";
import Campaigns from "./pages/Campaigns";
import History from "./pages/History";

function ProtectedRoute({ children }) {
  const { session } = useAuth();
  if (session === undefined) return null; // loading
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { session } = useAuth();
  if (session === undefined) return null; // loading
  if (session) return <Navigate to="/contacts" replace />;
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/contacts" replace />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="groups" element={<Groups />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
