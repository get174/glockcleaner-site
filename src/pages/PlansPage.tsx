import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PayPalPayment from '../components/PayPalPayment';
import { supabase } from '../lib/supabase';
import { Check, CreditCard, LogIn, User, Loader2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  desc: string;
  features: string[];
  missing: string[];
  cta: string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'pro-1pc-1y',
    name: 'Professional',
    price: 39.99,
    period: '1 an - 1 PC',
    desc: 'Nettoyage professionnel pour un appareil',
    features: [
      'Nettoyage profond du système',
      'Suppression sécurisée des fichiers',
      'Optimisation du registre',
      'Nettoyage planifié',
      'Protection de la vie privée',
      'Support par email',
    ],
    missing: ['Multi-appareils', 'Support prioritaire 24/7'],
    cta: 'Choisir Professional',
    highlight: false,
  },
  {
    id: 'proplus-3pc-1y',
    name: 'Professional Plus',
    price: 59.99,
    period: '1 an - 3 appareils',
    desc: 'Solution complète pour toute votre famille',
    features: [
      'Tout du plan Professional',
      'Couvre 3 appareils',
      'Suppression sécurisée avancée',
      "Rapports d'optimisation détaillés",
      'Inspection et surveillance système',
      'Récupération de fichiers supprimés',
      'Support prioritaire',
    ],
    missing: [],
    cta: 'Choisir Plus',
    highlight: true,
  },
  {
    id: 'proplus-3pc-2y',
    name: 'Professional Plus',
    price: 79.99,
    period: '2 ans - 3 appareils',
    desc: "La meilleure offre - Économisez 40€",
    features: [
      'Tout du plan 1 an Professional Plus',
      'Durée 2 ans (39.99€/an)',
      'Couvre 3 appareils',
      'Suppression sécurisée avancée',
      "Rapports d'optimisation détaillés",
      'Inspection et surveillance système',
      'Récupération de fichiers supprimés',
      'Support prioritaire 24/7',
    ],
    missing: [],
    cta: 'Meilleure Offre',
    highlight: true,
  },
];

function PlansPage() {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setAuthLoading(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Choisissez votre plan</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Sélectionnez le plan qui correspond à vos besoins et procédez au paiement sécurisé.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  plan.highlight
                    ? 'border-cyan-400 bg-cyan-400/5 shadow-lg shadow-cyan-400/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                } ${selectedPlanId === plan.id ? 'ring-2 ring-cyan-400' : ''}`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-cyan-400 text-slate-950 text-sm font-bold px-4 py-2 rounded-full">
                      Plus populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-1">€{plan.price}</div>
                  <div className="text-slate-400 text-sm">{plan.period}</div>
                </div>

                <p className="text-slate-400 text-center mb-6">{plan.desc}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.missing.map((missing, index) => (
                    <li key={index} className="flex items-center gap-3 opacity-50">
                      <div className="w-5 h-5 border border-slate-600 rounded flex-shrink-0" />
                      <span className="text-sm">{missing}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : 'border border-white/20 hover:border-white/40 hover:bg-white/5'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId(plan.id);
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-12">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold">Paiement</h2>
              </div>

              {authLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <User className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm text-slate-400">Connecté en tant que</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                  </div>
                  <PayPalPayment plan={selectedPlan} user={user} />
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <p className="text-slate-400 text-lg">
                    Vous devez être connecté pour effectuer un achat.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 px-8 rounded-xl transition-all duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlansPage;

