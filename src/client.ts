/**
 * EpPay API Client
 *
 * For Node.js backend integration
 */

export interface EpPayConfig {
  apiKey: string;
  baseUrl?: string;
  defaultBeneficiary?: string;
  defaultRpc?: string;
  defaultToken?: string;
  successUrl?: string;
}

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

export interface PaymentStatusResponse {
  status: boolean;
}

export class EpPayClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultBeneficiary?: string;
  private defaultRpc?: string;
  private defaultToken?: string;
  private successUrl?: string;

  constructor(config: EpPayConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://eppay.io';
    this.defaultBeneficiary = config.defaultBeneficiary;
    this.defaultRpc = config.defaultRpc || 'https://rpc.scimatic.net';
    this.defaultToken = config.defaultToken;
    this.successUrl = config.successUrl || 'https://eppay.io/payment-success';

    if (!this.apiKey) {
      throw new Error('EpPay API key is required');
    }
  }

  /**
   * Generate a payment request
   */
  async generatePayment(params: GeneratePaymentParams): Promise<PaymentResponse> {
    const to = params.to || this.defaultBeneficiary;
    const rpc = params.rpc || this.defaultRpc;
    const token = params.token || this.defaultToken;
    const success = params.success || this.successUrl;

    if (!to) {
      throw new Error('Beneficiary address is required (to parameter or defaultBeneficiary)');
    }
    if (!rpc) {
      throw new Error('Network RPC is required (rpc parameter or defaultRpc)');
    }
    if (!token) {
      throw new Error('Token address is required (token parameter or defaultToken)');
    }

    const payload = {
      apiKey: this.apiKey,
      amount: params.amount.toString(),
      to,
      rpc,
      token,
      success
    };

    const response = await fetch(`${this.baseUrl}/generate-code`, {
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
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<PaymentStatusResponse> {
    const response = await fetch(`${this.baseUrl}/payment-status/${paymentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to verify payment: ${error}`);
    }

    return response.json();
  }

  /**
   * Check if payment is completed
   */
  async isPaymentCompleted(paymentId: string): Promise<boolean> {
    try {
      const status = await this.verifyPayment(paymentId);
      return status.status === true;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Get QR code data string
   * Format: product=uuideppay&id={paymentId}
   */
  getQrCodeData(paymentId: string): string {
    return `product=uuideppay&id=${paymentId}`;
  }

  /**
   * Get payment page URL
   */
  getPaymentUrl(paymentId: string): string {
    return `${this.baseUrl}/payment/${paymentId}`;
  }
}
