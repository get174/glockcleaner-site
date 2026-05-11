# TODO: Fix @typescript-eslint/no-explicit-any


## Plan
1. Locate all `any` usages flagged by eslint.
2. Replace `any` types in `src/components/PayPalPayment.tsx` with proper typed interfaces / unknown-safe handling.
3. Update `window.paypal` declaration to avoid `any`.
4. Run `npm run lint` and `npm run typecheck` to confirm zero lint/type errors.

## Steps
- [ ] Inspect `src/components/PayPalPayment.tsx` for `any` occurrences.
- [ ] Introduce minimal PayPal SDK type declarations (interfaces) using `unknown` instead of `any`.
- [ ] Refactor `onApprove` and `onError` parameter types.
- [ ] Refactor `window.paypal` global type.
- [ ] Execute lint/typecheck.

