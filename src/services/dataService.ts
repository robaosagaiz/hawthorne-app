import { collection, query, getDocs, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
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
        // Nota: Ajuste na estrutura. No seed.js gravamos em users/{uid}/daily_logs.
        // O perfil pode ficar em users/{uid} (documento raiz) ou numa subcoleção.
        // Vamos padronizar: O documento do usuário em 'users' contém o perfil.
        const userSnap = await getDoc(doc(db, 'users', userId));

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

