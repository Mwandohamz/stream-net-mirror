/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Body, Column, Container, Head, Heading, Hr, Html, Link, Preview, Row, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandHeader, brand } from './brand.tsx'

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

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Row style={detailRow}>
    <Column style={detailLabel}>{label}</Column>
    <Column style={detailValue}>{value}</Column>
  </Row>
)

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
    <Preview>You're in, {name}! Your StreamNet Mirror membership is active.</Preview>
    <Body style={brand.main}>
      <Container style={brand.container}>
        <BrandHeader />
        <Section style={hero}>
          <Text style={check}>✓</Text>
          <Heading style={heroTitle}>You're all set, {name}!</Heading>
          <Text style={heroText}>Your payment is confirmed and your membership is active right now.</Text>
        </Section>

        <Section style={brand.content}>
          <Section style={card}>
            <Text style={cardTitle}>Membership receipt</Text>
            <DetailRow label="Plan" value={planName} />
            {amountLocal ? <DetailRow label="Amount paid" value={amountLocal} /> : null}
            <DetailRow label="Amount (USD)" value={amountUsd} />
            {renewsOn ? <DetailRow label="Access until" value={renewsOn} /> : null}
            {reference ? <DetailRow label="Reference" value={reference} /> : null}
          </Section>

          {categories.length > 0 && (
            <Section style={{ margin: '20px 0 0' }}>
              <Text style={cardTitle}>What you unlocked</Text>
              {categories.map((c) => <Text key={c} style={unlockItem}>▶&nbsp; {c}</Text>)}
            </Section>
          )}

          <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
            <Link href={dashboardUrl} style={cta}>Start watching</Link>
          </Section>
          <Text style={{ ...brand.row, textAlign: 'center' as const }}>
            Links refresh regularly, so always open them from your dashboard.
          </Text>

          <Hr style={brand.hr} />
          <Text style={brand.footer}>
            Keep this email as your receipt. Need help? Reply to shuvaegonera@gmail.com.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentConfirmationEmail,
  subject: "You're in! Your StreamNet Mirror membership is active",
  displayName: 'Payment confirmation',
  previewData: {
    name: 'Mwando',
    planName: 'All Access — Monthly',
    amountUsd: '$4.99',
    amountLocal: 'ZMW 135.00',
    categories: ['NetMirror streaming', 'Live Sports', 'Movie downloads'],
    renewsOn: '8 October 2026',
    reference: 'SNM-9001134014',
    dashboardUrl: 'https://streamnetmirror.app/dashboard',
  },
} satisfies TemplateEntry

const hero = { background: 'linear-gradient(135deg, #e50914 0%, #3d195b 55%, #00a3e0 100%)', backgroundColor: '#3d195b', padding: '32px 24px', textAlign: 'center' as const }
const check = { display: 'inline-block', width: '56px', height: '56px', lineHeight: '56px', borderRadius: '28px', backgroundColor: '#ffffff', color: '#16a34a', fontSize: '30px', fontWeight: '700' as const, margin: '0 auto 12px' }
const heroTitle = { color: '#ffffff', fontSize: '26px', fontWeight: '800' as const, margin: '0 0 8px' }
const heroText = { color: '#f1f5f9', fontSize: '15px', lineHeight: '22px', margin: 0 }
const card = { border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 18px', marginTop: '24px' }
const cardTitle = { color: '#141414', fontSize: '13px', fontWeight: '700' as const, letterSpacing: '0.5px', textTransform: 'uppercase' as const, margin: '0 0 8px' }
const detailRow = { borderBottom: '1px solid #f1f1f1' }
const detailLabel = { color: '#6b7280', fontSize: '14px', padding: '8px 0', width: '45%' }
const detailValue = { color: '#141414', fontSize: '14px', fontWeight: '600' as const, padding: '8px 0', textAlign: 'right' as const }
const unlockItem = { color: '#374151', fontSize: '14px', lineHeight: '22px', margin: '2px 0' }
const cta = { ...brand.button, background: 'linear-gradient(90deg, #e50914, #00a3e0)', padding: '14px 32px', borderRadius: '999px', fontSize: '15px' }
