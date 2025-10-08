/**
 * EpPay Payment Widget
 *
 * For frontend/browser integration
 */

import QRCode from 'qrcode';

export interface WidgetConfig {
  paymentId: string;
  container: HTMLElement | string;
  verifyUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  autoRefresh?: boolean;
  pollingInterval?: number;
  onComplete?: (paymentId: string) => void;
  onError?: (error: Error) => void;
}

export class EpPayWidget {
  private paymentId: string;
  private container: HTMLElement;
  private verifyUrl: string;
  private successUrl?: string;
  private cancelUrl?: string;
  private autoRefresh: boolean;
  private pollingInterval: number;
  private onComplete?: (paymentId: string) => void;
  private onError?: (error: Error) => void;
  private timer: number | null = null;
  private checking = false;

  constructor(config: WidgetConfig) {
    this.paymentId = config.paymentId;

    // Get container element
    if (typeof config.container === 'string') {
      const element = document.querySelector(config.container);
      if (!element) {
        throw new Error(`Container element not found: ${config.container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = config.container;
    }

    this.verifyUrl = config.verifyUrl || '/eppay/verify';
    this.successUrl = config.successUrl;
    this.cancelUrl = config.cancelUrl;
    this.autoRefresh = config.autoRefresh ?? true;
    this.pollingInterval = config.pollingInterval || 3000;
    this.onComplete = config.onComplete;
    this.onError = config.onError;
  }

  /**
   * Initialize and render the widget
   */
  async init(): Promise<void> {
    await this.render();
    if (this.autoRefresh) {
      this.startPolling();
    }
  }

  /**
   * Render the widget HTML
   */
  private async render(): Promise<void> {
    const qrData = `product=uuideppay&id=${this.paymentId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
    });

    this.container.innerHTML = `
      <div class="eppay-widget" style="max-width: 28rem; margin: 0 auto; padding: 1.5rem; background: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <!-- Success Banner -->
        <div id="eppay-success-banner" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; border-radius: 0.375rem;">
          <div style="display: flex; align-items: center;">
            <svg style="width: 1.5rem; height: 1.5rem; margin-right: 0.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span style="font-weight: 600;">Payment Completed!</span>
          </div>
        </div>

        <!-- Error Message -->
        <div id="eppay-error" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 0.375rem;">
          <span id="eppay-error-text"></span>
        </div>

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 0.5rem;">Scan to Pay</h2>
          <p style="color: #6b7280;">Scan this QR code with your EpPay mobile app</p>
        </div>

        <!-- QR Code -->
        <div id="eppay-qr-container" style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
          <div style="position: relative;">
            <img src="${qrCodeDataUrl}" alt="Payment QR Code" style="width: 16rem; height: 16rem; border: 4px solid #e5e7eb; border-radius: 0.5rem;"/>
            <div id="eppay-loading" style="display: none; position: absolute; inset: 0; background: rgba(255, 255, 255, 0.75); display: flex; align-items: center; justify-content: center; border-radius: 0.5rem;">
              <div style="width: 2.5rem; height: 2.5rem; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <button id="eppay-check-btn" style="width: 100%; padding: 0.75rem 1rem; background: #3b82f6; color: white; font-weight: 600; border: none; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s;">
            <span id="eppay-btn-check">Check Payment Status</span>
            <span id="eppay-btn-checking" style="display: none;">Checking...</span>
          </button>
          ${this.cancelUrl ? `
            <a href="${this.cancelUrl}" style="display: block; width: 100%; padding: 0.75rem 1rem; background: #e5e7eb; color: #1f2937; font-weight: 600; text-align: center; text-decoration: none; border-radius: 0.5rem; transition: background 0.2s;">
              Cancel Payment
            </a>
          ` : ''}
        </div>

        <!-- Auto-check Indicator -->
        ${this.autoRefresh ? `
          <div id="eppay-auto-indicator" style="margin-top: 1.5rem; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; font-size: 0.875rem; color: #6b7280;">
              <div style="width: 0.5rem; height: 0.5rem; background: #10b981; border-radius: 50%; margin-right: 0.5rem; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
              <span>Auto-checking payment status...</span>
            </div>
          </div>
        ` : ''}
      </div>

      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        #eppay-check-btn:hover {
          background: #2563eb;
        }
        #eppay-check-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      </style>
    `;

    // Attach event listeners
    const checkBtn = this.container.querySelector('#eppay-check-btn') as HTMLButtonElement;
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkStatus());
    }
  }

  /**
   * Check payment status
   */
  async checkStatus(): Promise<void> {
    if (this.checking) return;

    this.checking = true;
    this.updateUI('checking');

    try {
      const response = await fetch(`${this.verifyUrl}/${this.paymentId}`);
      const data = await response.json();

      if (data.status === true) {
        this.handlePaymentComplete();
      } else {
        this.updateUI('pending');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.showError('Failed to check payment status');
      if (this.onError) {
        this.onError(err);
      }
      this.updateUI('error');
    } finally {
      this.checking = false;
    }
  }

  /**
   * Handle payment completion
   */
  private handlePaymentComplete(): void {
    this.stopPolling();
    this.updateUI('completed');

    if (this.onComplete) {
      this.onComplete(this.paymentId);
    }

    if (this.successUrl) {
      setTimeout(() => {
        window.location.href = this.successUrl!;
      }, 1000);
    }

    // Dispatch custom event
    const event = new CustomEvent('eppay-payment-completed', {
      detail: { paymentId: this.paymentId },
    });
    document.dispatchEvent(event);
  }

  /**
   * Update UI state
   */
  private updateUI(state: 'checking' | 'pending' | 'completed' | 'error'): void {
    const btnCheck = this.container.querySelector('#eppay-btn-check') as HTMLElement;
    const btnChecking = this.container.querySelector('#eppay-btn-checking') as HTMLElement;
    const loading = this.container.querySelector('#eppay-loading') as HTMLElement;
    const successBanner = this.container.querySelector('#eppay-success-banner') as HTMLElement;
    const qrContainer = this.container.querySelector('#eppay-qr-container') as HTMLElement;
    const autoIndicator = this.container.querySelector('#eppay-auto-indicator') as HTMLElement;

    if (state === 'checking') {
      if (btnCheck) btnCheck.style.display = 'none';
      if (btnChecking) btnChecking.style.display = 'inline';
      if (loading) loading.style.display = 'flex';
    } else if (state === 'pending') {
      if (btnCheck) btnCheck.style.display = 'inline';
      if (btnChecking) btnChecking.style.display = 'none';
      if (loading) loading.style.display = 'none';
    } else if (state === 'completed') {
      if (successBanner) successBanner.style.display = 'block';
      if (qrContainer) qrContainer.style.display = 'none';
      if (autoIndicator) autoIndicator.style.display = 'none';
    } else if (state === 'error') {
      if (btnCheck) btnCheck.style.display = 'inline';
      if (btnChecking) btnChecking.style.display = 'none';
      if (loading) loading.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const errorDiv = this.container.querySelector('#eppay-error') as HTMLElement;
    const errorText = this.container.querySelector('#eppay-error-text') as HTMLElement;

    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.style.display = 'block';

      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Start polling for payment status
   */
  private startPolling(): void {
    if (!this.autoRefresh) return;

    this.timer = window.setInterval(() => {
      this.checkStatus();
    }, this.pollingInterval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Destroy the widget and clean up
   */
  destroy(): void {
    this.stopPolling();
    this.container.innerHTML = '';
  }
}
