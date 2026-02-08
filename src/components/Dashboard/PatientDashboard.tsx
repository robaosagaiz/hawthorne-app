/**
 * Patient Dashboard v2.0 — Bottom nav navigation
 * Uses BottomNav for mobile-first experience
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import BottomNav, { type PatientTab } from './BottomNav';
import TodayView from './TodayView';
import ProgressView from './ProgressView';
import ActivitySection from './ActivitySection';
import ProfileView from './ProfileView';

const PatientDashboard: React.FC = () => {
  const { userProfile, sheetsPatient } = useAuth();
  const [activeTab, setActiveTab] = React.useState<PatientTab>('today');

  const patientId = sheetsPatient?.grupo || userProfile?.uid;

  if (!userProfile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Carregando perfil...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'today':
        return <TodayView userId={patientId} />;
      case 'progress':
        return <ProgressView userId={patientId} />;
      case 'activities':
        return patientId ? <ActivitySection grupoId={patientId} /> : null;
      case 'profile':
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 pt-4">
        {renderView()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default PatientDashboard;
