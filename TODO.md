# TODO

## PayPal ESLint warnings fix
- [ ] Update `src/components/PayPalPayment.tsx` to fix `react-hooks/exhaustive-deps` warning for `buttonContainer.current` in effect cleanup
- [ ] Update `src/components/PayPalPayment.tsx` to fix missing dependencies for effect (`createPaypalOrder`, `capturePaypalOrder`, `txRef`) by stabilizing them and/or moving into effect
- [ ] Re-run lint (if available) or verify ESLint warnings are gone

