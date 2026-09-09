/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Img, Section, Text } from 'npm:@react-email/components@0.0.22'

export const LOGO_URL = 'https://streamnetmirror.app/logo-hexagon.png'
export const SITE_URL = 'https://streamnetmirror.app'

/** Branded header band used by every app email. */
export const BrandHeader = () => (
  <Section style={header}>
    <Img src={LOGO_URL} width="40" height="40" alt="StreamNet Mirror" style={logo} />
    <Text style={wordmark}>STREAMNETMIRROR</Text>
  </Section>
)

export const brand = {
  main: { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' },
  container: { margin: '0 auto', padding: '0 0 24px', maxWidth: '560px' },
  content: { padding: '0 24px' },
  h1: { color: '#141414', fontSize: '24px', fontWeight: '700' as const, margin: '24px 0 12px' },
  text: { color: '#4b4b4b', fontSize: '15px', lineHeight: '24px' },
  row: { color: '#4b4b4b', fontSize: '14px', lineHeight: '22px', margin: '2px 0' },
  box: { backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '12px 16px' },
  link: { color: '#e50914' },
  button: {
    backgroundColor: '#e50914',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700' as const,
    borderRadius: '6px',
    padding: '12px 22px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  hr: { borderColor: '#e5e5e5', margin: '20px 0' },
  footer: { color: '#8a8a8a', fontSize: '12px', lineHeight: '18px' },
}

const header = { backgroundColor: '#0b0b0b', padding: '18px 24px' }
const logo = { display: 'inline-block', verticalAlign: 'middle' as const, borderRadius: '8px' }
const wordmark = {
  display: 'inline-block',
  verticalAlign: 'middle' as const,
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700' as const,
  letterSpacing: '1px',
  margin: '0 0 0 10px',
}
