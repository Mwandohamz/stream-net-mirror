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
    <Body style={brand.main}>
      <Container style={brand.container}>
        <BrandHeader />
        <Section style={brand.content}>
          <Heading style={brand.h1}>Your access has expired</Heading>
          <Text style={brand.text}>
            Hi {name}, your <strong>{planName}</strong> expired{expiredOn ? ` on ${expiredOn}` : ''}.
            You have a {graceDays}-day grace period before your links stop working.
          </Text>
          <Text style={brand.text}>
            <Link href={dashboardUrl} style={brand.button}>Renew my access</Link>
          </Text>
          <Text style={brand.text}>
            Or open your dashboard directly:{' '}
            <Link href={dashboardUrl} style={brand.link}>{dashboardUrl}</Link>
          </Text>
          <Hr style={brand.hr} />
          <Text style={brand.footer}>Need help? Open a support ticket from inside your dashboard.</Text>
        </Section>
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
