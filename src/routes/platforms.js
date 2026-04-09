// routes/platforms.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/', authMiddleware, async (req, res) => {
  const platforms = await prisma.platformConnection.findMany({ where: { companyId: req.user.companyId } });
  res.json(platforms);
});

router.post('/', authMiddleware, async (req, res) => {
  const existing = await prisma.platformConnection.findFirst({
    where: { companyId: req.user.companyId, platform: req.body.platform }
  });
  const data = { companyId: req.user.companyId, ...req.body };
  const conn = existing
    ? await prisma.platformConnection.update({ where: { id: existing.id }, data })
    : await prisma.platformConnection.create({ data });
  res.json(conn);
});

module.exports = router;
