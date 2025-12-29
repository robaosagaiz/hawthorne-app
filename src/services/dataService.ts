import { collection, query, getDocs, orderBy, doc, getDoc, setDoc, where, writeBatch, type DocumentSnapshot } from 'firebase/firestore';
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
        // Find if there is any document with this email BUT NOT the current uid
        // (Though initially the current uid doc likely doesn't exist or is empty)
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        let sourceDoc: DocumentSnapshot | null = null;

        querySnapshot.forEach((docSnap) => {
            // Avoid picking the user's own new doc if it somehow already exists
            if (docSnap.id !== uid) {
                sourceDoc = docSnap;
            }
        });

        if (sourceDoc) {
            const sourceData = sourceDoc.data();
            console.log(`Found existing data for ${email} in doc ID: ${sourceDoc.id}. Migrating to ${uid}...`);

            const batch = writeBatch(db);

            // 1. Copy main profile data
            const targetUserRef = doc(db, 'users', uid);
            // We use set with merge to be safe, but typically this is a fresh user.
            // Ensure we update the role or other fields if needed, but primarily we keep the old data.
            // We also make sure 'uid' field in the data matches the new Auth UID.
            batch.set(targetUserRef, {
                ...sourceData,
                uid: uid
            }, { merge: true });

            // 2. Copy Daily Logs
            const sourceLogsRef = collection(db, 'users', sourceDoc.id, 'daily_logs');
            const sourceLogsSnapshot = await getDocs(sourceLogsRef);

            const targetLogsRef = collection(db, 'users', uid, 'daily_logs');

            sourceLogsSnapshot.forEach((logSnap) => {
                const logData = logSnap.data();
                const targetLogDoc = doc(targetLogsRef, logSnap.id); // Keep same ID (date)
                batch.set(targetLogDoc, logData);
            });

            await batch.commit();
            console.log("Migration successful.");
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

