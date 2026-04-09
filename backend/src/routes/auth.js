const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Şirkət qeydiyyatı
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, aiEngine } = req.body;
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Bu e-poçt artıq mövcuddur' });

    const hashed = await bcrypt.hash(password, 10);
    const company = await prisma.company.create({
      data: {
        name, email, password: hashed,
        aiEngine: aiEngine || 'claude',
        profile: {
          create: {
            signOff: `${name} komandası`,
            systemPrompt: `Sən ${name} şirkətinin AI müştəri xidməti assistanısan. Müştərilərə kömək et.`
          }
        }
      }
    });

    const token = jwt.sign(
      { companyId: company.id, role: 'admin', name: company.name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, company: { id: company.id, name: company.name, email: company.email } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Giriş
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Super admin
    if (email === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, role: 'superadmin' });
    }

    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) return res.status(400).json({ error: 'E-poçt və ya şifrə yanlışdır' });

    const valid = await bcrypt.compare(password, company.password);
    if (!valid) return res.status(400).json({ error: 'E-poçt və ya şifrə yanlışdır' });

    if (!company.isActive) return res.status(403).json({ error: 'Hesabınız deaktivdir' });

    const token = jwt.sign(
      { companyId: company.id, role: 'admin', name: company.name },
      process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, role: 'admin', company: { id: company.id, name: company.name, aiEngine: company.aiEngine } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
