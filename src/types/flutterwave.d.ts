declare module 'flutterwave-react-v3' {
  export interface FlutterwaveConfig {
    public_key: string;
    tx_ref: string;
    amount: number;
    currency: string;
    payment_options?: string;
    redirect_url?: string;
    meta?: Record<string, unknown>;
    customer: {
      email: string;
      phone_number?: string;
      name: string;
    };
    customizations: {
      title: string;
      description?: string;
      logo?: string;
    };
    subaccounts?: Array<{
      id: string;
      transaction_split_ratio?: number;
      transaction_charge_type?: string;
      transaction_charge?: number;
    }>;
    /** integrity_hash is generated using the Encryption Key for enhanced transaction security */
    integrity_hash?: string;
  }

  export interface FlutterwaveResponse {
    status: string;
    transaction_id?: number;
    tx_ref: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    customer?: {
      email?: string;
      name?: string;
    };
    [key: string]: unknown;
  }

  export function useFlutterwave(
    config: FlutterwaveConfig
  ): (options: {
    callback: (response: FlutterwaveResponse) => void;
    onClose: () => void;
  }) => void;

  export function closePaymentModal(): void;
}

