import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ForgotPassword from './components/Auth/ForgotPassword';
import PatientDashboard from './components/Dashboard/PatientDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import Layout from './components/Layout/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-teal-600 font-medium">Carregando...</div>
        </div>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const RoleBasedDashboard = () => {
  const { userProfile } = useAuth();

  // Admin users see the admin dashboard
  if (userProfile?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Regular users (patients) see their personalized dashboard
  return <PatientDashboard />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
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
