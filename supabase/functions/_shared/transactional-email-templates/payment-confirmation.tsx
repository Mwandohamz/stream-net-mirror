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
  amountUsd?: string
  amountLocal?: string
  categories?: string[]
  renewsOn?: string
  reference?: string
  dashboardUrl?: string
}

export const PaymentConfirmationEmail = ({
  name = 'there',
  planName = 'StreamNet Mirror plan',
  amountUsd = '$0.00',
  amountLocal = '',
  categories = [],
  renewsOn = '',
  reference = '',
  dashboardUrl = 'https://streamnetmirror.app/dashboard',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment confirmed — your StreamNet Mirror access is active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment confirmed</Heading>
        <Text style={text}>Hi {name}, your payment went through and your access is now active.</Text>

        <Section style={box}>
          <Text style={row}><strong>Plan:</strong> {planName}</Text>
          <Text style={row}><strong>Amount (USD):</strong> {amountUsd}</Text>
          {amountLocal ? <Text style={row}><strong>Amount charged:</strong> {amountLocal}</Text> : null}
          {renewsOn ? <Text style={row}><strong>Next payment due:</strong> {renewsOn}</Text> : null}
          {reference ? <Text style={row}><strong>Reference:</strong> {reference}</Text> : null}
        </Section>

        {categories.length > 0 && (
          <>
            <Text style={text}><strong>What you unlocked</strong></Text>
            {categories.map((c) => (
              <Text key={c} style={row}>• {c}</Text>
            ))}
          </>
        )}

        <Text style={text}>
          Open your dashboard to get your streaming links, app downloads and setup guides:{' '}
          <Link href={dashboardUrl} style={link}>{dashboardUrl}</Link>
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          StreamNet Mirror provides verified access links to third-party streaming platforms.
          Keep this email as your receipt.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentConfirmationEmail,
  subject: 'Payment confirmed — your access is active',
  displayName: 'Payment confirmation',
  previewData: {
    name: 'Mwando',
    planName: 'All Access — Monthly',
    amountUsd: '$4.99',
    amountLocal: 'ZMW 135.00',
    categories: ['NetMirror OTT links', 'Live Sports links', 'Movie download tools'],
    renewsOn: '8 October 2026',
    reference: 'SNM-9001134014',
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
