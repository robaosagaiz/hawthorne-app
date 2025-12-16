export interface DailyLog {
    id: string;
    date: string; // ISO string 2025-11-03
    energy: number;
    protein: number;
    carbs: number;
    fats: number;
    weight?: number;
}

export interface UserSettings {
    targetEnergy: number;
    targetProtein: number;
    targetCarbs: number;
    targetFats: number;
    targetWeight?: number;
}

export type UserRole = 'admin' | 'patient';

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    phone: string;
    role: UserRole;
    createdAt?: string;
}
