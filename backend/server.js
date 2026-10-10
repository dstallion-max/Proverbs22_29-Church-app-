const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Webhook } = require('standardwebhooks');

const app = express();
app.use(bodyParser.text({ type: 'application/json' }));

const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY;
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;
const SUPABASE_HOOK_SECRET = process.env.SUPABASE_HOOK_SECRET;

// Health check
app.get('/', (req, res) => {
  res.send('Heghizbah SMS Hook is running');
});

// Env check (no secrets exposed)
app.get('/env-check', (req, res) => {
  res.json({
    textbee_key_loaded: !!TEXTBEE_API_KEY,
    textbee_device_loaded: !!TEXTBEE_DEVICE_ID,
    supabase_secret_loaded: !!SUPABASE_HOOK_SECRET,
    textbee_key_preview: TEXTBEE_API_KEY ? TEXTBEE_API_KEY.slice(0, 8) + '...' : 'missing',
    device_preview: TEXTBEE_DEVICE_ID ? TEXTBEE_DEVICE_ID.slice(0, 8) + '...' : 'missing'
  });
});

// Hook Supabase calls
app.post('/hooks/send-sms', async (req, res) => {
  try {
    console.log('=== Hook received ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    const payload = req.body;
    const headers = req.headers;

    const secret = SUPABASE_HOOK_SECRET.replace('v1,whsec_', '');
    const wh = new Webhook(secret);
    const { user, sms } = wh.verify(payload, headers);

    const phone = user.phone;
    const otp = sms.otp;

    console.log(`Sending OTP ${otp} to ${phone}`);

    const response = await axios.post(
      'https://api.textbee.dev/api/v1/gateway/send-sms',
      {
        recipients: [phone],
        message: `Your Hephzibah code is: ${otp}`,
        deviceId: TEXTBEE_DEVICE_ID,
      },
      {
        headers: {
          'x-api-key': TEXTBEE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('TextBee response:', response.data);

    // Fix the Content-Type error Supabase was complaining about
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('SMS Hook Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SMS Hook running on port ${PORT}`));