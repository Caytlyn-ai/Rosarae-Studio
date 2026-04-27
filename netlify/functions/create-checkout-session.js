exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const {
    orderTitle,
    orderTotal,
    orderDetails,
    customer,
    siteUrl,
  } = payload;

  const totalCents = Math.round(Number(String(orderTotal || '0').replace(/[^0-9.]/g, '')) * 100);
  if (!orderTitle || !siteUrl || !totalCents || totalCents < 50) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing order information' }),
    };
  }

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${siteUrl}/payment.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${siteUrl}/payment.html?checkout=cancel`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][unit_amount]', String(totalCents));
  params.append('line_items[0][price_data][product_data][name]', orderTitle);
  params.append('line_items[0][price_data][product_data][description]', Array.isArray(orderDetails) ? orderDetails.join(' | ').slice(0, 500) : 'Rosarae Studio order');

  if (customer?.email) {
    params.append('customer_email', customer.email);
  }

  params.append('metadata[order_title]', orderTitle);
  params.append('metadata[customer_name]', customer?.name || '');
  params.append('metadata[source_page]', payload.sourcePage || '');

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Unable to create Stripe Checkout session' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.url, id: data.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe request failed' }),
    };
  }
};
