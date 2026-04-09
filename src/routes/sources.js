// routes/sources.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req, res) => {
  const [faqs, sources] = await Promise.all([
    prisma.fAQ.findMany({ where: { companyId: req.user.companyId } }),
    prisma.source.findMany({ where: { companyId: req.user.companyId } }),
  ]);
  res.json({ faqs, sources });
});

router.post('/faq', authMiddleware, async (req, res) => {
  const faq = await prisma.fAQ.create({
    data: { companyId: req.user.companyId, question: req.body.question, answer: req.body.answer, tags: req.body.tags || '' }
  });
  res.json(faq);
});

router.put('/faq/:id', authMiddleware, async (req, res) => {
  const faq = await prisma.fAQ.update({ where: { id: req.params.id }, data: req.body });
  res.json(faq);
});

router.delete('/faq/:id', authMiddleware, async (req, res) => {
  await prisma.fAQ.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post('/url', authMiddleware, async (req, res) => {
  const source = await prisma.source.create({
    data: { companyId: req.user.companyId, type: 'url', label: req.body.url, content: req.body.url }
  });
  res.json(source);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.source.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
