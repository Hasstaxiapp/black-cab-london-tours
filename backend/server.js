
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MongoClient } = require('mongodb');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);
let bookingsCollection;
client.connect().then(() => {
  const db = client.db('blackcab');
  bookingsCollection = db.collection('bookings');
  console.log('Connected to MongoDB');
});

// Helper: Calculate Distance via Google Maps API
async function getDistance(pickup, dropoff) {
  const url = \`https://maps.googleapis.com/maps/api/distancematrix/json?origins=\${encodeURIComponent(pickup)}&destinations=\${encodeURIComponent(dropoff)}&key=\${process.env.GOOGLE_MAPS_API_KEY}\`;
  const res = await axios.get(url);
  const meters = res.data.rows[0].elements[0].distance.value;
  return meters / 1609.34; // meters to miles
}

// Checkout route
app.post('/api/checkout', async (req, res) => {
  const { pickup, dropoff, datetime, rideType, flightNumber } = req.body;
  const miles = await getDistance(pickup, dropoff);
  let amount;

  if (rideType === 'airport') {
    amount = (6 + 4.2 + 5.5 * miles);
  } else {
    amount = 75; // fixed tour price
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: {
          name: rideType === 'airport' ? 'Airport Transfer' : 'London Tour',
        },
        unit_amount: Math.round(amount * 100), // in pence
      },
      quantity: 1,
    }],
    success_url: \`\${process.env.NEXT_PUBLIC_SITE_URL}/success.html\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_SITE_URL}/booking.html\`,
    metadata: { pickup, dropoff, datetime, rideType, flightNumber, miles: miles.toFixed(2), amount },
  });

  res.json({ url: session.url });
});

// Webhook simulation (or used in client after success)
app.post('/api/book', async (req, res) => {
  const booking = req.body;
  await bookingsCollection.insertOne(booking);
  res.json({ success: true });
});

// Email logic using Resend API
app.post('/api/email', async (req, res) => {
  const { to, subject, body } = req.body;
  await axios.post('https://api.resend.com/emails', {
    from: 'info@blackcabtours.co.uk',
    to,
    subject,
    html: body,
  }, {
    headers: { Authorization: \`Bearer \${process.env.RESEND_API_KEY}\` }
  });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
