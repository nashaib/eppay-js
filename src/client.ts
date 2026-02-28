/**
 * EpPay API Client v2
 *
 * For Node.js and browser integration using EpPay v2 API.
 * Uses network slugs + token types instead of raw RPC URLs and contract addresses.
 */

export interface EpPayConfig {
  apiKey: string;
  baseUrl?: string;
  defaultBeneficiary?: string;
  defaultNetwork?: string;
  defaultTokenType?: 'USDT' | 'USDC';
  successUrl?: string;
}

export interface CreatePaymentParams {
  amount: number;
  to?: string;
  network?: string;
  tokenType?: 'USDT' | 'USDC';
  success?: string;
}

export interface CreatePaymentResponse {
  payment_id: string;
  amount: string;
  network: string;
  token_type: string;
  to: string;
  status: 'pending' | 'completed';
  qr_data: string;
  payment_url: string;
  created_at: string;
  is_existing: boolean;
}

export interface PaymentStatusResponse {
  payment_id: string;
  status: 'pending' | 'completed';
  confirmed: boolean;
  amount: string;
  network: string;
  token_type: string;
  tx_hash: string | null;
  from: string | null;
  completed_at: string | null;
}

export interface PaymentDetailsResponse {
  payment_id: string;
  amount: string;
  to: string;
  from: string | null;
  network: {
    slug: string;
    name: string;
    coin: string;
  } | null;
  token_type: string;
  status: 'pending' | 'completed';
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface NetworkToken {
  type: string;
  available: boolean;
}

export interface NetworkInfo {
  slug: string;
  name: string;
  coin: string;
  chain_id: number;
  explorer: string;
  tokens: NetworkToken[];
}

// Legacy types (deprecated)
export interface GeneratePaymentParams {
  amount: number;
  to?: string;
  rpc?: string;
  token?: string;
  success?: string;
}

export interface PaymentResponse {
  paymentId: string;
}

export class EpPayClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultBeneficiary?: string;
  private defaultNetwork: string;
  private defaultTokenType: string;
  private successUrl?: string;

  constructor(config: EpPayConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'https://eppay.io').replace(/\/+$/, '');
    this.defaultBeneficiary = config.defaultBeneficiary;
    this.defaultNetwork = config.defaultNetwork || 'bsc';
    this.defaultTokenType = config.defaultTokenType || 'USDT';
    this.successUrl = config.successUrl;

    if (!this.apiKey) {
      throw new Error('EpPay API key is required');
    }
  }

  /**
   * Create a payment via v2 API.
   * Returns rich response with payment_id, qr_data, payment_url, etc.
   */
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    const to = params.to || this.defaultBeneficiary;
    const network = params.network || this.defaultNetwork;
    const tokenType = params.tokenType || this.defaultTokenType;
    const success = params.success || this.successUrl;

    if (!to) {
      throw new Error('Beneficiary address is required (to parameter or defaultBeneficiary)');
    }

    const payload: Record<string, string> = {
      apiKey: this.apiKey,
      amount: params.amount.toString(),
      to,
      network,
      token_type: tokenType,
    };

    if (success) {
      payload.success = success;
    }

    const response = await fetch(`${this.baseUrl}/api/v2/create-payment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create payment: ${error}`);
    }

    return response.json();
  }

  /**
   * Check payment status (rich response with tx_hash, network, timestamps).
   */
  async checkStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/status`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check payment status: ${error}`);
    }

    return response.json();
  }

  /**
   * Get full payment details (with nested network object).
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get payment details: ${error}`);
    }

    return response.json();
  }

  /**
   * Check if payment is completed.
   */
  async isPaymentCompleted(paymentId: string): Promise<boolean> {
    try {
      const status = await this.checkStatus(paymentId);
      return status.confirmed === true;
    } catch {
      return false;
    }
  }

  /**
   * Poll for payment completion. Resolves when confirmed or timeout.
   *
   * @param paymentId Payment UUID
   * @param intervalMs Polling interval in ms (default: 3000)
   * @param timeoutMs Max wait time in ms (default: 1800000 = 30 min)
   * @returns Resolved status response or null on timeout
   */
  async waitForPayment(
    paymentId: string,
    intervalMs = 3000,
    timeoutMs = 1800000
  ): Promise<PaymentStatusResponse | null> {
    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve) => {
      const poll = async () => {
        if (Date.now() > deadline) {
          resolve(null);
          return;
        }

        try {
          const status = await this.checkStatus(paymentId);
          if (status.confirmed) {
            resolve(status);
            return;
          }
        } catch {
          // Continue polling on error
        }

        setTimeout(poll, intervalMs);
      };

      poll();
    });
  }

  /**
   * Get available networks with their tokens.
   */
  async getNetworks(): Promise<NetworkInfo[]> {
    const response = await fetch(`${this.baseUrl}/api/v2/networks`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch networks');
    }

    return response.json();
  }

  /**
   * Get QR code data string.
   * Format: product=uuideppay&id={paymentId}
   */
  getQrCodeData(paymentId: string): string {
    return `product=uuideppay&id=${paymentId}`;
  }

  /**
   * Get payment page URL.
   */
  getPaymentUrl(paymentId: string): string {
    return `${this.baseUrl}/payment/${paymentId}`;
  }

  // ── Legacy v1 methods (deprecated) ──────────────────────────

  /**
   * @deprecated Use createPayment() instead. This method calls the v1 API.
   */
  async generatePayment(params: GeneratePaymentParams): Promise<PaymentResponse> {
    const to = params.to || this.defaultBeneficiary;
    const success = params.success || this.successUrl;

    if (!to || !params.rpc || !params.token) {
      throw new Error('Legacy v1 requires to, rpc, and token. Use createPayment() instead.');
    }

    const payload: Record<string, string> = {
      apiKey: this.apiKey,
      amount: params.amount.toString(),
      to,
      rpc: params.rpc,
      token: params.token,
    };

    if (success) {
      payload.success = success;
    }

    const response = await fetch(`${this.baseUrl}/api/generate-code`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate payment: ${error}`);
    }

    return response.json();
  }

  /**
   * @deprecated Use checkStatus() instead. This method calls the v1 API.
   */
  async verifyPayment(paymentId: string): Promise<{ status: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/payment-status/${paymentId}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to verify payment: ${error}`);
    }

    return response.json();
  }
}
