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
  /** Subject is passed through so admins can edit it before sending. */
  subject?: string
  name?: string
  heading?: string
  /** Free-form body. Blank lines start a new paragraph. */
  body?: string
  ctaLabel?: string
  ctaUrl?: string
}

/**
 * Generic branded account email. The admin dashboard renders this with an
 * editable subject and body so any announcement, reminder or notice can be
 * sent without adding a new template.
 */
export const AccountNoticeEmail = ({
  name = 'there',
  heading = 'A message from StreamNet Mirror',
  body = '',
  ctaLabel = 'Open my dashboard',
  ctaUrl = 'https://streamnetmirror.app/dashboard',
  subject = 'A message from StreamNet Mirror',
}: Props) => {
  const paragraphs = String(body || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={brand.main}>
        <Container style={brand.container}>
          <BrandHeader />
          <Section style={brand.content}>
            <Heading style={brand.h1}>{heading}</Heading>
            <Text style={brand.text}>Hi {name},</Text>
            {paragraphs.map((p, i) => (
              <Text key={i} style={brand.text}>{p}</Text>
            ))}
            {ctaUrl ? (
              <Text style={brand.text}>
                <Link href={ctaUrl} style={brand.button}>{ctaLabel}</Link>
              </Text>
            ) : null}
            <Hr style={brand.hr} />
            <Text style={brand.footer}>
              You are receiving this because you have a StreamNet Mirror account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AccountNoticeEmail,
  subject: (d: Record<string, any>) => d?.subject || 'A message from StreamNet Mirror',
  displayName: 'Account notice',
  previewData: {
    name: 'Mwando',
    heading: 'A message from StreamNet Mirror',
    body: 'We refreshed the streaming links in your dashboard.\n\nSign in any time to grab the latest one.',
    ctaLabel: 'Open my dashboard',
    ctaUrl: 'https://streamnetmirror.app/dashboard',
    subject: 'Your links were refreshed',
  },
} satisfies TemplateEntry
