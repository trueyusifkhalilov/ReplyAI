const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { superAdminMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/companies', superAdminMiddleware, async (req, res) => {
  const companies = await prisma.company.findMany({
    include: { profile: true, _count: { select: { messages: true } } }
  });
  res.json(companies);
});

router.put('/companies/:id', superAdminMiddleware, async (req, res) => {
  const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
  res.json(company);
});

router.delete('/companies/:id', superAdminMiddleware, async (req, res) => {
  await prisma.company.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get('/stats', superAdminMiddleware, async (req, res) => {
  const [companies, messages, escalated] = await Promise.all([
    prisma.company.count(),
    prisma.message.count(),
    prisma.message.count({ where: { escalated: true } }),
  ]);
  res.json({ companies, messages, escalated });
});

router.get('/config', superAdminMiddleware, async (req, res) => {
  const configs = await prisma.systemConfig.findMany();
  res.json(Object.fromEntries(configs.map(c => [c.key, c.value])));
});

router.put('/config', superAdminMiddleware, async (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    await prisma.systemConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  res.json({ ok: true });
});

module.exports = router;
