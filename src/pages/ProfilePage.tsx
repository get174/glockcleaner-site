import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, CreditCard, LogOut, Loader2, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function ProfilePage() {
  const { user, profile, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const { error } = await updateProfile({ full_name: fullName, phone });
    if (error) setMessage(error.message);
    else {
      setMessage('Profil mis à jour avec succès.');
      setEditing(false);
    }
    setSaving(false);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
                  </h1>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>

            {message && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm ${
                  message.includes('succès')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {message}
              </div>
            )}

            <div className="grid gap-6">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <Mail className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">E-mail</p>
                  <p className="text-white text-sm">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Membre depuis</p>
                  <p className="text-white text-sm">{memberSince}</p>
                </div>
              </div>

              {editing ? (
                <>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Nom complet</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold text-sm px-5 py-3 rounded-xl transition-all"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                      }}
                      className="text-slate-400 hover:text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Nom complet</p>
                      <p className="text-white text-sm">{profile?.full_name || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Téléphone</p>
                      <p className="text-white text-sm">{profile?.phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="self-start text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
                  >
                    Modifier le profil
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold">Mes paiements</h2>
            </div>
            <p className="text-slate-400 text-sm">
              Vos paiements et licences apparaîtront ici après un achat.
            </p>
            <Link
              to="/plans"
              className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
            >
              Voir les plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
