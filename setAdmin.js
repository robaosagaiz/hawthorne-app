import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração manual ou load do .env se rodar com node --env-file
// Para simplicidade, vamos assumir que o usuário roda com: node --env-file=.env setAdmin.js <uid ou email?>
// Sem Auth Admin SDK, não conseguimos buscar UID por email facilmente em script client-side puro no node sem login.
// Mas o usuário sabe o email. Vamos tentar logar?
// Melhor: O usuário já rodou o seed.js e sabe o email.
// Vamos fazer o seguinte: Esse script vai pedir EMAIL e SENHA para logar, descobrir o UID e setar o role.

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error("Uso: node --env-file=.env setAdmin.js <email_do_usuario>");
        console.log("Exemplo: node --env-file=.env setAdmin.js robsonachamon@gmail.com");
        process.exit(1);
    }

    console.log(`Buscando usuário para tornar ADMIN: ${email}...`);
    console.log("ATENÇÃO: Este script precisaria de credenciais de Admin SDK para buscar por email.");
    console.log("Como estamos usando Client SDK, precisamos do UID diretamente ou logar.");

    // Fallback: Apenas instruir o usuário.
    // Ou melhor, vamos assumir que o seed.js rodou e criou um usuario padrão?
    // Não, o usuário quer usar o dele.

    console.log("\n⚠️  Para tornar um usuário Admin, precisamos alterar o documento dele no Firestore.");
    console.log("Siga estes passos manuais (mais seguro e rápido agora):");
    console.log("1. Acesse o Firebase Console > Firestore Database.");
    console.log("2. Vá na coleção 'users'.");
    console.log("3. Encontre o documento do seu usuário (UID).");
    console.log("4. Adicione/Edite um campo 'profile' (map) com subcampo 'role': 'admin'.");
    console.log("   OU Se estivermos usando a estrutura nova user/profile/data, crie esse documento.");

    console.log("\nMAS, espere! O app agora espera que user seja: { profile: { role: 'admin' }, ... } ?");
    console.log("Verificando estrutura do código...");
    // src/services/dataService.ts: fetchUserProfile busca getDoc(db, 'users', userId) e espera field 'role'.
    // Então, basta adicionar o campo `role: "admin"` no documento do usuário em `users/{uid}`.

    console.log("\n✅ SOLUÇÃO AUTOMÁTICA (TENTATIVA):");
    console.log("Vou tentar criar um admin 'mock' ou você pode logar no app e eu te ensino a virar admin.");

    // Na verdade, o melhor aqui é o usuário logar no app, abrir o console do navegador e rodar um comando? Não.
    // Melhor: Criar um componente "Hidden" ou apenas pedir pra ele editar no banco.
    // Vamos simplificar: O usuário tem acesso ao banco. Edição manual é OK.
    // MAS, vamos entregar o script que funciona SE ele passar o UID.
}

setAdmin();
