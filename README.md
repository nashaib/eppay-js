# EpPay JavaScript SDK

Official JavaScript/TypeScript SDK for EpPay cryptocurrency payment integration.

[![npm version](https://badge.fury.io/js/eppay.svg)](https://www.npmjs.com/package/eppay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Easy Integration** - Simple API for generating and verifying payments
✅ **TypeScript Support** - Full TypeScript definitions included
✅ **QR Code Generation** - Built-in QR code generation for mobile payments
✅ **Payment Widget** - Pre-built UI component for payment pages
✅ **Auto-Polling** - Automatic payment status checking
✅ **Framework Agnostic** - Works with React, Vue, Angular, Next.js, Express, etc.
✅ **Zero Dependencies** - Lightweight with minimal dependencies

## Installation

```bash
npm install eppay
# or
yarn add eppay
# or
pnpm add eppay
```

## Quick Start

### Backend Usage (Node.js, Express, Next.js API Routes)

```typescript
import { EpPayClient } from 'eppay';

const client = new EpPayClient({
  apiKey: 'your-api-key',
  defaultBeneficiary: '0x8AB960B95aCCc5080c15721fdeA30e72C8251F0b',
  defaultRpc: 'https://rpc.scimatic.net',
  defaultToken: '0x65C4A0dA0416d1262DbC04BeE524c804205B92e8',
});

// Generate a payment
const payment = await client.generatePayment({
  amount: 100.00,
});

console.log('Payment ID:', payment.paymentId);

// Verify payment status
const status = await client.verifyPayment(payment.paymentId);
console.log('Payment status:', status.status); // true or false

// Check if completed
const isCompleted = await client.isPaymentCompleted(payment.paymentId);
console.log('Is completed:', isCompleted);
```

### Frontend Usage (React, Vue, Vanilla JS)

```typescript
import { EpPayWidget } from 'eppay';

// Initialize the widget
const widget = new EpPayWidget({
  paymentId: 'your-payment-id',
  container: '#payment-container', // or HTMLElement
  autoRefresh: true,
  pollingInterval: 3000,
  successUrl: '/payment-success',
  onComplete: (paymentId) => {
    console.log('Payment completed!', paymentId);
  },
  onError: (error) => {
    console.error('Payment error:', error);
  },
});

// Render the widget
await widget.init();
```

### React Example

```tsx
import { useEffect, useRef } from 'react';
import { EpPayWidget } from 'eppay';

function PaymentPage({ paymentId }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !widgetRef.current) {
      widgetRef.current = new EpPayWidget({
        paymentId,
        container: containerRef.current,
        autoRefresh: true,
        onComplete: (id) => {
          console.log('Payment completed:', id);
          // Redirect or update UI
        },
      });

      widgetRef.current.init();
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, [paymentId]);

  return <div ref={containerRef} />;
}
```

### Vue Example

```vue
<template>
  <div ref="paymentContainer"></div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { EpPayWidget } from 'eppay';

export default {
  props: ['paymentId'],
  setup(props) {
    const paymentContainer = ref(null);
    let widget = null;

    onMounted(async () => {
      widget = new EpPayWidget({
        paymentId: props.paymentId,
        container: paymentContainer.value,
        autoRefresh: true,
        onComplete: (id) => {
          console.log('Payment completed:', id);
        },
      });

      await widget.init();
    });

    onUnmounted(() => {
      if (widget) {
        widget.destroy();
      }
    });

    return { paymentContainer };
  },
};
</script>
```

### Next.js Example

```typescript
// app/api/payment/route.ts
import { EpPayClient } from 'eppay';
import { NextResponse } from 'next/server';

const client = new EpPayClient({
  apiKey: process.env.EPPAY_API_KEY!,
  defaultBeneficiary: process.env.EPPAY_BENEFICIARY!,
  defaultRpc: process.env.EPPAY_RPC!,
  defaultToken: process.env.EPPAY_TOKEN!,
});

export async function POST(request: Request) {
  const { amount } = await request.json();

  const payment = await client.generatePayment({ amount });

  return NextResponse.json(payment);
}
```

```typescript
// app/payment/[id]/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { EpPayWidget } from 'eppay';

export default function PaymentPage({ params }: { params: { id: string } }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const widget = new EpPayWidget({
        paymentId: params.id,
        container: containerRef.current,
        autoRefresh: true,
        successUrl: '/payment-success',
      });

      widget.init();
    }
  }, [params.id]);

  return <div ref={containerRef} />;
}
```

## API Reference

### EpPayClient

#### Constructor

```typescript
new EpPayClient(config: EpPayConfig)
```

**Config Options:**
- `apiKey` (required): Your EpPay API key
- `baseUrl` (optional): API base URL (default: `https://eppay.io`)
- `defaultBeneficiary` (optional): Default wallet address
- `defaultRpc` (optional): Default RPC URL (default: `https://rpc.scimatic.net`)
- `defaultToken` (optional): Default token contract address
- `successUrl` (optional): Success callback URL (default: `https://eppay.io/payment-success`)

#### Methods

##### `generatePayment(params: GeneratePaymentParams): Promise<PaymentResponse>`

Generate a new payment request.

**Parameters:**
- `amount` (required): Payment amount
- `to` (optional): Beneficiary wallet address (uses `defaultBeneficiary` if not provided)
- `rpc` (optional): Network RPC URL (uses `defaultRpc` if not provided)
- `token` (optional): Token contract address (uses `defaultToken` if not provided)
- `success` (optional): Success callback URL (uses `successUrl` if not provided)

**Returns:** `{ paymentId: string }`

##### `verifyPayment(paymentId: string): Promise<PaymentStatusResponse>`

Check payment status.

**Returns:** `{ status: boolean }`

##### `isPaymentCompleted(paymentId: string): Promise<boolean>`

Check if payment is completed.

**Returns:** `boolean`

##### `getQrCodeData(paymentId: string): string`

Get QR code data string in format: `product=uuideppay&id={paymentId}`

##### `getPaymentUrl(paymentId: string): string`

Get payment page URL.

### EpPayWidget

#### Constructor

```typescript
new EpPayWidget(config: WidgetConfig)
```

**Config Options:**
- `paymentId` (required): Payment ID to display
- `container` (required): Container element or selector string
- `verifyUrl` (optional): Verification endpoint (default: `/eppay/verify`)
- `successUrl` (optional): Redirect URL after successful payment
- `cancelUrl` (optional): Cancel button URL
- `autoRefresh` (optional): Enable auto-polling (default: `true`)
- `pollingInterval` (optional): Polling interval in ms (default: `3000`)
- `onComplete` (optional): Callback function when payment completes
- `onError` (optional): Error callback function

#### Methods

##### `init(): Promise<void>`

Initialize and render the widget.

##### `checkStatus(): Promise<void>`

Manually check payment status.

##### `stopPolling(): void`

Stop auto-polling.

##### `destroy(): void`

Clean up and destroy the widget.

## Environment Variables

For Node.js/Next.js backend:

```env
EPPAY_API_KEY=your-api-key
EPPAY_BENEFICIARY=0x8AB960B95aCCc5080c15721fdeA30e72C8251F0b
EPPAY_RPC=https://rpc.scimatic.net
EPPAY_TOKEN=0x65C4A0dA0416d1262DbC04BeE524c804205B92e8
```

## Payment Flow

1. **Backend**: Generate payment with `client.generatePayment()`
2. **Frontend**: Display QR code using `EpPayWidget`
3. **User**: Scans QR with EpPay mobile app and confirms payment
4. **Mobile App**: Sends confirmation to `https://eppay.io/payment-success`
5. **Your App**: Polls `verifyPayment()` to check status (widget does this automatically)
6. **Backend**: Receives `{ status: true }` when payment completes

## Events

The widget dispatches a custom event when payment completes:

```javascript
document.addEventListener('eppay-payment-completed', (event) => {
  console.log('Payment ID:', event.detail.paymentId);
});
```

## TypeScript Support

This package includes full TypeScript definitions. All types are exported:

```typescript
import type {
  EpPayConfig,
  GeneratePaymentParams,
  PaymentResponse,
  PaymentStatusResponse,
  WidgetConfig,
} from 'eppay';
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with ES2020 support

## License

MIT © EpPay

## Support

- Documentation: https://docs.eppay.io
- Issues: https://github.com/nashaib/eppay-js/issues
- Email: support@eppay.io

## Related Packages

- [laravel-eppay](https://packagist.org/packages/eppay/laravel-eppay) - Laravel package for EpPay integration
