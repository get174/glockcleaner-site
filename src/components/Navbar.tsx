import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DOWNLOAD_URL } from '../constants';
import type { User } from '@supabase/supabase-js';

const NAV_LINKS = ['Fonctionnalités', 'Télécharger', 'Plans', 'Support'];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-white/10 py-3' : 'py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Glock<span className="text-cyan-400">Cleaner</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200">
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2"
            >
              Connexion
            </Link>
          )}
          <button 
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
            onClick={() => window.open(DOWNLOAD_URL, '_blank')}
          >
            Télécharger
          </button>
        </div>

        <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} className="text-slate-300 hover:text-white text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
              {link}
            </a>
          ))}
          {user ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              className="text-slate-300 hover:text-white text-sm font-medium py-1 text-left"
            >
              Déconnexion
            </button>
          ) : (
            <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
              Connexion
            </Link>
          )}
          <button 
            className="bg-cyan-500 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl w-full mt-2"
            onClick={() => window.open(DOWNLOAD_URL, '_blank')}
          >
            Télécharger gratuitement
          </button>
        </div>
      )}
    </header>
  );
}

