require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const messageRoutes = require('./routes/messages');
const chatbotRoutes = require('./routes/chatbot');
const sourceRoutes = require('./routes/sources');
const platformRoutes = require('./routes/platforms');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/superadmin');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/admin', adminRoutes);
app.use('/webhook', webhookRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`ReplyAI backend running on port ${PORT}`));
