export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'No reCAPTCHA token provided' });
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY environment variable is not set');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    // data.score: 1.0 is very likely human, 0.0 is very likely bot
    // action should match what we passed in grecaptcha.execute()
    const passed =
      data.success === true &&
      data.action === 'signup' &&
      data.score >= 0.5;

    return res.status(200).json({
      success: passed,
      score: data.score ?? null,
    });

  } catch (err) {
    console.error('reCAPTCHA verify error:', err);
    return res.status(500).json({ success: false, error: 'Verification request failed' });
  }
}
