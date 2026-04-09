const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSystemKeys() {
  const [claudeKey, openaiKey] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'ANTHROPIC_API_KEY' } }),
    prisma.systemConfig.findUnique({ where: { key: 'OPENAI_API_KEY' } }),
  ]);
  return {
    anthropic: claudeKey?.value || process.env.ANTHROPIC_API_KEY,
    openai: openaiKey?.value || process.env.OPENAI_API_KEY,
  };
}

async function classifyMessage(text) {
  const intents = {
    faq: ['qiymət', 'nədir', 'var', 'çatdırılır', 'necə', 'harada', 'zəmanət', 'price', 'how', 'what', 'цена', 'как'],
    complaint: ['gəlmədi', 'xarab', 'problem', 'şikayət', 'pis', 'yanlış', 'didn\'t', 'broken', 'wrong', 'не пришёл'],
    lead: ['almaq', 'sifariş', 'istəyirəm', 'buy', 'order', 'want', 'купить', 'заказать'],
    booking: ['rezerv', 'görüş', 'vaxt', 'book', 'appointment', 'записаться'],
    greeting: ['salam', 'hello', 'hi', 'привет', 'hey'],
  };
  const lower = text.toLowerCase();
  for (const [cat, words] of Object.entries(intents)) {
    if (words.some(w => lower.includes(w))) {
      return { category: cat, confidence: 'high', language: detectLang(lower) };
    }
  }
  return { category: 'unclear', confidence: 'low', language: detectLang(lower) };
}

function detectLang(text) {
  if (/[а-яё]/i.test(text)) return 'ru';
  if (/[əğışüöçÇŞİÖÜĞƏ]/i.test(text)) return 'az';
  return 'en';
}

async function generateReply({ text, classification, profile, faqs, company }) {
  const faqText = faqs.map(f => `S: ${f.question}\nC: ${f.answer}`).join('\n');
  const systemPrompt = `${profile.systemPrompt || `Sən ${company.name} şirkətinin AI müştəri xidməti assistanısan.`}

Ton: ${profile.tone === 'friendly' ? 'Dostcasına, isti' : profile.tone === 'formal' ? 'Rəsmi, peşəkar' : 'Qeyri-rəsmi, rahat'}
Emoji: ${profile.useEmoji ? 'Az miqdarda emoji istifadə et' : 'Emoji istifadə etmə'}
İmza: "${profile.signOff}" - hər cavabın sonuna əlavə et
Dil: Müştərinin dilində cavab ver (az/ru/en)
İş saatları: ${profile.workHours}

FAQ Bazası:
${faqText || 'Ümumi məlumat ver, uydurmaq olmaz.'}

Qısa (2-4 cümlə), dəqiq, mehriban cavab ver.`;

  const keys = await getSystemKeys();

  if (company.aiEngine === 'claude') {
    const anthropic = new Anthropic({ apiKey: keys.anthropic });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }]
    });
    return response.content[0].text;
  } else {
    const openai = new OpenAI({ apiKey: keys.openai });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ]
    });
    return response.choices[0].message.content;
  }
}

async function shouldEscalate(classification, text, profile) {
  if (!profile.autoEscalate) return false;
  if (classification.category === 'complaint') return true;
  const legalWords = ['vəkil', 'məhkəmə', 'hüquq', 'lawyer', 'court', 'юрист', 'суд'];
  if (legalWords.some(w => text.toLowerCase().includes(w))) return true;
  return false;
}

async function sendEscalationWebhook({ profile, company, message, classification, autoReply }) {
  if (!profile.escWebhookUrl) return;
  try {
    await require('axios').post(profile.escWebhookUrl, {
      event: 'escalation',
      company: company.name,
      platform: message.platform,
      sender: message.senderName,
      text: message.text,
      classification,
      autoReplySent: !!autoReply,
      autoReplyText: autoReply,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
}

module.exports = { classifyMessage, generateReply, shouldEscalate, sendEscalationWebhook };
