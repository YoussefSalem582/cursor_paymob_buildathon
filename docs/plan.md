A structured, AI-priced, paid brief replaces the messy Instagram DM negotiation. Client writes what they want, AI turns it into a scoped deliverable list with an explicit price and reasoning, client pays for real through Paymob, and only then does Nour start work. That single gate kills all three of her named pains at once — no more unpaid ghosting, no more scope arguments, no more repeating the same pricing DMs.

Three AI layers, each doing something the payment logic actually depends on
Structured brief → scope + price — raw client text becomes a frozen deliverables list plus a transparent, factor-by-factor price ("+15% multiple subjects"), capped within ±40% of a base price with a deterministic fallback if the AI call fails
Scope Guard — any new client message during "in progress" gets checked against that frozen scope. Out-of-scope asks don't get silently absorbed as free labor — they generate a second real Paymob payment (a paid change order) before the extra work is sanctioned
Serious Lead Score — for briefs that get abandoned before payment, a quick AI read on how likely that person actually was to pay, so Nour knows who's worth a personal follow-up. Lowest priority, cut first if time runs short — nothing else depends on it
The payment mechanic, done properly

Real Paymob hosted checkout (never a fake card form), HMAC-verified webhook as the only source of truth for "paid" (never the browser redirect), and two genuinely separate payment events on one order — the base commission, and any change order on top. That second linked payment is the part no other team building "pick a package, pay once" will have.

What's explicitly cut or deferred
The generalized multi-freelancer subscription platform — that's a pitch/roadmap line, not something built today (subscription billing is a separate, riskier Paymob integration and doesn't serve the specific Nour persona being judged)
Anything resembling ParkIt's simulated payment screens — not allowed under this event's rules, everything here has to be real
Build order, since it maps directly to risk

Real Paymob checkout + webhook first (Mahmoud, deployed early so the public URL exists) → AI scope/pricing → Scope Guard → both frontends in parallel once the backend contract is stable → lead score last, only if time allows.

Shared .cursor/rules (paste into repo root first, once)
Project: Nour's Scope Guard — an illustrator commission platform built for
the Cursor x Paymob Cairo Buildathon.

STACK: Next.js App Router, TypeScript, Supabase (Postgres/Auth/Storage),
deployed on Vercel. Use the Supabase MCP server for DB work when available
instead of hand-writing SQL migrations blind.

SCHEMA — use these exact tables/fields, do not invent different ones:
clients(id, name, email, phone, created_at)
orders(id, client_id, brief_text, reference_image_url, scope_json, price,
  price_reasoning, status, delivered_file_url, lead_score, created_at, paid_at)
payments(id, order_id, type, paymob_transaction_id, amount, status,
  hmac_verified, confirmed_at)
change_orders(id, order_id, client_message, ai_verdict, suggested_price,
  payment_id, status, created_at)

ORDER STATUS MACHINE: pending_payment -> paid (ONLY via verified Paymob
webhook, never on browser redirect alone) -> in_progress -> ready_for_review
-> delivered. Only Nour advances paid -> in_progress -> ready_for_review ->
delivered, from her dashboard.

BUSINESS RULES (non-negotiable):

- Never fake or simulate the Paymob checkout UI. Use Paymob's real hosted
  checkout with the event's test credentials. No custom card form.
- An order becomes "paid" only when a webhook's HMAC signature is verified
  server-side against the secret key. The redirect back to the site is
  never treated as proof of payment on its own.
- A change order (out-of-scope request mid-project) requires its own
  SEPARATE Paymob payment, linked via change_orders.payment_id, before the
  extra work counts as approved. Never let Nour do unpaid extra work
  silently — that's the entire point of this product.
- lead_score is only ever computed for orders stuck in pending_payment,
  never for paid orders — a completed payment is already the strongest
  seriousness signal there is, don't second-guess it with AI.

EDGE CASES TO HANDLE, NOT IGNORE:

- Webhook can arrive before or after the browser redirect — don't assume
  a fixed order, handle both
- Payment abandoned mid-checkout — order stays pending_payment, never
  silently flips to paid or disappears
- HMAC verification fails — reject and log the payload, never mark paid
- AI price/scope generation fails or times out — fall back to a fixed
  deterministic price band, never block the flow on a flaky model call

PAYMOB INTEGRATION: use docs.paymob.com and the Code Lab wizard at
wizard.paymob.com to generate the exact current request/response shapes for
Intention creation, hosted checkout, and HMAC webhook verification — do not
guess at exact field names, the API surface is precise and getting it wrong
breaks the one thing that must work live on stage.

DESIGN: clean, editorial, illustration-forward — this is Nour's storefront,
it should look like a designer's portfolio, not a generic SaaS dashboard.
Let the client's reference images and Nour's own work be the visual focus,
minimal chrome around them.
Rehab — Backend core
Own the backend API routes and Supabase schema for this project (see
.cursor/rules for the schema). Build:

- API routes for creating/reading orders, clients, and change_orders
- Supabase auth for Nour's single admin login (no multi-tenant auth needed,
  just one protected route group for her dashboard)
- File upload handling via Supabase Storage for reference images and
  delivered final files
- Do NOT touch anything Paymob-related (payments table writes for
  confirmed/failed status come only from the webhook handler, which
  Mahmoud owns) — you can read the payments table, don't write payment
  status from anywhere else in the codebase.
Acceptance: every CRUD route works against the real schema, file uploads
return real Supabase Storage URLs, Nour's login is protected.
Youssef — Client-facing frontend
Own the client-facing pages:

1. Landing/brief page — brief text field, optional reference image upload,
   submit triggers the AI scope+price generation (call the endpoint
   Mahmoud's building, don't reimplement the AI call yourself)
2. Price/scope confirmation — show the structured scope_json and price with
   its factor-by-factor reasoning, clearly, before the client commits.
   "Confirm and pay" button starts Paymob checkout.
3. Order status page — persistent link, shows "confirming payment..." after
   redirect, then live status (paid -> in_progress -> ready_for_review ->
   delivered) pulled from the real orders table. Show the delivered file
   for download once status is "delivered."
4. Change-order client view — if Nour flags something out of scope, the
   client sees the drafted message and suggested price on this same order
   page, with its own "pay to approve" button leading to the second Paymob
   checkout.
Follow .cursor/rules design direction: editorial, illustration-forward,
not a generic dashboard look. Handle loading/error/empty states everywhere,
never a blank screen.
Abdullah — Nour's dashboard
Build Nour's admin dashboard, behind the auth Rehab sets up:
5. Orders list — filterable by status, shows brief summary and price
6. Order detail — full brief, scope_json, client contact, buttons to
   advance status forward one stage at a time (paid -> in_progress ->
   ready_for_review -> delivered), file upload for the final delivered piece
7. Change-order flag — a simple text box where Nour can paste a new client
   message that seems out of scope, which calls the scope-check endpoint
   (Mahmoud's) and shows the AI verdict and suggested price before she
   sends it to the client
This is CRUD-heavy and low-risk — keep it functional and clean, polish is
secondary to it actually working end to end. Handle empty/loading/error
states on every screen.
Mahmoud — heaviest: Paymob core, AI layers, final integration
Own the highest-risk parts of this build, in priority order:

8. PAYMOB INTEGRATION (build and verify this first, before anything else):
   - Use wizard.paymob.com with our actual stack to generate correct
     Intention creation + hosted checkout + HMAC webhook handler code
   - Implement the webhook route, verify HMAC server-side, flip order/
     payment status only on verified success
   - Implement the SECOND payment path for change orders, linked via
     change_orders.payment_id
   - Deploy to Vercel immediately once this works, register the real
     public webhook URL in the Paymob dashboard — don't leave this until
     the end, it's the one thing that must work live

9. AI SCOPE + PRICING (structured brief -> scope_json + price + reasoning):
   - LLM call takes raw brief text (+ optional image) and returns
     structured deliverables, revision count, explicit out-of-scope items,
     and a price within ±40% of a fixed base, with factor-by-factor
     reasoning
   - Deterministic fallback price/scope if the AI call fails or times out

10. SCOPE GUARD (RAG comparison for change-order detection):
   - Given a new client message and an order's frozen scope_json, return
     a verdict (in_scope/out_of_scope) and a suggested price for out-of-
     scope requests

11. LEAD SCORE (only if 1-3 are solid and demo-ready — cut this first if
   short on time, nothing else depends on it):
   - For orders stuck in pending_payment, score likely seriousness from
     brief specificity and any budget/deadline language, surfaced to Nour
     as "worth a follow-up" vs. not

12. FINAL INTEGRATION: you're merging Rehab's backend, Youssef's client
   frontend, and Abdullah's dashboard into one deployed Vercel app under
   one repo — since everyone's committing to the same repo throughout,
   this should mostly be resolving merge conflicts and doing one final
   end-to-end test, not reconciling 3 separate codebases. Test the full
   chain before the demo: brief -> AI price -> real Paymob payment ->
   webhook confirms -> Nour advances status -> client sees it update ->
   out-of-scope message -> change order -> second real payment -> delivered.

what are the solutions we will implement

Here's the full solution set locked in for today's build, in plain terms — this is what you're actually shipping:

The core mechanic

A structured, AI-priced, paid brief replaces the messy Instagram DM negotiation. Client writes what they want, AI turns it into a scoped deliverable list with an explicit price and reasoning, client pays for real through Paymob, and only then does Nour start work. That single gate kills all three of her named pains at once — no more unpaid ghosting, no more scope arguments, no more repeating the same pricing DMs.

Three AI layers, each doing something the payment logic actually depends on
Structured brief → scope + price — raw client text becomes a frozen deliverables list plus a transparent, factor-by-factor price ("+15% multiple subjects"), capped within ±40% of a base price with a deterministic fallback if the AI call fails
Scope Guard — any new client message during "in progress" gets checked against that frozen scope. Out-of-scope asks don't get silently absorbed as free labor — they generate a second real Paymob payment (a paid change order) before the extra work is sanctioned
Serious Lead Score — for briefs that get abandoned before payment, a quick AI read on how likely that person actually was to pay, so Nour knows who's worth a personal follow-up. Lowest priority, cut first if time runs short — nothing else depends on it
The payment mechanic, done properly

Real Paymob hosted checkout (never a fake card form), HMAC-verified webhook as the only source of truth for "paid" (never the browser redirect), and two genuinely separate payment events on one order — the base commission, and any change order on top. That second linked payment is the part no other team building "pick a package, pay once" will have.

What's explicitly cut or deferred
The generalized multi-freelancer subscription platform — that's a pitch/roadmap line, not something built today (subscription billing is a separate, riskier Paymob integration and doesn't serve the specific Nour persona being judged)
Anything resembling ParkIt's simulated payment screens — not allowed under this event's rules, everything here has to be real
Build order, since it maps directly to risk

Real Paymob checkout + webhook first (Mahmoud, deployed early so the public URL exists) → AI scope/pricing → Scope Guard → both frontends in parallel once the backend contract is stable → lead score last, only if time allows.

i want detailed prompts like the manus prompts md each stream detailed prompt to handout to cursor give the streams here in chat

Reconstructed granular stream prompts matching previous detailed format specifications

Reconstructed granular stream prompts matching previous detailed format specifications.

Done

Here's the full detailed version, same depth as ParkIt's streams — screen-by-screen, OWNS/DOES NOT OWN, acceptance criteria, edge cases. Paste the shared .cursor/rules from before into the repo first, then hand each person their block.

Rehab — Backend core
[.cursor/rules already in repo root — read it before starting]

OWNS: all CRUD API routes, Supabase schema migrations, Nour's auth, file
storage for reference images and delivered files.
DOES NOT OWN: anything that writes to the payments table's status field —
that only happens inside Mahmoud's webhook handler. You can read payments,
never write confirmed/failed/voided to it from any other route. Also does
not own the AI scope/pricing endpoint or the Scope Guard comparison
endpoint — those are Mahmoud's, you call them, you don't reimplement them.

API ROUTES TO BUILD:

- POST /api/clients — create a client record (name, email, phone)
- POST /api/orders — create an order in status "pending_payment" with
  client_id, brief_text, reference_image_url (nullable). Does NOT set
  price or scope_json itself — those come from Mahmoud's AI endpoint,
  called separately and then patched onto this order.
- PATCH /api/orders/:id — used to attach scope_json/price after AI
  generation, and used by Nour's dashboard to advance status forward one
  stage at a time. Validate that status only moves forward in the fixed
  sequence (pending_payment -> paid -> in_progress -> ready_for_review ->
  delivered), reject any attempt to skip a stage or move backward.
- GET /api/orders/:id — full order detail including linked payments and
  change_orders for that order
- GET /api/orders — list with status filter query param, for Nour's
  dashboard orders list
- POST /api/orders/:id/deliver — sets delivered_file_url and flips status
  to "delivered," only allowed from status "ready_for_review"
- POST /api/change-orders — create a change_order row (order_id,
  client_message), status starts "pending"
- PATCH /api/change-orders/:id — used to attach ai_verdict/suggested_price
  after Mahmoud's Scope Guard call, and later to link payment_id once paid

AUTH: Supabase Auth, single admin user (Nour). One protected route group
(/dashboard/*) that redirects to login if unauthenticated. No client-side
accounts needed — clients access their order via a private, hard-to-guess
order URL (order id as the link), not a login.

FILE STORAGE: Supabase Storage buckets — one for reference images (client
uploads), one for delivered files (Nour uploads). Return public URLs,
store them in the relevant order fields. Validate file type/size on upload,
don't accept arbitrary file types unchecked.

EDGE CASES:

- Order creation with no brief_text — reject with a clear 400, not a
  silent empty record
- PATCH attempting to skip a status stage — reject with a clear error the
  frontend can display
- File upload failure — return a real error, don't silently drop the
  reference/delivered file

ACCEPTANCE CRITERIA — this stream is demo-ready when:
✓ Every route above exists, returns documented JSON, and is callable from
  Postman/curl independent of any frontend
✓ Status transitions strictly follow the fixed sequence, verified by
  attempting an invalid skip and confirming it's rejected
✓ File uploads return real, working Supabase Storage URLs, not local paths
✓ Nour's dashboard routes are genuinely unreachable without auth
Youssef — Client-facing frontend
[.cursor/rules already in repo root — read it before starting]

OWNS: every screen a client sees. Never write to the payments table
directly, never mark an order as "paid" client-side — that state comes
from polling GET /api/orders/:id and reflecting whatever the backend says.
DOES NOT OWN: Nour's dashboard (Abdullah), any backend route logic
(Rehab), the Paymob checkout creation or webhook (Mahmoud) — you call
Mahmoud's checkout-creation endpoint and redirect the client to the URL it
returns, you do not build any payment UI yourself.

SCREENS:

1. Brief submission page — a clean, editorial landing page (this is Nour's
   storefront, treat it like a designer portfolio, not a generic form).
   A brief text field, optional reference image upload. On submit: POST to
   /api/clients (if new) then /api/orders, then call Mahmoud's AI
   scope+price endpoint and PATCH the result onto the order. Show a
   loading state while the AI call runs — this can take a few seconds,
   don't leave the client staring at a frozen button.
2. Price/scope confirmation page — display the generated scope_json as a
   clear deliverables list (what's included, revision count, explicitly
   what's NOT included) and the price with its factor-by-factor
   price_reasoning shown plainly ("+15% multiple subjects," "+10% detailed
   background") so the client understands why it costs what it costs
   before paying anything. "Confirm and pay" button calls Mahmoud's
   checkout-creation endpoint and redirects to the real Paymob hosted
   checkout URL it returns.
3. Order status page — the client's persistent link (order id in the URL).
   Right after redirect back from Paymob, show a "confirming payment..."
   loading state and poll GET /api/orders/:id every couple seconds — do
   NOT show "paid" until the backend actually says so. Once paid, show a
   simple status tracker: paid -> in progress -> ready for review ->
   delivered, live-updating as Nour advances it from her dashboard. Once
   delivered, show the final file with a download link.
4. Change-order view — same order status page, but if a change_order
   exists for this order with a verdict of "out_of_scope," show the
   drafted message and suggested price clearly, with its own "pay to
   approve" button that calls Mahmoud's second-checkout endpoint for that
   change order and redirects to a second real Paymob checkout. Same
   confirming/paid pattern as the base payment.

DESIGN: follow .cursor/rules — editorial, illustration-forward, generous
whitespace, let images (reference images, Nour's own work, the delivered
piece) be the visual center, not form chrome. This is the surface judges
see most during the live walkthrough, so this is worth the most polish
time after the payment path itself is solid.

EDGE CASES:

- AI scope/price generation fails — show the deterministic fallback price
  Mahmoud's endpoint returns, don't show a broken or empty confirmation page
- Client abandons checkout and returns later via the same order link — page
  should correctly show "pending_payment" and let them resume, not error out
- Network failure while polling order status — retry silently a few times
  before showing an explicit "having trouble loading status" message

ACCEPTANCE CRITERIA — this stream is demo-ready when:
✓ A client can go from brief to a real Paymob checkout without ever seeing
  a fake payment UI
✓ Price and scope are shown clearly with reasoning before any payment
✓ Order status page never shows "paid" before the backend confirms it
✓ Change-order payment path visibly works as a second, distinct checkout
✓ Every screen has a handled loading, error, and empty state
Abdullah — Nour's dashboard
[.cursor/rules already in repo root — read it before starting]

OWNS: everything behind Nour's login. Lower-risk, self-contained stream —
prioritize it actually working end to end over visual polish.
DOES NOT OWN: the client-facing pages (Youssef), any backend route logic
(Rehab) — you call the existing routes, you don't add new ones without
checking with Rehab first, and never touch Paymob/payments logic at all.

SCREENS:

1. Login — Supabase Auth login screen, single admin account, redirects to
   the orders list on success.
2. Orders list — table or card list of all orders, filterable by status
   (pending_payment / paid / in_progress / ready_for_review / delivered).
   Show client name, brief summary (truncated), price, and current status
   per row. Click through to order detail.
3. Order detail — full brief text, the generated scope_json displayed
   clearly, client contact info, price and reasoning, and payment history
   for that order (base payment + any change orders, with their status).
   A single "advance to next stage" button that moves status forward
   exactly one step (call PATCH /api/orders/:id) — don't let it skip
   stages, the backend will reject it but the UI shouldn't even offer
   an invalid jump.
4. Deliver flow — when status is "ready_for_review," show a file upload
   for the final piece; submitting calls POST /api/orders/:id/deliver.
5. Change-order flag tool — a text box where Nour pastes in a new message
   from a client that seems like it's asking for something beyond the
   original brief. Submitting calls Rehab's /api/change-orders creation
   route, then Mahmoud's Scope Guard comparison endpoint, and displays the
   AI's verdict (in scope / out of scope) and suggested price before she
   sends anything to the client. This is advisory — Nour still decides
   whether to actually send it.

DESIGN: functional over polished — Nour checks this constantly during
work, so clarity and speed matter more than visual flourish. Still follow
the base design system for consistency, just spend less time here than on
Youssef's client-facing screens.

EDGE CASES:

- Attempting to advance status with no delivered file at the final stage —
  block it with a clear message, don't allow an empty "delivered" order
- Change-order tool called with empty text — reject client-side before
  even hitting the API
- Orders list with zero results for a filter — show a clear empty state,
  not a blank table

ACCEPTANCE CRITERIA — this stream is demo-ready when:
✓ Nour can log in and the dashboard is genuinely unreachable without auth
✓ Status can only be advanced one valid step at a time, never skipped
✓ The change-order flag tool returns a real AI verdict, not a placeholder
✓ File delivery actually attaches a real file URL before allowing delivery
✓ Every screen has a handled loading, error, and empty state
Mahmoud — heaviest: Paymob core, AI layers, integration
[.cursor/rules already in repo root — read it before starting]

OWNS: everything payment-related, both AI endpoints, and final integration.
This is deliberately the largest and highest-risk share of the build —
build in the exact priority order below, don't jump ahead to later items
until the earlier ones are proven working on the real deployed URL.
DOES NOT OWN: the CRUD routes Rehab owns, the UI Youssef and Abdullah own
— you expose endpoints for them to call, you don't build their screens.

PRIORITY 1 — PAYMOB CORE (build and deploy this before anything else):

- Run wizard.paymob.com with our actual stack (Next.js/Node) selected to
  generate correct, current code for: creating a payment Intention, the
  hosted checkout handoff, and an HMAC webhook handler. Don't hand-write
  this from memory — the field names and signing logic are precise.
- POST /api/checkout — given an order_id (and optionally a change_order_id
  for the second-payment path), creates a Paymob Intention for the right
  amount and returns the real hosted checkout URL. Creates a "pending"
  payments row with the correct type (base/change_order) first.
- POST /api/webhooks/paymob — receives Paymob's callback, verifies the
  HMAC signature against the secret key BEFORE trusting anything in the
  payload. On verified success: set the matching payments row to
  "confirmed," and set orders.status to "paid" (for a base payment) or
  change_orders.status to "paid" (for a change-order payment, also link
  payment_id). On verification failure: reject and log, never mark paid.
- Deploy to Vercel the moment this works end to end with one dummy order —
  don't wait for the rest of the app to be ready. Register the real public
  webhook URL in the Paymob dashboard immediately after.
- Test with the event's test card end to end at least twice before
  building anything else: once for a base payment, once for a simulated
  change-order payment, confirming both webhooks land and verify correctly.

PRIORITY 2 — AI SCOPE + PRICING:

- POST /api/ai/scope-price — takes brief_text (+ optional
  reference_image_url), returns scope_json (deliverables list, revision
  count, explicit out-of-scope items) and price with price_reasoning (an
  array of {factor, adjustment} entries). Cap the final price within
  roughly ±40% of a fixed base price regardless of what the model returns
  — never let a model output an unreasonable number live on stage.
- If the AI call fails or times out (set a hard timeout, a few seconds
  max), return a deterministic fallback: fixed base price, generic scope
  text. The frontend should never see an error state here, only ever a
  price — flaky AI must never block the flow.

PRIORITY 3 — SCOPE GUARD:

- POST /api/ai/scope-check — takes a change_order's client_message and the
  parent order's scope_json, returns ai_verdict (in_scope/out_of_scope) and,
  if out of scope, a suggested_price and a drafted reply the frontend can
  show Nour before she sends it. This is a real semantic comparison against
  the frozen scope, not keyword matching — but keep the prompt simple and
  fast, this needs to feel instant in the demo, not like a slow research call.

PRIORITY 4 — LEAD SCORE (cut first if behind schedule, nothing depends on it):

- A scheduled or on-demand check over orders stuck in "pending_payment"
  for longer than a few minutes, scoring likely seriousness from brief
  specificity and any budget/deadline language present, written to
  orders.lead_score. Surfaced read-only on Abdullah's orders list, no new
  screens needed — this is additive, don't let it touch anything else.

PRIORITY 5 — FINAL INTEGRATION:

- Since everyone's committing to the same repo throughout (not separate
  sessions merged at the end), this is mostly: resolve any merge
  conflicts, confirm every cross-stream call (Youssef calling your
  checkout/AI endpoints, Abdullah calling your scope-check endpoint) works
  against your actual deployed routes, and run one full end-to-end pass on
  the real Vercel URL: brief -> AI price -> real Paymob payment -> webhook
  confirms -> Nour advances status -> client sees it update live ->
  out-of-scope message -> Scope Guard verdict -> second real payment ->
  delivered. Fix any break in that chain before polishing anything.

ACCEPTANCE CRITERIA — this stream is demo-ready when:
✓ A real Paymob payment, start to finish, works on the deployed URL —
  proven with the event's test card, not just in theory
✓ The webhook only ever marks paid on a verified HMAC signature
✓ A second, distinct payment for a change order works independently of
  the base payment
✓ AI price/scope generation has a working fallback that never blocks the
  flow
✓ Scope Guard returns a real verdict fast enough to feel live on stage
✓ The full end-to-end chain works on the real deployed link, tested by
  you personally at least once before the demo slot
