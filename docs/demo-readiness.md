# Demo readiness — Escrowd

Last updated: 2026-09-10. Product spec: [`plan.md`](plan.md). Baseline tag: [`v0.1.0`](https://github.com/YoussefSalem582/cursor_paymob_buildathon/releases/tag/v0.1.0).

One mechanism: **deposit starts work; balance unlocks the file.** This is two real Paymob payments on one `orders` row, HMAC-verified. It is not Scope Guard.

## Live URLs

| Item | Value |
| --- | --- |
| **Public app** | **https://cursor-paymob-buildathon-five.vercel.app** |
| Arabic home | https://cursor-paymob-buildathon-five.vercel.app/ar |
| Commission | https://cursor-paymob-buildathon-five.vercel.app/ar/commission |
| Health | https://cursor-paymob-buildathon-five.vercel.app/api/health |
| **Paymob webhook** | **https://cursor-paymob-buildathon-five.vercel.app/api/paymob/webhook** |
| Studio | https://cursor-paymob-buildathon-five.vercel.app/ar/sign-in → `/dashboard` |

Client links are `/ar/o/{token}` (12-char nanoid). Do **not** give Paymob a per-deployment `*.vercel.app` hash URL — Vercel Authentication would 302 the callback.

## Provider

Intention API + Unified Checkout. Amounts in piastres from the server `priceBrief()`. `special_reference` = `{token}:{kind}:{attemptId}` (`deposit` \| `balance`).

Paid is written **only** after HMAC-SHA512 of the documented TRANSACTION fields matches `?hmac=`. `/o/[token]?checkout=returning` only polls. Redirect query params are not proof.

## Webhook (paste this today)

In Paymob (test) → each **card** integration → Transaction processed callback:

```
https://cursor-paymob-buildathon-five.vercel.app/api/paymob/webhook
```

Paste the **same URL** on a **wallet** integration only if this merchant has a Test-mode wallet ID. Intention `notification_url` is also set to that path. After redirect, `/o/[token]` polls and may call `?reconcile=1` (Transaction Inquiry).

`GET` the webhook URL: `{ "ok": true, "accept": "POST", "hmac": "required" }`. Empty `POST {}` must return **400** and must not flip any order.

## Tested payment path (this session)

| Field | Status |
| --- | --- |
| Public origin | `https://cursor-paymob-buildathon-five.vercel.app` |
| `v0.1.0` | Tagged on `main` at `e1cb92f` |
| Health (production, pre this branch) | `200` — `app: Escrowd`, `environment: production` |
| Empty webhook POST | `400` `{"error":"Bad payload"}` — no paid state |
| Webhook GET (production, pre this branch) | `405` until this branch deploys; then `200` with `accept: POST` |
| Paymob test methods (MCP, this session) | Card Payment only. No wallet method on this test merchant — do not invent a wallet Integration ID |
| Successful sandbox transactions (MCP) | None in this window |
| HMAC deposit on one public order | *Not completed — paste the webhook, then one test card on `/ar/commission`* |
| HMAC balance on the **same** order | *After Nour uploads preview + final and advances* |

Do **not** mark `*_paid_at` from MCP, the redirect, or the dashboard.

## 90-second script (deployed URL)

Two windows: client left, Nour right.

1. `/ar/commission` — portrait, 2 subjects, full render, **commercial** — price jumps ×3
2. Deposit on real Unified Checkout (Mastercard `5123456789012346` / `01/39` / `123` unless the event card differs)
3. Client lands on `/o/[token]` “confirming…” until the webhook (or Inquiry) sets `in_progress`
4. Nour: upload watermarked preview → ready for review → upload final → awaiting balance
5. Client pays the balance on Paymob
6. File unlocks (signed URL). The raw storage object is not public.

Say in the demo: commercial ×3; wallets come free with Unified Checkout if the merchant enabled one; unlock is the last shot.

## Known limitations

- Clients have no login. Bookmark `/o/[token]`.
- `final_url` is omitted from public GET until `balance_paid_at`. The `deliveries` bucket is private; the API mints a one-hour signed URL.
- Invalid HMAC → 401, order unchanged.
- Abandoned checkout stays `awaiting_deposit` / `awaiting_balance`.
- Payment rating is 5★ if the deposit webhook is within 72 hours of `created_at`, else 4★. Late payment still checks out.
- This test merchant (MCP) had **no wallet** integration. Card ID in env is this merchant’s test card `5853667`. Do not paste an Integration ID from another Paymob account (that 404s Intention).
- Kill switches in [`plan.md`](plan.md): 2:30 no verified checkout → stop product work; 4:00 no balance path → one payment of `price_total`, still webhook-only.

## Demo reset

1. Do not drop `orders`. Optional: delete only demo emails you created.
2. Seed must never insert `deposit_paid_at` / `balance_paid_at`.
3. `GET /api/health` should show `"paymob":{"configured":true,...,"public_origin":"https://cursor-paymob-buildathon-five.vercel.app"}`.
4. Walk `/ar/commission` so judges see a fresh Intention.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Paymob checkout never opens | Intention 404: Integration IDs must belong to this Secret Key. Confirm `PAYMOB_INTEGRATION_IDS` is `5853667` (plus a wallet ID only if Test mode has one). |
| Stuck on “Confirming payment” | Callback not reaching `/api/paymob/webhook`. Paste the **production** URL on the card integration. Poll uses Inquiry (`?reconcile=1`) as fallback. |
| Invalid HMAC / stays unpaid | HMAC secret mismatch (test vs live), or redirect treated as paid (it must not). |
| Studio empty / 500 | Hosted `orders` must be the Escrowd shape (`0006`). Do not re-apply Scope Guard migrations. |
| Preview/final 403 | Apply `0007_private_deliveries.sql`. The UI must use signed URLs from the server, not `getPublicUrl`. |
| Offline pay button | Expected. Connection guard disables checkout until `navigator.onLine`. |
| Client and studio disagree | Hard refresh. Same Supabase project. Paid only after webhook or Inquiry. |

## Security (checked)

- No `NEXT_PUBLIC_` prefix on Paymob/Supabase secret keys.
- Service role only in server `createAdminClient()`.
- Uploads go through dashboard routes + MIME/size checks.
- Public order URLs use a 12-char token, not sequential ids.
- Browser never PATCHes `*_paid_at` or sets `in_progress` / `delivered`.
- `GET /api/health` reports whether Paymob env is present — never the keys.
