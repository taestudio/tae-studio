import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: service } = await supabase
      .from('services')
      .select('stripe_price_id')
      .eq('slug', 'strategy-desk')
      .maybeSingle();

    if (!service?.stripe_price_id) {
      return new Response(JSON.stringify({ hasAccess: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: orders } = await supabase
      .from('stripe_orders')
      .select('id, checkout_session_id')
      .eq('customer_email', normalizedEmail)
      .eq('price_id', service.stripe_price_id)
      .eq('status', 'completed')
      .is('deleted_at', null)
      .limit(1);

    const hasAccess = (orders?.length ?? 0) > 0;
    const checkoutSessionId = orders?.[0]?.checkout_session_id ?? null;

    return new Response(JSON.stringify({ hasAccess, checkoutSessionId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('verify-desk-access error:', err);
    return new Response(JSON.stringify({ hasAccess: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
