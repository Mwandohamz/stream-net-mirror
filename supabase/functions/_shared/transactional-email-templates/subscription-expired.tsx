/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  expiredOn?: string
  graceDays?: number
  dashboardUrl?: string
}

export const SubscriptionExpiredEmail = ({
  name = 'there',
  planName = 'StreamNet Mirror plan',
  expiredOn = '',
  graceDays = 3,
  dashboardUrl = 'https://streamnetmirror.app/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your StreamNet Mirror access has expired</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your access has expired</Heading>
        <Text style={text}>
          Hi {name}, your <strong>{planName}</strong> expired{expiredOn ? ` on ${expiredOn}` : ''}.
          You have a {graceDays}-day grace period before your links stop working.
        </Text>
        <Text style={text}>
          Renew in a couple of taps from your dashboard:{' '}
          <Link href={dashboardUrl} style={link}>{dashboardUrl}</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Need help? Open a support ticket from inside your dashboard.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionExpiredEmail,
  subject: 'Your StreamNet Mirror access has expired',
  displayName: 'Subscription expired',
  previewData: {
    name: 'Mwando',
    planName: 'All Access — Monthly',
    expiredOn: '8 September 2026',
    graceDays: 3,
    dashboardUrl: 'https://streamnetmirror.app/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#0b0b0b', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px', maxWidth: '560px' }
const h1 = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const text = { color: '#d4d4d4', fontSize: '15px', lineHeight: '24px' }
const link = { color: '#e50914' }
const hr = { borderColor: '#262626', margin: '20px 0' }
const footer = { color: '#8a8a8a', fontSize: '12px', lineHeight: '18px' }
