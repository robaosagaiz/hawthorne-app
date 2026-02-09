/**
 * Patient Dashboard v2.0 — Bottom nav navigation + Onboarding
 * Uses BottomNav for mobile-first experience
 * Shows OnboardingScreen on first visit, then GuidedTour
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import BottomNav, { type PatientTab } from './BottomNav';
import TodayView from './TodayView';
import ProgressView from './ProgressView';
import ActivitySection from './ActivitySection';
import ProfileView from './ProfileView';
import OnboardingScreen from '../Onboarding/OnboardingScreen';
import GuidedTour from '../Onboarding/GuidedTour';

const ONBOARDING_KEY = 'hawthorne_onboarding_done';
const TOUR_KEY = 'hawthorne_tour_done';

const PatientDashboard: React.FC = () => {
  const { userProfile, sheetsPatient } = useAuth();
  const [activeTab, setActiveTab] = React.useState<PatientTab>('today');

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const patientId = sheetsPatient?.grupo || userProfile?.uid;
  const patientName = sheetsPatient?.name?.split(' ')[0] || userProfile?.name?.split(' ')[0];

  useEffect(() => {
    // ?reset-tour in URL clears onboarding state for testing
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset-tour')) {
      localStorage.removeItem(ONBOARDING_KEY);
      localStorage.removeItem(TOUR_KEY);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check if user has completed onboarding
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
    if (!onboardingDone) {
      setShowOnboarding(true);
    } else {
      // Check if tour is done
      const tourDone = localStorage.getItem(TOUR_KEY);
      if (!tourDone) {
        // Small delay so TodayView renders first
        setTimeout(() => setShowTour(true), 800);
      }
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, new Date().toISOString());
    setShowOnboarding(false);
    // Start tour after a delay so the main UI renders
    setTimeout(() => setShowTour(true), 800);
  };

  const handleTourComplete = () => {
    localStorage.setItem(TOUR_KEY, new Date().toISOString());
    setShowTour(false);
  };

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
        return patientId ? <ActivitySection grupoId={patientId} protocolStartDate={sheetsPatient?.startDate} /> : null;
      case 'profile':
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Onboarding slides — full screen overlay */}
      {showOnboarding && (
        <OnboardingScreen
          patientName={patientName}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Guided tour — spotlight overlay */}
      {showTour && !showOnboarding && (
        <GuidedTour onComplete={handleTourComplete} />
      )}

      <div className="max-w-lg mx-auto px-4 pt-4">
        {renderView()}
      </div>
      {!showOnboarding && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default PatientDashboard;
