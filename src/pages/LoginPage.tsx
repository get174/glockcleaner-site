import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Mail,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, signInWithOAuth } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (!agreeTerms) {
        setError("Vous devez accepter les conditions générales d'utilisation.");
        return;
      }
      if (!fullName.trim()) {
        setError('Veuillez indiquer votre nom complet.');
        return;
      }
      // Validate name: only letters, spaces, hyphens, accents
      const sanitizedName = fullName.trim();
      if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(sanitizedName)) {
        setError('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes.');
        return;
      }
      if (sanitizedName.length > 100) {
        setError('Le nom ne peut pas dépasser 100 caractères.');
        return;
      }
      // Validate phone: only digits, +, -, spaces
      if (phone.trim()) {
        const cleanPhone = phone.replace(/[\s\-]/g, '');
        if (!/^\+?[0-9]+$/.test(cleanPhone) || cleanPhone.replace(/\+/g, '').length < 8) {
          setError('Numéro de téléphone invalide.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) throw error;
        navigate('/profile');
      } else {
        // Sanitize inputs to prevent injection
        const sanitizedName = fullName.trim().replace(/[<>'";&]/g, '');
        const sanitizedPhone = phone.trim() ? phone.replace(/[\s\-]/g, '') : undefined;

        const { error, needsEmailConfirmation } = await register(email, password, {
          full_name: sanitizedName,
          phone: sanitizedPhone,
        });
        if (error) throw error;

        if (needsEmailConfirmation) {
          setNeedsConfirmation(true);
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await signInWithOAuth('google');
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la connexion avec Google";
      setError(message);
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Vérifiez votre e-mail</h1>
            <p className="text-slate-400 mb-6">
              Un lien de confirmation a été envoyé à <span className="text-white font-medium">{email}</span>. Cliquez sur le lien pour activer votre compte.
            </p>
            <button
              onClick={() => { setNeedsConfirmation(false); setMode('login'); }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-slate-400">
              {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="Votre nom complet"
                      required
                      maxLength={100}
                      pattern="^[a-zA-ZÀ-ÿ\s\-']+$"
                      title="Lettres, espaces, tirets et apostrophes uniquement"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="+33 6 12 34 56 78"
                      maxLength={20}
                      inputMode="tel"
                      pattern="^\+?[0-9\s\-]+$"
                      title="Que des chiffres, espaces, tirets et signe +"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors"
                  placeholder="votre@email.com"
                  required
                  maxLength={254}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <div className="relative">
                <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'register' && password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthColors[passwordStrength - 1]} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {strengthLabels[passwordStrength - 1]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-cyan-400 bg-white/5 border-white/10 rounded focus:ring-cyan-400 focus:ring-2"
                  required
                />
                <label htmlFor="agreeTerms" className="text-sm text-slate-400">
                  J'accepte les{' '}
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
                    conditions générales d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
                    politique de confidentialité
                  </a>
                </label>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-950 text-slate-400">Ou continuer avec</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full py-3 px-4 bg-white/5 hover:bg-white/10 disabled:bg-white/5 border border-white/10 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              {mode === 'login' ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}