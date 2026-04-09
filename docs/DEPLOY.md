# ReplyAI — Deploy Təlimatı

## Qısa baxış: Nə istifadə edirik?

| Hissə       | Texnologiya         | Deploy yeri          | Pulsuz plan |
|-------------|---------------------|----------------------|-------------|
| Backend     | Node.js + Express   | Railway / Render     | Bəli        |
| Database    | PostgreSQL          | Railway / Supabase   | Bəli        |
| Frontend    | Next.js             | Vercel               | Bəli        |
| AI          | Claude / GPT-4o     | Anthropic / OpenAI   | Yox         |

---

## ADDIM 1 — Kodu GitHub-a yüklə

```bash
# GitHub-da yeni repo yarat: replyai
git init
git remote add origin https://github.com/SENIN_ADIN/replyai.git
git add .
git commit -m "Initial commit"
git push origin main
```

---

## ADDIM 2 — Verilənlər bazası (Railway — Pulsuz)

1. https://railway.app saytına gir, GitHub ilə qeydiyyatdan keç
2. "New Project" → "PostgreSQL" seç
3. Database yarandıqdan sonra "Connect" tab-ına keç
4. `DATABASE_URL` dəyərini kopyala — belə görünür:
   ```
   postgresql://postgres:password@host.railway.app:5432/railway
   ```

---

## ADDIM 3 — Backend Deploy (Railway)

1. Railway-də "New Service" → "GitHub Repo" → `replyai/backend` seç
2. "Environment Variables" bölməsinə bu dəyişənləri əlavə et:

```
DATABASE_URL          = (2-ci addımdan kopyaladığın URL)
JWT_SECRET            = herhangi-uzun-bir-sirre-yazin-buraya
ANTHROPIC_API_KEY     = sk-ant-... (https://console.anthropic.com)
OPENAI_API_KEY        = sk-...    (https://platform.openai.com — istəyə görə)
SUPER_ADMIN_EMAIL     = superadmin@replyai.az
SUPER_ADMIN_PASSWORD  = Guclu_Sifre_123!
WEBHOOK_VERIFY_TOKEN  = herhangi-bir-token-yaz
FRONTEND_URL          = https://replyai.vercel.app
PORT                  = 4000
```

3. "Deploy" düyməsinə bas
4. Deploy bitdikdən sonra "Settings" → "Domains" → URL-i kopyala:
   `https://replyai-backend.up.railway.app`

5. **Database migration işlət:**
   Railway dashboard-da backend servisinin "Shell" tab-ına keç:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## ADDIM 4 — Frontend Deploy (Vercel — Pulsuz)

1. https://vercel.com saytına gir, GitHub ilə qeydiyyat
2. "New Project" → `replyai/frontend` repo-nu seç
3. "Environment Variables" əlavə et:
   ```
   NEXT_PUBLIC_API_URL = https://replyai-backend.up.railway.app/api
   ```
4. "Deploy" düyməsinə bas
5. Vercel sənə URL verəcək: `https://replyai.vercel.app`

---

## ADDIM 5 — İlk daxil olma

Tarayıcıda frontend URL-ə keç:
- **Super admin:** `superadmin@replyai.az` / `Guclu_Sifre_123!`
- **Yeni şirkət qeydiyyatı:** "Qeydiyyat" düyməsinə bas

---

## ADDIM 6 — WhatsApp inteqrasiyası (Meta Developer)

1. https://developers.facebook.com — yeni app yarat
2. "WhatsApp" məhsulunu əlavə et
3. Webhook URL-i daxil et:
   ```
   https://replyai-backend.up.railway.app/webhook/whatsapp/BIZ_ID
   ```
   `BIZ_ID` — admin panelindəki şirkət ID-si (URL-dən)
4. Verify token: `.env`-dəki `WEBHOOK_VERIFY_TOKEN`

---

## ADDIM 7 — Sayta embed widget (İstəyə görə)

Admin panelindən embed kodunu kopyala və saytının `</body>` -dən əvvəl əlavə et:

```html
<script>
  window.ReplyAI = {
    bizId: "SENIN_BIZ_ID",
    apiUrl: "https://replyai-backend.up.railway.app/api"
  };
</script>
<script src="https://replyai-backend.up.railway.app/widget.js"></script>
```

---

## Alternativ Deploy seçimləri

### Render.com (Railway alternativ)
- https://render.com → "New Web Service" → GitHub repo
- Eyni environment variable-ları əlavə et
- Free plan: 750 saat/ay

### Supabase (Database alternativ)
- https://supabase.com → "New Project"
- "Project Settings" → "Database" → Connection string kopyala

### DigitalOcean (Ödənişli, daha güclü)
- $6/ay Droplet + Managed PostgreSQL
- Backend: `pm2` ilə idarə
- Frontend: Nginx ilə serve et

---

## Faylların strukturu

```
replyai/
├── backend/
│   ├── src/
│   │   ├── index.js              ← Server başlanğıcı
│   │   ├── middleware/auth.js    ← JWT yoxlama
│   │   ├── routes/
│   │   │   ├── auth.js           ← Login/register
│   │   │   ├── chatbot.js        ← Ana AI pipeline
│   │   │   ├── messages.js       ← Gələn qutu
│   │   │   ├── sources.js        ← FAQ + URL mənbələr
│   │   │   ├── platforms.js      ← Platform bağlantıları
│   │   │   ├── webhooks.js       ← WhatsApp/IG/FB webhook
│   │   │   ├── companies.js      ← Şirkət profili
│   │   │   └── superadmin.js     ← Super admin
│   │   └── services/ai.js        ← Claude + GPT logic
│   ├── prisma/schema.prisma      ← Database sxemi
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── lib/api.js            ← API client
    │   └── pages/               ← Next.js pages
    ├── .env.example
    └── package.json
```

---

## Xərc hesabı (aylıq)

| Xidmət            | Pulsuz plan         | Ödənişli          |
|-------------------|---------------------|-------------------|
| Railway (backend) | $5 kredit/ay        | $5–20/ay          |
| Vercel (frontend) | Tamamilə pulsuz     | $0                |
| Anthropic Claude  | Yox                 | ~$0.003/mesaj     |
| OpenAI GPT-4o     | Yox                 | ~$0.005/mesaj     |

**1000 mesaj/ay üçün təxmini xərc: $3–8**
