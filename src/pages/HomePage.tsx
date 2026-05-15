import Navbar from '../components/Navbar';
import { DOWNLOAD_URL } from '../constants';
import { useState, useEffect, useRef, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Zap,
  Trash2,
  RefreshCw,
  Lock,
  Monitor,
  ChevronDown,
  Star,
  Check,
  ArrowRight,
  HardDrive,
  Cpu,
  Download,
  ChevronRight,
  Award,
  Users,
  TrendingUp,
} from 'lucide-react';

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let frameId = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration, start]);

  return count;
}

function StatCard({
  value,
  suffix,
  label,
  icon: Icon,
  start,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: ElementType;
  start: boolean;
}) {
  const count = useCountUp(value, 2000, start);
  return (
    <div className="flex flex-col items-center p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300">
      <Icon className="w-8 h-8 text-cyan-400 mb-4" />
      <div className="text-4xl font-bold text-white mb-1">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-slate-400 text-sm text-center">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Trash2,
    title: 'Nettoyage profond',
    desc: "Supprimez les fichiers inutiles, la corbeille, les caches et les résidus d'installation pour libérer des gigaoctets d'espace.",
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: RefreshCw,
    title: 'Registre optimisé',
    desc: 'Réparez et nettoyez le registre Windows pour éliminer les erreurs et accélérer le démarrage du système.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Shield,
    title: 'Protection vie privée',
    desc: "Effacez l'historique de navigation, les cookies et les traces numériques sur plus de 100 applications.",
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Zap,
    title: 'Boost de démarrage',
    desc: "Gérez les programmes au démarrage pour un lancement Windows jusqu'à 3x plus rapide.",
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: HardDrive,
    title: 'Analyse de disque',
    desc: "Visualisez l'utilisation de votre disque et identifiez les fichiers volumineux qui gaspillent de l'espace.",
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
  {
    icon: Lock,
    title: 'Suppression sécurisée',
    desc: 'Effacez définitivement vos fichiers sensibles avec un algorithme militaire, sans possibilité de récupération.',
    color: 'text-teal-400',
    bg: 'bg-teal-400/10',
  },
];

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    desc: 'Pour les utilisateurs occasionnels',
    features: [
      'Nettoyage de base',
      'Analyse du PC',
      'Nettoyage navigateur',
      'Mises à jour manuelles',
    ],
    missing: ['Nettoyage planifié', 'Support prioritaire', 'Suppression sécurisée'],
    cta: 'Télécharger gratuitement',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29,99',
    period: '/ an',
    desc: 'Pour les utilisateurs avancés',
    features: [
      'Tout du plan Gratuit',
      'Nettoyage planifié',
      'Suppression sécurisée',
      'Boost de démarrage',
      'Analyse de disque',
      'Mises à jour automatiques',
    ],
    missing: ['Support prioritaire'],
    cta: "Commencer l'essai",
    highlight: true,
  },
  {
    name: 'Business',
    price: '59,99',
    period: '/ an',
    desc: 'Pour les professionnels et PME',
    features: [
      'Tout du plan Pro',
      'Support prioritaire 24/7',
      'Gestion multi-postes',
      'Tableau de bord centralisé',
      'Rapports détaillés',
      'Déploiement silencieux',
    ],
    missing: [],
    cta: 'Contacter les ventes',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sophie Martin',
    role: 'Graphiste indépendante',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    text: 'Glock Cleaner a libéré 15 Go sur mon PC en quelques minutes. Mon Adobe Photoshop se lance maintenant deux fois plus vite !',
    stars: 5,
  },
  {
    name: 'Thomas Dupont',
    role: 'Développeur web',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    text: "Interface intuitive et résultats impressionnants. Le nettoyage du registre a résolu des bugs que j'avais depuis des mois.",
    stars: 5,
  },
  {
    name: 'Marie Leclerc',
    role: 'Responsable IT',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    text: 'Nous utilisons la version Business sur 50 postes. Le déploiement silencieux et le tableau de bord centralisé sont parfaits.',
    stars: 5,
  },
];

export default function HomePage() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setStatsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );

    if (statsRef.current) observer.observe(statsRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide">
            <Award className="w-3.5 h-3.5" />
            MEILLEURE APPLICATION DE NETTOYAGE 2025
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Votre PC mérite
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300">
              d'être propre
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed">
            Glock Cleaner nettoie, optimise et protège votre ordinateur en quelques secondes.
            Libérez de l'espace, accélérez Windows et sécurisez votre vie privée.
          </p>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Votre PC ralentit ? Vous avez des fichiers inutiles qui prennent de la place ?
            Des traces de navigation qui compromettent votre confidentialité ?
            Glock Cleaner fait tout le travail automatiquement, en toute sécurité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button 
              className="group flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/40 active:scale-95 w-full sm:w-auto"
              onClick={() => window.open(DOWNLOAD_URL, '_blank')}
            >
              <Download className="w-5 h-5" />
              Télécharger gratuitement
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/plans" className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-white/5 w-full sm:w-auto">
              Voir les plans
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Gratuit pour toujours</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Windows 10 & 11</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sans publicité</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 100% sécurisé</span>
          </div>

          {/* App UI mockup */}
          <div className="relative mt-16 mx-auto max-w-4xl">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-1 shadow-2xl shadow-black/50">
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-slate-800/50">
                  <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-4 text-slate-500 text-xs">Glock Cleaner — Analyse en cours</span>
                </div>

                <div className="grid grid-cols-4 min-h-[280px]">
                  <div className="col-span-1 border-r border-white/5 p-4 flex flex-col gap-2">
                    {['Nettoyage', 'Registre', 'Vie privée', 'Outils', 'Paramètres'].map((item, i) => (
                      <div key={item} className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${i === 0 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="col-span-3 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-white font-semibold text-sm mb-1">Analyse terminée</div>
                        <div className="text-slate-400 text-xs">3 472 fichiers inutiles trouvés</div>
                      </div>
                      <div className="bg-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg">
                        Nettoyer maintenant
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Espace récupérable', value: '14,3 Go', color: 'text-cyan-400' },
                        { label: 'Fichiers temp.', value: '2 841', color: 'text-amber-400' },
                        { label: 'Entrées registre', value: '631', color: 'text-rose-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white/5 rounded-lg p-3">
                          <div className={`text-lg font-bold ${color}`}>{value}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>

                    {[
                      { label: 'Cache navigateur', pct: 78, color: 'bg-cyan-500' },
                      { label: 'Fichiers temporaires', pct: 55, color: 'bg-blue-500' },
                      { label: 'Corbeille & téléchargements', pct: 30, color: 'bg-emerald-500' },
                    ].map(({ label, pct, color }) => (
                      <div key={label} className="mb-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>{label}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-500/20 blur-2xl rounded-full" />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 border-y border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-slate-400 text-lg">
              Rejoignez les millions d'utilisateurs qui ont choisi Glock Cleaner
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={25000000} suffix="+" label="Utilisateurs actifs" icon={Users} start={statsVisible} />
            <StatCard value={98} suffix="%" label="Satisfaction client" icon={Star} start={statsVisible} />
            <StatCard value={150} suffix="+" label="Applications nettoyées" icon={Monitor} start={statsVisible} />
            <StatCard value={500} suffix=" To" label="Espace libéré / mois" icon={TrendingUp} start={statsVisible} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalités" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-4 tracking-wide uppercase">
              Fonctionnalités
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tout ce dont votre PC a besoin</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-4">
              Un outil complet pour garder votre ordinateur rapide, propre et sécurisé.
            </p>
            <p className="text-slate-300 text-base max-w-2xl mx-auto">
              De plus en plus lent ? Rempli de fichiers inutiles ? Glock Cleaner résout tous ces problèmes 
              en quelques clics et sans effort. Retrouvez les performances d'un PC neuf.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="group p-6 bg-white/3 border border-white/8 rounded-2xl hover:bg-white/6 hover:border-white/15 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-4 tracking-wide uppercase">
              Simple et rapide
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Nettoyer en 3 étapes</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Pas de configuration compliquée. Glock Cleaner est conçu pour être ultra-simple. 
              Même un enfant pourrait l'utiliser !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Download, title: 'Téléchargez', desc: "Installez Glock Cleaner en moins d'une minute. Gratuit, sans inscription requise, sans publicités.", color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { step: '02', icon: Cpu, title: 'Analysez', desc: 'Un seul clic pour analyser votre PC. Glock Cleaner détecte TOUS les fichiers inutiles et les traces de navigation.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { step: '03', icon: Shield, title: 'Libérez', desc: 'Supprimez tout en toute sécurité et retrouvez une confidentialité totale. Récupérez des gigaoctets en quelques secondes.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            ].map(({ step, icon: Icon, title, desc, color, bg }) => (
              <div key={step} className="group p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className={`w-14 h-14 ${bg} rounded-3xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="text-3xl font-bold mb-2">{step}</div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold px-4 py-2 rounded-full mb-4 uppercase tracking-wide">Plans</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Choisissez le plan qui vous convient</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-4">
              Version gratuite à vie ou premium pour protéger plusieurs appareils.
            </p>
            <p className="text-slate-300 text-base max-w-2xl mx-auto">
              Quelle que soit votre version, bénéficiez de mises à jour gratuites et d'une sécurité maximale. 
              30 jours d'essai gratuit pour les versions payantes - Garantie satisfait ou remboursé !
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`p-8 rounded-3xl border ${plan.highlight ? 'border-cyan-400/30 bg-cyan-500/10 shadow-[0_15px_60px_-30px_rgba(14,165,233,0.55)]' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{plan.name}</div>
                    <div className="mt-3 text-4xl font-bold">{plan.price}<span className="text-xl font-medium">{plan.period}</span></div>
                  </div>
                  {plan.highlight && (
                    <span className="text-xs uppercase tracking-[0.2em] bg-cyan-500/15 text-cyan-300 px-3 py-1 rounded-full">Populaire</span>
                  )}
                </div>
                <p className="text-slate-400 mb-8">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-slate-200">
                      <Check className="w-4 h-4 text-cyan-400" />
                      {feature}
                    </li>
                  ))}
                  {plan.missing.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-slate-500 line-through">
                      <Check className="w-4 h-4 opacity-50" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full rounded-2xl px-6 py-4 font-semibold transition ${plan.highlight ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400' : 'border border-white/10 hover:border-white/20 bg-white/5 text-white'}`}
                  onClick={() => window.open(DOWNLOAD_URL, '_blank')}
                  disabled={plan.cta !== 'Télécharger gratuitement'}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-4 uppercase tracking-wide">Avis clients</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ils ont retrouvé un PC rapide</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              98% de satisfaction client. Rejoignez les milliers d'utilisateurs heureux de leur décision.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, avatar, text, stars }) => (
              <div key={name} className="p-8 rounded-3xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-slate-500">{role}</div>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: stars }, (_, index) => (
                    <Star key={index} className="w-4 h-4" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Votre PC ne sera plus jamais le même
          </h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Avec Glock Cleaner, dites adieu aux ralentissements, aux fichiers inutiles et aux traces d'utilisation. 
            Retrouvez un PC aussi rapide qu'à l'état neuf, complètement sécurisé et privé.
          </p>
          <p className="text-slate-300 text-base mb-12 font-medium">
            Plus de 25 millions d'utilisateurs dans le monde font déjà confiance à Glock Cleaner. 
            Pourquoi pas vous ? C'est gratuit, c'est facile, c'est maintenant.
          </p>
          <button 
            className="group flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-lg px-12 py-5 rounded-3xl transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/40 active:scale-95 mx-auto mb-8"
            onClick={() => window.open(DOWNLOAD_URL, '_blank')}
          >
            <Download className="w-6 h-6" />
            Télécharger Gratuitement Maintenant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-slate-500 text-sm">
            ✓ Aucune inscription requise | ✓ Installation en moins d'une minute | ✓ 100% gratuit et sécurisé
          </p>
        </div>
      </section>
    </div>
  );
}