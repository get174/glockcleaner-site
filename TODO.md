TODO - Stripe API testing

## Plan approuvé
- [x] Confirmer scope Stripe-only (pas de création d'endpoints PayPal)
- [ ] Tester `POST /api/stripe/create-payment-intent` (happy path + erreurs)
- [ ] Tester `POST /api/stripe/webhook` (event valide + erreurs de signature)
- [ ] Vérifier effets de bord webhook (idempotence/licence/email selon logs)
- [ ] Résumer les résultats et actions correctives éventuelles
