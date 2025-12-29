import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

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

// DADOS MOCKADOS
const DADOS_MOCK = [
    { date: "2025-11-03", energy: 1630, protein: 165, carbs: 143, fats: 46, weight: 88.0 },
    { date: "2025-11-04", energy: 1596, protein: 141, carbs: 122, fats: 47, weight: 87.8 },
    { date: "2025-11-05", energy: 1921, protein: 156, carbs: 140, fats: 54, weight: 87.9 },
    // ... gerar mais dados aleatórios
];

async function seedLucas() {
    const email = "lucas@gmail.com";
    const password = "lucas"; // Nota: senha muito fraca, o Firebase pode reclamar (min 6 chars). Vamos usar 'lucas123' se der erro e avisar user.

    console.log(`Criando/Logando usuário teste: ${email}...`);

    let user;
    try {
        // Tenta logar
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log("Usuário logado com senha simples.");
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                console.log("Login falhou. Tentando com senha forte...");
                try {
                    // Tenta senha forte caso tenha sido criado assim antes
                    const retry = await signInWithEmailAndPassword(auth, email, 'lucas123');
                    user = retry.user;
                    console.log("Logado com senha forte.");
                } catch (retryErr) {
                    // Se não logar nem com senha forte, tenta CRIAÇÃO
                    console.log("Usuário não encontrado ou senha errada. Tentando criar...");
                    try {
                        const newUser = await createUserWithEmailAndPassword(auth, email, password);
                        user = newUser.user;
                    } catch (createErr) {
                        if (createErr.code === 'auth/weak-password') {
                            console.log("Senha fraca. Criando com 'lucas123'...");
                            const newUser = await createUserWithEmailAndPassword(auth, email, 'lucas123');
                            user = newUser.user;
                        } else {
                            throw createErr;
                        }
                    }
                }
            } else {
                throw error;
            }
        }

        console.log(`ID do Usuário: ${user.uid}`);

        // Criar Perfil de Paciente com META
        await setDoc(doc(db, 'users', user.uid), {
            name: 'Lucas',
            email: email,
            role: 'patient',
            phone: '+5511988887777', // Exemplo
            createdAt: new Date().toISOString(),
            currentWeight: 88.0,
            targets: {
                energy: 1800,
                protein: 160,
                carbs: 150,
                fats: 60,
                weight: 85.0
            }
        }, { merge: true });

        console.log("Perfil criado/atualizado com metas.");

        // Popular Logs
        const logsRef = collection(db, 'users', user.uid, 'daily_logs');

        // Gerar 10 dias de dados
        const baseDate = new Date();
        for (let i = 0; i < 10; i++) {
            const d = new Date(baseDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            await setDoc(doc(logsRef, dateStr), {
                date: dateStr,
                energy: Math.floor(Math.random() * (2200 - 1500) + 1500),
                protein: Math.floor(Math.random() * (200 - 120) + 120),
                carbs: Math.floor(Math.random() * (250 - 100) + 100),
                fats: Math.floor(Math.random() * (80 - 40) + 40),
                weight: 88 - (i * 0.1)
            });
            console.log(`Log criado para ${dateStr}`);
        }

        console.log("✅ Paciente Lucas (lucas@gmail.com) criado com dados!");
        process.exit(0);
    } catch (e) {
        console.error("Erro fatal:", e.code || e.message);
        console.log("Se o erro for 'auth/email-already-in-use' ou 'auth/wrong-password', por favor delete o usuário no Firebase Console e rode novamente.");
        process.exit(1);
    }
}

seedLucas();
