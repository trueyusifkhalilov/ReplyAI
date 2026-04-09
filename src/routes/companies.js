// routes/companies.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/profile', authMiddleware, async (req, res) => {
  const profile = await prisma.companyProfile.findUnique({ where: { companyId: req.user.companyId } });
  const company = await prisma.company.findUnique({ where: { id: req.user.companyId } });
  res.json({ ...company, profile });
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { name, aiEngine, tone, useEmoji, signOff, workHours, systemPrompt, escEmail, escWhatsapp, escWebhookUrl, autoReply, autoEscalate } = req.body;
  await prisma.company.update({ where: { id: req.user.companyId }, data: { name, aiEngine } });
  const profile = await prisma.companyProfile.update({
    where: { companyId: req.user.companyId },
    data: { tone, useEmoji, signOff, workHours, systemPrompt, escEmail, escWhatsapp, escWebhookUrl, autoReply, autoEscalate }
  });
  res.json(profile);
});

router.get('/analytics', authMiddleware, async (req, res) => {
  const companyId = req.user.companyId;
  const [total, replied, escalated] = await Promise.all([
    prisma.message.count({ where: { companyId } }),
    prisma.message.count({ where: { companyId, status: 'replied' } }),
    prisma.message.count({ where: { companyId, escalated: true } }),
  ]);
  const byIntent = await prisma.message.groupBy({ by: ['intent'], where: { companyId }, _count: true });
  res.json({ total, replied, escalated, autoRate: total ? Math.round((replied / total) * 100) : 0, byIntent });
});

module.exports = router;
