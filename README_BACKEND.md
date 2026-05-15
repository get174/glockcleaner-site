# GlockCleaner Backend

Backend sécurisé pour la gestion des licences PayPal pour l'application Electron GlockCleaner.

## Fonctionnalités

- ✅ Webhook PayPal sécurisé avec vérification de signature
- ✅ Génération automatique de licences uniques
- ✅ Stockage sécurisé en base de données (Supabase/PostgreSQL)
- ✅ API de vérification de licence
- ✅ Sécurité complète : rate limiting, helmet, validation
- ✅ Envoi automatique de licence par email
- ✅ Endpoints admin pour gestion des licences

## Configuration

1. Copier `.env.example` vers `.env` et remplir les variables :

```bash
cp .env.example .env
```

Remplir :
- `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` depuis les settings Supabase
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` depuis PayPal Developer
- `PAYPAL_WEBHOOK_ID` : ID du webhook créé dans PayPal
- Config SMTP pour l'email
- `ADMIN_API_KEY` : clé secrète pour les endpoints admin

2. Exécuter la migration Supabase :
   - Aller dans Supabase Dashboard > SQL Editor
   - Exécuter le contenu de `supabase/migrations/002_licenses.sql`

3. Configurer le webhook PayPal :
   - Dans PayPal Developer, créer un webhook pointant vers `https://votredomaine.com/api/webhook/paypal`
   - Événements : `PAYMENT.CAPTURE.COMPLETED`

## Démarrage

```bash
npm run dev:server
```

## Endpoints

### Public
- `POST /api/verify-license` : Vérifie une licence
  - Body: `{ "licenseKey": "GLC-XXXX-XXXX-XXXX" }`
  - Response: `{ "valid": true/false }`

### Webhook
- `POST /api/webhook/paypal` : Traite les webhooks PayPal

### Admin (nécessite header `x-api-key`)
- `GET /api/admin/licenses` : Liste toutes les licences
- `POST /api/admin/revoke` : Révoque une licence
  - Body: `{ "licenseKey": "GLC-XXXX-XXXX-XXXX" }`

## Sécurité

- Vérification stricte des signatures PayPal
- Rate limiting (100 req/15min par IP)
- Helmet pour headers de sécurité
- Logs des tentatives suspectes
- Clés de licence cryptographiquement sécurisées
- RLS activé sur la DB

## Production

- Utiliser HTTPS obligatoire
- Variables d'environnement sécurisées
- Monitoring des logs
- Backup régulier de la DB