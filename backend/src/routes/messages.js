const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { companyId: req.user.companyId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(messages);
});

router.put('/:id/send', authMiddleware, async (req, res) => {
  const msg = await prisma.message.update({
    where: { id: req.params.id },
    data: { status: 'sent', deliveryStatus: 'sent' }
  });
  res.json(msg);
});

router.put('/:id/reply', authMiddleware, async (req, res) => {
  const msg = await prisma.message.update({
    where: { id: req.params.id },
    data: { aiReply: req.body.reply }
  });
  res.json(msg);
});

module.exports = router;
