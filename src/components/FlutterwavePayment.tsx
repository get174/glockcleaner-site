import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlutterwave, closePaymentModal, FLUTTERWAVE_PUBLIC_KEY } from '../lib/flutterwave';
import { supabase } from '../lib/supabase';
import { Loader2, Lock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  desc: string;
}

interface FlutterwavePaymentProps {
  plan: Plan;
  user: User;
}

export default function FlutterwavePayment({ plan, user }: FlutterwavePaymentProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const txRef = `glock-${plan.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const config = {
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: txRef,
    amount: plan.price,
    currency: 'EUR',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email || 'Client GlockCleaner',
      phone_number: user.user_metadata?.phone || '',
    },
    customizations: {
      title: 'GlockCleaner',
      description: `Paiement plan ${plan.name}`,
      logo: '',
    },
  };

  const handleFlutterwavePayment = useFlutterwave(config);

  const initiatePayment = () => {
      if (!FLUTTERWAVE_PUBLIC_KEY) {
        setMessage('Client ID / Clé publique Flutterwave non configurée. Veuillez contacter le support.');
        return;
      }
    setLoading(true);
    setMessage(null);

    handleFlutterwavePayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status === 'successful') {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          if (userId) {
            const { error } = await supabase.from('payments').insert({
              user_id: userId,
              tx_ref: txRef,
              flutterwave_tx_id: String(response.transaction_id || ''),
              plan_name: plan.name,
              amount: plan.price,
              currency: 'EUR',
              status: 'success',
            });
            if (error) {
              console.error('Erreur enregistrement paiement Supabase:', error);
            }
          }

          setMessage('Paiement réussi ! Votre licence est active.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setMessage('Le paiement a échoué ou a été annulé. Veuillez réessayer.');
        }
        setLoading(false);
      },
      onClose: () => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-4 rounded-xl text-sm ${
            message.includes('réussi')
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {message}
        </div>
      )}

      <div className="text-center text-slate-400 text-base mb-2">
        Paiement sécurisé via Flutterwave pour{' '}
        <span className="text-white font-semibold">{plan.name}</span>
      </div>

      <button
        onClick={initiatePayment}
        disabled={loading}
        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold py-4 px-6 rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        Payer €{plan.price} {plan.period}
      </button>

      <div className="flex items-center justify-center gap-2 text-slate-400 text-base">
        <Lock className="w-5 h-5" />
        <span>Transaction cryptée et sécurisée</span>
      </div>
    </div>
  );
}

