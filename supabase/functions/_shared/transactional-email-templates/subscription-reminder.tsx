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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planName?: string
  daysLeft?: number
  expiresOn?: string
  amountUsd?: string
  amountLocal?: string
  dashboardUrl?: string
}

export const SubscriptionReminderEmail = ({
  name = 'there',
  planName = 'StreamNet Mirror plan',
  daysLeft = 3,
  expiresOn = '',
  amountUsd = '',
  amountLocal = '',
  dashboardUrl = 'https://streamnetmirror.app/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your StreamNet Mirror access expires in {String(daysLeft)} day(s)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your access expires soon</Heading>
        <Text style={text}>
          Hi {name}, your <strong>{planName}</strong> ends in <strong>{daysLeft} day(s)</strong>
          {expiresOn ? ` — on ${expiresOn}` : ''}.
        </Text>
        <Section style={box}>
          {amountUsd ? <Text style={row}><strong>Renewal (USD):</strong> {amountUsd}</Text> : null}
          {amountLocal ? <Text style={row}><strong>In your currency:</strong> {amountLocal}</Text> : null}
        </Section>
        <Text style={text}>
          Renew from your dashboard to keep your streaming links, live sports links and download
          tools active: <Link href={dashboardUrl} style={link}>{dashboardUrl}</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>You get a 3-day grace period after expiry before access is locked.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionReminderEmail,
  subject: (d: Record<string, any>) =>
    `Your StreamNet Mirror access expires in ${d?.daysLeft ?? 3} day(s)`,
  displayName: 'Subscription reminder',
  previewData: {
    name: 'Mwando',
    planName: 'All Access — Monthly',
    daysLeft: 3,
    expiresOn: '11 September 2026',
    amountUsd: '$4.99',
    amountLocal: 'ZMW 135.00',
    dashboardUrl: 'https://streamnetmirror.app/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#0b0b0b', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { margin: '0 auto', padding: '24px', maxWidth: '560px' }
const h1 = { color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const text = { color: '#d4d4d4', fontSize: '15px', lineHeight: '24px' }
const row = { color: '#d4d4d4', fontSize: '14px', lineHeight: '22px', margin: '2px 0' }
const box = { backgroundColor: '#171717', borderRadius: '8px', padding: '12px 16px' }
const link = { color: '#e50914' }
const hr = { borderColor: '#262626', margin: '20px 0' }
const footer = { color: '#8a8a8a', fontSize: '12px', lineHeight: '18px' }
