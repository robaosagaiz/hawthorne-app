import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import logoImg from '../../assets/logo-128.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Falha no login. Verifique suas credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top section — Dark gradient with logo */}
      <div className="relative flex-shrink-0 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900" />

        {/* Decorative circles */}
        <div className="absolute top-[-60px] right-[-40px] w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute bottom-[20px] left-[-50px] w-[160px] h-[160px] rounded-full bg-teal-500/10 blur-2xl" />

        {/* Content */}
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
            Hawthorne
          </motion.h1>
          <motion.p
            className="text-emerald-300/70 text-sm mt-1.5 font-medium"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Acompanhamento nutricional inteligente
          </motion.p>
        </div>
      </div>

      {/* Curved transition + Form section */}
      <div className="relative flex-1 -mt-6">
        {/* Curve */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-50 rounded-t-[32px] z-10" />

        {/* Form */}
        <motion.div
          className="relative z-10 px-6 pt-6 pb-10 max-w-md mx-auto w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-xl font-bold text-slate-800 mb-1">Bem-vindo de volta</h2>
          <p className="text-sm text-slate-400 mb-8">Entre com sua conta para continuar</p>

          {/* Error */}
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
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-3 text-base text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-emerald-500 font-medium"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full border-0 border-b-2 border-slate-200 bg-transparent px-0 py-3 pr-10 text-base text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-emerald-500 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Sign up */}
          <p className="text-center text-sm text-slate-500">
            Não tem conta?{' '}
            <Link
              to="/signup"
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Criar conta
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
