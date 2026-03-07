import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '../lib/supabase'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
