import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import logoImg from '../../assets/logo-128.png';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Nenhuma conta encontrada com esse email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        setError('Erro ao enviar email. Tente novamente.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top section */}
      <div className="relative flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900" />
        <div className="absolute top-[-60px] right-[-40px] w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute bottom-[20px] left-[-50px] w-[160px] h-[160px] rounded-full bg-teal-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center pt-16 pb-20 px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          >
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-emerald-400 to-emerald-600 p-0.5 shadow-lg shadow-emerald-500/30">
              <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center overflow-hidden">
                <img src={logoImg} alt="Hawthorne" className="w-14 h-14 object-contain drop-shadow-md" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            className="text-3xl font-extrabold text-white mt-5 tracking-tight"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Recuperar Senha
          </motion.h1>
          <motion.p
            className="text-emerald-300/70 text-sm mt-1.5 font-medium text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Enviaremos um link para redefinir sua senha
          </motion.p>
        </div>
      </div>

      {/* Form section */}
      <div className="relative flex-1 -mt-6">
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-50 rounded-t-[32px] z-10" />

        <motion.div
          className="relative z-10 px-6 pt-6 pb-10 max-w-md mx-auto w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          {sent ? (
            /* Success state */
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6"
              >
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Email enviado!</h2>
              <p className="text-sm text-slate-500 mb-2">
                Enviamos um link de recuperação para:
              </p>
              <p className="text-sm font-semibold text-emerald-600 mb-6">{email}</p>
              <p className="text-xs text-slate-400 mb-8">
                Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 text-center"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Email da sua conta
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      className="w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-3 text-base text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-emerald-500 font-medium"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Enviar link de recuperação
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
