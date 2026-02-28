/**
 * EpPay JavaScript SDK v2
 *
 * Cryptocurrency payment integration for JavaScript/TypeScript projects.
 * Uses EpPay v2 API with network slugs + token types.
 */

export { EpPayClient } from './client';
export type {
  EpPayConfig,
  CreatePaymentParams,
  CreatePaymentResponse,
  PaymentStatusResponse,
  PaymentDetailsResponse,
  NetworkInfo,
  NetworkToken,
  // Legacy (deprecated)
  GeneratePaymentParams,
  PaymentResponse,
} from './client';

export { EpPayWidget } from './widget';
export type { WidgetConfig, WidgetPaymentStatus } from './widget';
