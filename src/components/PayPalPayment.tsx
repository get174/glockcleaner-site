import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Lock } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

declare global {
  interface Window {
    paypal?: any;
  }
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  desc: string;
}

interface PaypalPaymentProps {
  plan: Plan;
  user: User;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const PAYPAL_CURRENCY = import.meta.env.VITE_PAYPAL_CURRENCY || 'EUR';

export default function PayPalPayment({ plan, user }: PaypalPaymentProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const buttonContainer = useRef<HTMLDivElement | null>(null);
  const txRef = `glock-${plan.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setErrorLoading('Client PayPal manquant. Configurez VITE_PAYPAL_CLIENT_ID.');
      return;
    }

    if (window.paypal) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}`;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      setErrorLoading('Impossible de charger le SDK PayPal. Vérifiez votre connexion et le client ID.');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.paypal || !buttonContainer.current) {
      return;
    }

    setMessage(null);

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay',
      },
      createOrder: (_data: any, actions: any) => {
        setLoading(true);
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: plan.price.toFixed(2),
                currency_code: PAYPAL_CURRENCY,
              },
              description: `Plan ${plan.name}`,
            },
          ],
          application_context: {
            shipping_preference: 'NO_SHIPPING',
          },
        });
      },
      onApprove: async (_data: any, actions: any) => {
        try {
          const order = await actions.order.capture();
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          if (userId) {
            const { error } = await supabase.from('payments').insert({
              user_id: userId,
              tx_ref: txRef,
              plan_name: plan.name,
              amount: plan.price,
              currency: PAYPAL_CURRENCY,
              status: 'success',
            });

            if (error) {
              console.error('Erreur enregistrement paiement Supabase:', error);
            }
          }

          setMessage('Paiement réussi ! Votre licence est active.');
          setTimeout(() => navigate('/'), 3000);
        } catch (error) {
          console.error('Erreur capture PayPal :', error);
          setMessage('Erreur lors de la finalisation du paiement.');
        } finally {
          setLoading(false);
        }
      },
      onError: (err: any) => {
        console.error('Erreur PayPal :', err);
        setMessage('Le paiement PayPal a échoué. Veuillez réessayer.');
        setLoading(false);
      },
      onCancel: () => {
        setMessage('Paiement annulé.');
        setLoading(false);
      },
    });

    if (buttons.isEligible()) {
      buttons.render(buttonContainer.current);
    } else {
      setErrorLoading('Le bouton PayPal n’est pas disponible dans votre navigateur.');
    }

    return () => {
      if (buttonContainer.current) {
        buttonContainer.current.innerHTML = '';
      }
    };
  }, [scriptReady, plan, user, navigate]);

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

      {errorLoading ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorLoading}
        </div>
      ) : (
        <>
          <div className="text-center text-slate-400 text-base mb-2">
            Paiement sécurisé via PayPal pour{' '}
            <span className="text-white font-semibold">{plan.name}</span>
          </div>

          <div ref={buttonContainer} />

          {loading && (
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-400 text-base">
            <Lock className="w-5 h-5" />
            <span>Transaction cryptée et sécurisée</span>
          </div>
        </>
      )}
    </div>
  );
}

