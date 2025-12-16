import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="text-teal-600">Carregando...</div></div>;

    // Check if user is logged in AND is admin
    if (!currentUser || userProfile?.role !== 'admin') {
        return <Navigate to="/" />; // Redirect non-admins to their dashboard
    }

    return <>{children}</>;
};

export default AdminRoute;
