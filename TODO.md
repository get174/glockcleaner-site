# TODO — Intégration Flutterwave PlansPage

- [x] 1. Installer `flutterwave-react-v3`
- [x] 2. Créer `src/lib/flutterwave.ts` (configuration & helpers)
- [x] 3. Créer `src/components/FlutterwavePayment.tsx` (composant checkout Flutterwave)
- [x] 4. Mettre à jour `src/pages/PlansPage.tsx` (refactor : auth obligatoire + paiement Flutterwave)
- [x] 5. Ajouter `.env.example` avec `VITE_FLUTTERWAVE_PUBLIC_KEY`
- [x] 6. Tester le build (typecheck OK)

## Plan de correction — Client ID / Public Key Flutterwave

**Problème :** Le dashboard Flutterwave affiche désormais **Client ID**, **Client Secret Key** et **Encryption Key** au lieu de l'ancienne terminologie Public Key / Secret Key.

**Solution :**
- [x] 1. Mettre à jour `.env.example` — Documenter `VITE_FLUTTERWAVE_CLIENT_ID` (= Public Key) + `VITE_FLUTTERWAVE_ENCRYPTION_KEY`
- [x] 2. Modifier `src/lib/flutterwave.ts` — Utiliser `VITE_FLUTTERWAVE_CLIENT_ID` avec fallback sur `VITE_FLUTTERWAVE_PUBLIC_KEY`
- [x] 3. Modifier `src/components/FlutterwavePayment.tsx` — Message d'erreur mis à jour
- [x] 4. Modifier `src/types/flutterwave.d.ts` — Commentaire sur `integrity_hash`
- [x] 5. Tester le build

