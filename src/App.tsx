import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import Layout from './components/Layout/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="text-teal-600">Carregando...</div></div>;

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <RoleBasedDashboard />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
};

const RoleBasedDashboard = () => {
  const { userProfile } = useAuth();

  if (userProfile?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
