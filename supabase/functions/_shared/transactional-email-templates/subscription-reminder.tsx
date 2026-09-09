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
    <Body style={brand.main}>
      <Container style={brand.container}>
        <BrandHeader />
        <Section style={brand.content}>
          <Heading style={brand.h1}>Your access expires soon</Heading>
          <Text style={brand.text}>
            Hi {name}, your <strong>{planName}</strong> ends in <strong>{daysLeft} day(s)</strong>
            {expiresOn ? ` — on ${expiresOn}` : ''}.
          </Text>
          <Section style={brand.box}>
            {amountUsd ? <Text style={brand.row}><strong>Renewal (USD):</strong> {amountUsd}</Text> : null}
            {amountLocal ? <Text style={brand.row}><strong>In your currency:</strong> {amountLocal}</Text> : null}
          </Section>
          <Text style={brand.text}>
            <Link href={dashboardUrl} style={brand.button}>Renew now</Link>
          </Text>
          <Text style={brand.text}>
            Renewing keeps your streaming links, live sports links and download tools active:{' '}
            <Link href={dashboardUrl} style={brand.link}>{dashboardUrl}</Link>
          </Text>
          <Hr style={brand.hr} />
          <Text style={brand.footer}>You get a 3-day grace period after expiry before access is locked.</Text>
        </Section>
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
