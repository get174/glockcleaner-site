import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export const FLUTTERWAVE_PUBLIC_KEY =
  import.meta.env.VITE_FLUTTERWAVE_CLIENT_ID ||
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
  '';

export const FLUTTERWAVE_ENCRYPTION_KEY =
  import.meta.env.VITE_FLUTTERWAVE_ENCRYPTION_KEY || '';

export { useFlutterwave, closePaymentModal };

