import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Tasks from './pages/Tasks'
import ReviewPanel from './pages/ReviewPanel'
import TeamStats from './pages/TeamStats'
import AdminCenter from './pages/AdminCenter'
import MyAccount from './pages/MyAccount'

export default function App() {
  const { session, loading } = useAuth()

  return (
    <Routes>
      {/* Public: Login */}
      <Route
        path="/login"
        element={
          !loading && session ? <Navigate to="/" replace /> : <Login />
        }
      />

      {/* Protected: App layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="review" element={<ReviewPanel />} />
        <Route path="stats" element={<TeamStats />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requireSupervisor>
              <AdminCenter />
            </ProtectedRoute>
          }
        />
        <Route path="account" element={<MyAccount />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
