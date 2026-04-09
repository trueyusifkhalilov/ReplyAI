const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { classifyMessage, generateReply, shouldEscalate, sendEscalationWebhook } = require('../services/ai');

const prisma = new PrismaClient();

// Ana pipeline endpointi — widget və admin test üçün
router.post('/chat', authMiddleware, async (req, res) => {
  const { text, platform = 'web', senderName = 'Müştəri' } = req.body;
  const companyId = req.user.companyId;

  try {
    const [company, profile, faqs] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.companyProfile.findUnique({ where: { companyId } }),
      prisma.fAQ.findMany({ where: { companyId } }),
    ]);

    // 1. Classify
    const classification = await classifyMessage(text);

    // 2. Generate reply
    let aiReply = null;
    const escalate = await shouldEscalate(classification, text, profile);

    if (classification.category !== 'spam') {
      aiReply = await generateReply({ text, classification, profile, faqs, company });
    }

    // 3. Save message
    const message = await prisma.message.create({
      data: {
        companyId, platform, text, senderName,
        intent: classification.category,
        intentConf: classification.confidence,
        language: classification.language,
        aiReply,
        escalated: escalate,
        status: escalate ? 'escalated' : 'replied'
      }
    });

    // 4. Escalation webhook
    if (escalate) {
      await sendEscalationWebhook({ profile, company, message, classification, autoReply: aiReply });
    }

    res.json({
      messageId: message.id,
      classification,
      aiReply,
      escalated: escalate,
      pipeline: {
        connector: 'done',
        classifier: classification.category,
        context: company.name,
        generator: company.aiEngine,
        delivery: 'done'
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public widget endpoint (API key ilə)
router.post('/widget/:companyId', async (req, res) => {
  const { text, senderName = 'Widget müştəri' } = req.body;
  const { companyId } = req.params;

  try {
    const [company, profile, faqs] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.companyProfile.findUnique({ where: { companyId } }),
      prisma.fAQ.findMany({ where: { companyId } }),
    ]);

    if (!company || !company.isActive) return res.status(404).json({ error: 'Şirkət tapılmadı' });

    const classification = await classifyMessage(text);
    const escalate = await shouldEscalate(classification, text, profile);
    const aiReply = classification.category !== 'spam'
      ? await generateReply({ text, classification, profile, faqs, company })
      : null;

    await prisma.message.create({
      data: {
        companyId, platform: 'widget', text, senderName,
        intent: classification.category,
        intentConf: classification.confidence,
        language: classification.language,
        aiReply, escalated: escalate,
        status: escalate ? 'escalated' : 'replied'
      }
    });

    res.json({ reply: aiReply, escalated: escalate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
