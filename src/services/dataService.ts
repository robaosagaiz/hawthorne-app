import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, where, type DocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { DailyLog, UserProfile } from '../types';

export const fetchDailyLogs = async (userId: string): Promise<DailyLog[]> => {
    try {
        const logsRef = collection(db, 'users', userId, 'daily_logs');
        // For simplicity, fetching all and filtering or just fetching last 30 days. 
        // In a real app we'd use range queries.
        const q = query(logsRef, orderBy('date', 'asc'));

        const querySnapshot = await getDocs(q);
        const logs: DailyLog[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                date: data.date,
                energy: data.energy || 0,
                protein: data.protein || 0,
                carbs: data.carbs || 0,
                fats: data.fats || 0,
                weight: data.weight || 0,
            });
        });

        return logs;
    } catch (error) {
        console.error("Error fetching logs:", error);
        return [];
    }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        // 1. Fetch the document for the authenticated user (e.g. users/{authUid})
        let userSnap = await getDoc(doc(db, 'users', userId));
        let userData = userSnap.data();

        // 2. Check for Linked Account Pointer
        if (userSnap.exists() && userData?.linkedAccountId) {
            console.log(`User ${userId} is linked to ${userData.linkedAccountId}. Fetching linked profile...`);
            const linkedSnap = await getDoc(doc(db, 'users', userData.linkedAccountId));
            if (linkedSnap.exists()) {
                // Return linked data, but keep the authUid reference if needed, 
                // OR better: Return the linked data and let the app use the linked values.
                // We must ensure the `uid` in the profile is the LINKED UID so fetchDailyLogs works correctly
                // if we pass profile.uid to it.
                // However, AuthContext provides `userProfile` and Dashboard uses it.
                return { ...linkedSnap.data(), uid: linkedSnap.id, linkedAccountId: userData.linkedAccountId } as UserProfile;
            }
        }

        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

export const fetchAllPatients = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, 'users');
        // Em produção real, você precisaria de um índice composto ou uma coleção separada 'profiles'
        // Aqui vamos buscar todos da coleção users
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);

        const patients: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            // Filtra só quem é paciente (ou exibe todos se for admin ver tudo)
            if (data.role !== 'admin') {
                patients.push({ ...data, uid: doc.id });
            }
        });
        return patients;
    } catch (error) {
        console.error("Error fetching patients:", error);
        return [];
    }
};

export const createPatientProfile = async (uid: string, data: Omit<UserProfile, 'uid'>) => {
    try {
        await setDoc(doc(db, 'users', uid), {
            ...data,
            uid // salva o uid junto por garantia
        }, { merge: true });
    } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
    }
}

/**
 * Links a newly created Auth User to existing data in Firestore if found by email.
 * This copys the data from the 'unlinked' document to the new 'linked' document (uid).
 */
export const linkUserToExistingData = async (uid: string, email: string) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        let sourceDoc: DocumentSnapshot | null = null;

        for (const docSnap of querySnapshot.docs) {
            if (docSnap.id !== uid) {
                sourceDoc = docSnap;
                break; // Found one, break.
            }
        }

        if (sourceDoc) {
            console.log(`Found existing data for ${email} in doc ID: ${sourceDoc.id}. Linking ${uid} -> ${sourceDoc.id}...`);

            // POINTER STRATEGY:
            // Instead of copying data, we just create a "Pointer Document" at users/{uid}
            // that points to users/{sourceDoc.id}.

            await setDoc(doc(db, 'users', uid), {
                email: email,
                role: 'patient', // Default role for access
                linkedAccountId: sourceDoc.id, // THE MAGIC FIELD
                phone: sourceDoc.id, // Keeping phone equal to ID as requested
                createdAt: new Date().toISOString()
            }, { merge: true });

            console.log("Link successful.");
        } else {
            console.log("No existing data found for this email. Creating default profile.");
            // Optional: Create a default empty profile if needed, or let the app handle it.
            // For now, we just ensure the document exists so queries don't fail?
            // actually, if we do nothing, the app might show empty state, which is fine.
            // But let's set at least the email/role.
            await setDoc(doc(db, 'users', uid), {
                email: email,
                role: 'patient', // Default role
                createdAt: new Date().toISOString()
            }, { merge: true });
        }

    } catch (error) {
        console.error("Error linking user data:", error);
        // We don't throw here to avoid blocking login, but maybe we should show a warning?
        // showing error makes sense so the user knows why data is missing.
        throw error;
    }
};
