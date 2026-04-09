const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { classifyMessage, generateReply, shouldEscalate, sendEscalationWebhook } = require('../services/ai');
const prisma = new PrismaClient();

async function processPlatformMessage({ companyId, platform, text, senderName, senderId }) {
  const [company, profile, faqs] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.companyProfile.findUnique({ where: { companyId } }),
    prisma.fAQ.findMany({ where: { companyId } }),
  ]);
  if (!company) return null;

  const classification = await classifyMessage(text);
  const escalate = await shouldEscalate(classification, text, profile);
  const aiReply = profile.autoReply && classification.category !== 'spam'
    ? await generateReply({ text, classification, profile, faqs, company })
    : null;

  const message = await prisma.message.create({
    data: {
      companyId, platform, text, senderName, senderId,
      intent: classification.category,
      intentConf: classification.confidence,
      language: classification.language,
      aiReply, escalated: escalate,
      status: aiReply ? 'replied' : 'pending'
    }
  });

  if (escalate) await sendEscalationWebhook({ profile, company, message, classification, autoReply: aiReply });
  return { aiReply, classification, escalate };
}

// WhatsApp webhook verification
router.get('/whatsapp/:companyId', (req, res) => {
  const token = req.query['hub.verify_token'];
  if (token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// WhatsApp incoming messages
router.post('/whatsapp/:companyId', async (req, res) => {
  res.sendStatus(200);
  try {
    const companyId = req.params.companyId;
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages?.[0]) return;
    const msg = value.messages[0];
    const contact = value.contacts?.[0];
    if (msg.type !== 'text') return;

    await processPlatformMessage({
      companyId, platform: 'whatsapp',
      text: msg.text.body,
      senderName: contact?.profile?.name || msg.from,
      senderId: msg.from
    });
  } catch (e) {
    console.error('WhatsApp webhook error:', e.message);
  }
});

// Instagram/Facebook webhook
router.get('/meta/:companyId', (req, res) => {
  const token = req.query['hub.verify_token'];
  if (token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

router.post('/meta/:companyId', async (req, res) => {
  res.sendStatus(200);
  try {
    const companyId = req.params.companyId;
    const messaging = req.body?.entry?.[0]?.messaging?.[0];
    if (!messaging?.message?.text) return;

    await processPlatformMessage({
      companyId,
      platform: req.body.object === 'instagram' ? 'instagram' : 'facebook',
      text: messaging.message.text,
      senderName: messaging.sender?.id,
      senderId: messaging.sender?.id
    });
  } catch (e) {
    console.error('Meta webhook error:', e.message);
  }
});

module.exports = router;
