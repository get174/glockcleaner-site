import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../lib/supabase';
import { Loader2, Lock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type StripeCreateIntentResponse = {
  clientSecret?: string;
  error?: string;
};

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  desc: string;
}

interface StripePaymentProps {
  plan: Plan;
  user: User;
}

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_CURRENCY = import.meta.env.VITE_STRIPE_CURRENCY || 'EUR';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({
  plan,
  user: _user,
  onSuccess,
}: {
  plan: Plan;
  user: User;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      setLoading(true);
      setMessage(null);

      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/',
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Une erreur est survenue');
        setLoading(false);
        return;
      }

      // Save payment to Supabase
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const txRef = `glock-${plan.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (userId) {
        const { error: insertError } = await supabase.from('payments').insert({
          user_id: userId,
          tx_ref: txRef,
          plan_name: plan.name,
          amount: plan.price,
          currency: STRIPE_CURRENCY,
          status: 'success',
        });

        if (insertError) {
          console.error('Erreur enregistrement paiement Supabase:', insertError);
        }
      }

      setMessage('Paiement réussi ! Votre licence est active.');
      setLoading(false);
      setTimeout(onSuccess, 3000);
    },
    [stripe, elements, plan, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(message || error) && (
        <div
          className={`p-4 rounded-xl text-sm ${
            message
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {message || error}
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-800/50">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          `Payer ${plan.price} ${STRIPE_CURRENCY}`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-slate-400 text-base">
        <Lock className="w-5 h-5" />
        <span>Transaction cryptée et sécurisée</span>
      </div>
    </form>
  );
}

export default function StripePayment({ plan }: StripePaymentProps) {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  const apiBaseUrl = backendUrl ? `${backendUrl.replace(/\/$/, '')}/api` : '/api';

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/stripe/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: plan.price,
            currency: STRIPE_CURRENCY,
            planName: `Plan ${plan.name}`,
          }),
        });

        const data = (await response.json()) as StripeCreateIntentResponse;
        if (!response.ok) {
          throw new Error(data.error || 'Erreur création du paiement');
        }

        if (!data.clientSecret) {
          throw new Error('Réponse backend invalide: clientSecret manquant.');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Impossible deinitialiser le paiement. Veuillez réessayer.');
      }
    };

    if (STRIPE_PUBLISHABLE_KEY) {
      createPaymentIntent();
    } else {
      setError('Clé Stripe manquante. Configurez VITE_STRIPE_PUBLISHABLE_KEY.');
    }
  }, [apiBaseUrl, plan.name, plan.price]);

  const handleSuccess = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="text-center text-slate-400 text-base mb-2">
            Paiement sécurisé via Stripe pour{' '}
            <span className="text-white font-semibold">{plan.name}</span>
          </div>

          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#06b6d4',
                    colorBackground: '#1e293b',
                    colorText: '#e2e8f0',
                  },
                },
              }}
            >
              <CheckoutForm plan={plan} user={{} as User} onSuccess={handleSuccess} />
            </Elements>
          ) : (
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          )}
        </>
      )}
    </div>
  );
}