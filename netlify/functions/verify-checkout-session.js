exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Stripe secret key' }),
    };
  }

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing session id' }),
    };
  }

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Unable to verify Stripe payment' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
        payment_status: data.payment_status,
        amount_total: data.amount_total,
        customer_email: data.customer_details?.email || data.customer_email || '',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe verification failed' }),
    };
  }
};
