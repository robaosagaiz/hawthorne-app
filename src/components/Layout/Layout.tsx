import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { LogOut, Activity, User as UserIcon, Calendar } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, userProfile } = useAuth();

    const handleLogout = () => signOut(auth);

    const currentDate = new Date().toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-teal-600 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-teal-500 rounded-lg">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">Relatório Nutricional</h1>
                            <p className="text-teal-100 text-xs font-medium">Protocolo Hawthorne</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <div className="text-teal-200 text-xs">Hoje</div>
                            <div className="font-semibold flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {currentDate}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-teal-500">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">
                                    {userProfile?.name || currentUser?.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-teal-200 uppercase tracking-wider font-bold">
                                    {userProfile?.role === 'admin' ? 'Admin' : 'Paciente'}
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-teal-800 rounded-full flex items-center justify-center border-2 border-teal-400">
                                <UserIcon className="w-5 h-5 text-teal-200" />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-teal-700 rounded-full transition-colors ml-2"
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    <p>© {new Date().getFullYear()} Protocolo Hawthorne. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
