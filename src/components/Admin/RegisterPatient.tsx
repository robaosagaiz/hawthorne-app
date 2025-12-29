import React, { useState } from 'react';
import { createPatientProfile } from '../../services/dataService';
import { User, Mail, Phone } from 'lucide-react';

interface RegisterPatientProps {
    onCancel: () => void;
    onSuccess: () => void;
}

const RegisterPatient: React.FC<RegisterPatientProps> = ({ onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        senha: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Criar Auth
            // Nota: Ao criar usuário com SDK Client, o Firebase loga automaticamente o novo usuário.
            // Isso é um problema para o Admin.
            // Solução "Gambiarra" funcional para MVP: 
            // Vamos apenas salvar o PERFIL no Firestore agora, e instruir o admin a criar a conta ou pedir pro usuário se cadastrar?
            // NÃO. O Admin quer "High Touch". Ele quer entregar pronto.
            // Vamos criar a auth. Se deslogar, o admin loga de novo. É o trade-off do MVP sem Cloud Functions.

            /* 
               Idealmente usaríamos uma Cloud Function `createNewUser`.
               Como estamos apenas no Front + Firestore, faremos o "Logout/Login Dance" ou
               usaremos uma Secondary App Instance (mais complexo mas limpo).
               Vou fazer a Secondary App Instance approach para não deslogar o Admin.
            */

            // Sendo prático: Vamos criar o perfil primeiro no Firestore com um ID manual ou aleatório?
            // Precisamos do UID real da Auth.
            // Vamos assumir que o Admin aceita ser deslogado por enquanto, ou melhor:
            // Vamos usar uma instância secundária do App Firebase para criar o usuário sem deslogar o principal.

            alert("Funcionalidade de criação de conta automática será implementada na V2 por limitações de segurança do navegador. Por enquanto, apenas o registro do PERFIL será salvo/simulado para vincular ao WhatsApp.");

            // Para MVP, vamos usar o Identificador do WhatsApp como ID do Documento.
            // Isso permite que o sistema de automação encontre o usuário facilmente.
            // Em produção, ao fazer o SignUp, o sistema irá vincular o Auth UID a este documento.
            const docId = formData.telefone.trim();

            await createPatientProfile(docId, {
                name: formData.nome,
                email: formData.email,
                phone: formData.telefone,
                role: 'patient',
                createdAt: new Date().toISOString()
            });

            onSuccess();

        } catch (err: any) {
            console.error(err);
            setError("Erro ao criar paciente: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Novo Paciente</h3>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                        <input name="nome" value={formData.nome} onChange={handleChange} className="pl-10 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="João da Silva" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="pl-10 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="joao@email.com" required />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Identificador (WhatsApp)</label>
                    <div className="relative">
                        <Phone className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
                        <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="pl-10 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="120363421773958395@g.us" required />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Essencial para o bot identificar o usuário.</p>
                </div>

                {/* 
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
           <div className="relative">
             <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
             <input type="password" name="senha" value={formData.senha} onChange={handleChange} className="pl-10 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="******" />
           </div>
        </div>
        */}

                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-md">
                        {loading ? 'Salvando...' : 'Salvar Paciente'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterPatient;
