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
        const userCredential = await signInWithEmailAndPassword(auth, email, password).catch(async (err) => {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                console.log("Usuário não existe. Criando...");
                return await createUserWithEmailAndPassword(auth, email, password);
            }
            throw err;
        });
        user = userCredential.user;
        console.log("Usuário autenticado:", user.uid);
    } catch (e) {
        console.error("Erro na auth:", e.message);
        if (e.code === 'auth/weak-password') {
            console.log("Tentando com senha mais forte 'lucas123'...");
            // Logica recursiva simplificada
            const userCredential = await createUserWithEmailAndPassword(auth, email, 'lucas123');
            user = userCredential.user;
        } else {
            process.exit(1);
        }
    }

    // Criar Perfil de Paciente
    await setDoc(doc(db, 'users', user.uid), {
        name: 'Lucas',
        email: email,
        role: 'patient',
        phone: '+5511988887777', // Exemplo
        createdAt: new Date().toISOString()
    }, { merge: true });

    console.log("Perfil criado/atualizado.");

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
}

seedLucas();
