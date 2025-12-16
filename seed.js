import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

// Configuração lida das variáveis de ambiente
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DADOS DO RELATÓRIO ORIGINAL
const DADOS_MOCK = [
    { date: "2025-11-03", energy: 1630, protein: 165, carbs: 143, fats: 46, weight: 125.0 },
    { date: "2025-11-04", energy: 1596, protein: 141, carbs: 122, fats: 47, weight: 124.8 },
    { date: "2025-11-05", energy: 1921, protein: 156, carbs: 140, fats: 54, weight: 124.9 },
    { date: "2025-11-06", energy: 1680, protein: 161, carbs: 120, fats: 33, weight: 124.7 },
    { date: "2025-11-07", energy: 1750, protein: 161, carbs: 125, fats: 38, weight: 124.6 },
    { date: "2025-11-08", energy: 1580, protein: 169, carbs: 110, fats: 28, weight: 124.5 },
    { date: "2025-11-09", energy: 1860, protein: 178, carbs: 129, fats: 45, weight: 124.4 },
    { date: "2025-11-10", energy: 1760, protein: 177, carbs: 126, fats: 40, weight: 124.3 },
    { date: "2025-11-11", energy: 1770, protein: 179, carbs: 129, fats: 29, weight: 124.3 },
    { date: "2025-11-12", energy: 1399, protein: 135, carbs: 105, fats: 39, weight: 124.2 },
    { date: "2025-11-13", energy: 1306, protein: 151, carbs: 102, fats: 19, weight: 124.1 },
    { date: "2025-11-14", energy: 1510, protein: 168, carbs: 106, fats: 40, weight: 124.0 },
    { date: "2025-11-15", energy: 1547, protein: 159, carbs: 106, fats: 48, weight: 123.9 },
    { date: "2025-11-16", energy: 1854, protein: 168, carbs: 123, fats: 70, weight: 125.0 }
];

async function seedData() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error("Uso: node --env-file=.env seed.js <email> <senha>");
        process.exit(1);
    }

    try {
        console.log(`Tentando logar como ${email}...`);
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login realizado com sucesso!");
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                console.log("Usuário não encontrado. Criando novo usuário...");
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Usuário criado com sucesso!");
            } else {
                throw error;
            }
        }

        const user = userCredential.user;
        console.log(`ID do Usuário: ${user.uid}`);

        // Seed User Profile with ADMIN role (or update existing)
        await setDoc(doc(db, 'users', user.uid), {
            name: email.split('@')[0],
            email: email,
            role: 'admin', // <--- Set as ADMIN
            phone: '+5511999999999',
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log("✅ Perfil de ADMIN atualizado com sucesso!");

        console.log("Iniciando gravação dos dados...");

        // Referência para a coleção de logs do usuário
        // Caminho: users/{uid}/daily_logs
        const logsRef = collection(db, 'users', user.uid, 'daily_logs');

        for (const log of DADOS_MOCK) {
            // Usamos a data como ID do documento para facilitar (evita duplicatas e facilita busca)
            // ex: 2025-11-03
            const docRef = doc(logsRef, log.date);
            await setDoc(docRef, log);
            console.log(`Gravado: ${log.date}`);
        }

        console.log("✅ Dados gravados com sucesso!");
        console.log("Agora você pode rodar o app e fazer login com essas credenciais.");
        process.exit(0);

    } catch (error) {
        console.error("Erro ao rodar seed:", error);
        process.exit(1);
    }
}

seedData();
