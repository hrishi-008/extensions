import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import Razorpay from 'razorpay'

// Initialize Stripe (placeholder key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16' as any,
})

// Initialize Razorpay (placeholder keys)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tier = searchParams.get('tier')
  const region = searchParams.get('region')

  if (!tier) return NextResponse.json({ error: 'Missing tier' }, { status: 400 })

  // 1. Logic for Razorpay (India)
  if (region === 'IN') {
    // In a real app, you'd create a Subscription/Order here
    // and return the Razorpay checkout URL or order ID
    console.log(`[Checkout] Routing ${tier} to Razorpay`);
    // Redirect to a placeholder successful payment for demo
    return NextResponse.redirect(new URL('/dashboard?status=success&gateway=razorpay', req.url))
  }

  // 2. Logic for Stripe (Global)
  try {
    console.log(`[Checkout] Routing ${tier} to Stripe`);
    // Create Stripe Session
    // const session = await stripe.checkout.sessions.create({ ... })
    // return NextResponse.redirect(session.url)
    
    // Mocking successful redirect
    return NextResponse.redirect(new URL('/dashboard?status=success&gateway=stripe', req.url))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
