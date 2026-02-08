import React from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Target, Scale, Calendar, LogOut, MessageCircle, Pill } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const ProfileView: React.FC = () => {
  const { userProfile, sheetsPatient } = useAuth();
  const handleLogout = () => signOut(auth);

  if (!userProfile) {
    return (
      <div className="text-center p-8 pb-20">
        <p className="text-slate-500 text-sm">Carregando perfil...</p>
      </div>
    );
  }

  const patient = sheetsPatient;
  const firstName = userProfile.name?.split(' ')[0] || 'Paciente';

  return (
    <div className="space-y-4 pb-20">
      {/* Avatar + Name */}
      <motion.div
        className="flex flex-col items-center pt-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg mb-3">
          <span className="text-2xl font-bold text-white">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{userProfile.name}</h2>
        <p className="text-sm text-slate-500">{userProfile.email}</p>
      </motion.div>

      {/* Protocol Info */}
      {patient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Seu Protocolo</h3>
              <div className="grid grid-cols-2 gap-3">
                {patient.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Início</p>
                      <p className="text-sm font-medium text-slate-700">{patient.startDate}</p>
                    </div>
                  </div>
                )}
                {patient.initialWeight > 0 && (
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Peso Inicial</p>
                      <p className="text-sm font-medium text-slate-700">{patient.initialWeight} kg</p>
                    </div>
                  </div>
                )}
                {patient.goal && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Objetivo</p>
                      <p className="text-sm font-medium text-slate-700">{patient.goal}</p>
                    </div>
                  </div>
                )}
                {patient.medication && (
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-500">Medicação</p>
                      <p className="text-sm font-medium text-slate-700">{patient.medication}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Targets */}
      {patient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="py-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Suas Metas Diárias</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-orange-600 tabular-nums">{patient.targets.energy}</p>
                  <p className="text-[10px] text-orange-700 mt-0.5">kcal/dia</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-red-600 tabular-nums">{patient.targets.protein}g</p>
                  <p className="text-[10px] text-red-700 mt-0.5">Proteína</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-amber-600 tabular-nums">{patient.targets.carbs}g</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Carboidratos</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-600 tabular-nums">{patient.targets.fats}g</p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Gorduras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <a
          href="https://wa.me/5527997451426"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <div className="p-2 bg-green-50 rounded-xl">
            <MessageCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Falar com a Clínica</p>
            <p className="text-xs text-slate-400">WhatsApp Dr. Chamon</p>
          </div>
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:bg-red-50 transition-colors"
        >
          <div className="p-2 bg-red-50 rounded-xl">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-red-600">Sair</p>
            <p className="text-xs text-slate-400">Encerrar sessão</p>
          </div>
        </button>
      </motion.div>
    </div>
  );
};

export default ProfileView;
