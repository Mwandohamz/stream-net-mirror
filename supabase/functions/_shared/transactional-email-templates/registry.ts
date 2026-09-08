import type { ComponentType } from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as paymentConfirmation } from './payment-confirmation.tsx'
import { template as subscriptionReminder } from './subscription-reminder.tsx'
import { template as subscriptionExpired } from './subscription-expired.tsx'

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'payment-confirmation': paymentConfirmation,
  'subscription-reminder': subscriptionReminder,
  'subscription-expired': subscriptionExpired,
}
