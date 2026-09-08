// Shared transactional notification helpers (service-role client only).
import { sendTemplateEmail } from './transactional-email-templates/send-email.ts'

const SITE_URL = 'https://streamnetmirror.app'

export function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !isFinite(Number(amount))) return ''
  const cur = (currency || 'USD').toUpperCase()
  const zeroDecimal = ['JPY', 'KRW', 'UGX', 'RWF', 'XOF', 'XAF', 'VND']
  const digits = zeroDecimal.includes(cur) ? 0 : 2
  return `${cur} ${Number(amount).toFixed(digits)}`
}

export function usd(amount: number | null | undefined): string {
  if (amount == null || !isFinite(Number(amount))) return ''
  return `$${Number(amount).toFixed(2)}`
}

export function longDate(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

async function logEmail(
  supabase: any,
  row: {
    user_id?: string | null
    recipient: string
    email_type: string
    subject?: string | null
    status: string
    error?: string | null
    metadata?: Record<string, unknown> | null
  },
) {
  try {
    await supabase.from('email_log').insert(row)
  } catch (err) {
    console.error('email_log insert failed', err)
  }
}

async function categoryNames(supabase: any, slugs: string[] | null | undefined): Promise<string[]> {
  if (!slugs || slugs.length === 0) return []
  const { data } = await supabase.from('content_categories').select('slug, name').in('slug', slugs)
  const map = new Map<string, string>((data || []).map((c: any) => [c.slug, c.name]))
  return slugs.map((s) => map.get(s) || s)
}

/** Sends the payment confirmation email for a completed deposit. Safe to call twice (idempotent key). */
export async function sendPaymentConfirmation(supabase: any, depositId: string): Promise<void> {
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('deposit_id', depositId)
    .maybeSingle()

  if (!payment?.email) {
    console.log('notify: no payment/email for deposit', depositId)
    return
  }

  let plan: any = null
  if (payment.plan_id) {
    const { data } = await supabase.from('plans').select('*').eq('id', payment.plan_id).maybeSingle()
    plan = data
  }

  let renewsOn = ''
  if (payment.subscription_id) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('current_period_end')
      .eq('id', payment.subscription_id)
      .maybeSingle()
    renewsOn = longDate(sub?.current_period_end)
  }

  const templateData = {
    name: payment.name || 'there',
    planName: plan?.name || 'StreamNet Mirror plan',
    amountUsd: usd(payment.amount_usd ?? (plan?.price_usd ?? null)),
    amountLocal: money(payment.amount, payment.currency),
    categories: await categoryNames(supabase, plan?.category_slugs),
    renewsOn,
    reference: payment.provider_transaction_id || payment.deposit_id || '',
    dashboardUrl: `${SITE_URL}/dashboard`,
  }

  try {
    const result = await sendTemplateEmail('payment-confirmation', payment.email, {
      templateData,
      idempotencyKey: `payment-confirmation-${payment.id}`,
    })
    await logEmail(supabase, {
      user_id: payment.user_id ?? null,
      recipient: payment.email,
      email_type: 'payment_confirmation',
      subject: 'Payment confirmed — your access is active',
      status: result.sent ? 'sent' : 'suppressed',
      metadata: { deposit_id: depositId, amount_usd: templateData.amountUsd, local: templateData.amountLocal },
    })
  } catch (err) {
    console.error('notify: payment confirmation failed', err)
    await logEmail(supabase, {
      user_id: payment.user_id ?? null,
      recipient: payment.email,
      email_type: 'payment_confirmation',
      subject: 'Payment confirmed — your access is active',
      status: 'failed',
      error: String((err as Error)?.message ?? err),
      metadata: { deposit_id: depositId },
    })
  }
}

export interface ReminderResult {
  reminders: number
  expired: number
  skipped: number
}

/**
 * Sends renewal reminders for subscriptions ending within `days` and expiry notices
 * for subscriptions that just ended. Idempotent per subscription period.
 */
export async function runSubscriptionEmails(
  supabase: any,
  days = 3,
  onlyUserId?: string | null,
): Promise<ReminderResult> {
  const now = new Date()
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const out: ReminderResult = { reminders: 0, expired: 0, skipped: 0 }

  let query = supabase
    .from('subscriptions')
    .select('id, user_id, plan_id, status, current_period_end, grace_days')
    .lte('current_period_end', horizon.toISOString())
    .in('status', ['active', 'past_due'])
  if (onlyUserId) query = query.eq('user_id', onlyUserId)

  const { data: subs, error } = await query
  if (error) {
    console.error('notify: subscription query failed', error)
    return out
  }

  for (const sub of subs || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', sub.user_id)
      .maybeSingle()
    if (!profile?.email) {
      out.skipped++
      continue
    }

    let plan: any = null
    if (sub.plan_id) {
      const { data } = await supabase.from('plans').select('name, price_usd').eq('id', sub.plan_id).maybeSingle()
      plan = data
    }

    const end = new Date(sub.current_period_end)
    const isExpired = end.getTime() <= now.getTime()
    const template = isExpired ? 'subscription-expired' : 'subscription-reminder'
    const emailType = isExpired ? 'subscription_expired' : 'subscription_reminder'
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

    const templateData = isExpired
      ? {
          name: profile.full_name || 'there',
          planName: plan?.name || 'StreamNet Mirror plan',
          expiredOn: longDate(sub.current_period_end),
          graceDays: sub.grace_days ?? 3,
          dashboardUrl: `${SITE_URL}/dashboard`,
        }
      : {
          name: profile.full_name || 'there',
          planName: plan?.name || 'StreamNet Mirror plan',
          daysLeft,
          expiresOn: longDate(sub.current_period_end),
          amountUsd: usd(plan?.price_usd),
          amountLocal: '',
          dashboardUrl: `${SITE_URL}/dashboard`,
        }

    try {
      const result = await sendTemplateEmail(template, profile.email, {
        templateData,
        idempotencyKey: `${template}-${sub.id}-${sub.current_period_end}`,
      })
      if (result.sent) {
        isExpired ? out.expired++ : out.reminders++
      } else {
        out.skipped++
      }
      await logEmail(supabase, {
        user_id: sub.user_id,
        recipient: profile.email,
        email_type: emailType,
        subject: isExpired ? 'Your StreamNet Mirror access has expired' : `Your access expires in ${daysLeft} day(s)`,
        status: result.sent ? 'sent' : 'suppressed',
        metadata: { subscription_id: sub.id, period_end: sub.current_period_end },
      })
    } catch (err) {
      out.skipped++
      console.error('notify: subscription email failed', err)
      await logEmail(supabase, {
        user_id: sub.user_id,
        recipient: profile.email,
        email_type: emailType,
        status: 'failed',
        error: String((err as Error)?.message ?? err),
        metadata: { subscription_id: sub.id },
      })
    }
  }

  return out
}
