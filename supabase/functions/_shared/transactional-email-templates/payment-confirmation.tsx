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
    <Body style={brand.main}>
      <Container style={brand.container}>
        <BrandHeader />
        <Section style={brand.content}>
          <Heading style={brand.h1}>Payment confirmed</Heading>
          <Text style={brand.text}>Hi {name}, your payment went through and your access is now active.</Text>

          <Section style={brand.box}>
            <Text style={brand.row}><strong>Plan:</strong> {planName}</Text>
            <Text style={brand.row}><strong>Amount (USD):</strong> {amountUsd}</Text>
            {amountLocal ? <Text style={brand.row}><strong>Amount charged:</strong> {amountLocal}</Text> : null}
            {renewsOn ? <Text style={brand.row}><strong>Next payment due:</strong> {renewsOn}</Text> : null}
            {reference ? <Text style={brand.row}><strong>Reference:</strong> {reference}</Text> : null}
          </Section>

          {categories.length > 0 && (
            <>
              <Text style={brand.text}><strong>What you unlocked</strong></Text>
              {categories.map((c) => (
                <Text key={c} style={brand.row}>• {c}</Text>
              ))}
            </>
          )}

          <Text style={brand.text}>
            <Link href={dashboardUrl} style={brand.button}>Open my dashboard</Link>
          </Text>
          <Text style={brand.text}>
            Your dashboard has your streaming links, app downloads and setup guides:{' '}
            <Link href={dashboardUrl} style={brand.link}>{dashboardUrl}</Link>
          </Text>

          <Hr style={brand.hr} />
          <Text style={brand.footer}>
            StreamNet Mirror provides verified access links to third-party streaming platforms.
            Keep this email as your receipt.
          </Text>
        </Section>
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
