import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { fetchUserProfile } from '../services/dataService';
import { findPatientByEmail, findPatientByName, patientToUserProfile, checkApiHealth, type Patient } from '../services/apiService';
import type { UserProfile } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    sheetsPatient: Patient | null; // Patient data from Google Sheets
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    userProfile: null,
    loading: true,
    sheetsPatient: null,
    refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [sheetsPatient, setSheetsPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserData = async (user: User) => {
        // 1. Try to fetch from Firestore first
        const firestoreProfile = await fetchUserProfile(user.uid);
        
        // 2. Try to find in Google Sheets by email
        const apiAvailable = await checkApiHealth();
        let sheetPatient: Patient | null = null;
        
        if (apiAvailable && user.email) {
            // Try by email first
            sheetPatient = await findPatientByEmail(user.email);
            
            // If not found by email, try by name (from displayName or Firestore profile)
            if (!sheetPatient) {
                const nameToSearch = user.displayName || firestoreProfile?.name;
                if (nameToSearch) {
                    sheetPatient = await findPatientByName(nameToSearch);
                }
            }
        }

        setSheetsPatient(sheetPatient);

        // 3. Merge profile data - prefer Sheets data for targets if available
        if (sheetPatient) {
            const sheetsProfile = patientToUserProfile(sheetPatient);
            setUserProfile({
                ...firestoreProfile,
                ...sheetsProfile,
                uid: sheetPatient.grupo, // Use grupo as the UID for data fetching
                role: firestoreProfile?.role || 'patient',
            } as UserProfile);
        } else if (firestoreProfile) {
            setUserProfile(firestoreProfile);
        } else {
            // No profile found anywhere - create a minimal one
            setUserProfile({
                uid: user.uid,
                email: user.email || '',
                name: user.displayName || user.email?.split('@')[0] || 'Usuário',
                phone: '',
                role: 'patient',
            });
        }
    };

    const refreshProfile = async () => {
        if (currentUser) {
            await loadUserData(currentUser);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await loadUserData(user);
            } else {
                setUserProfile(null);
                setSheetsPatient(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        loading,
        sheetsPatient,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
