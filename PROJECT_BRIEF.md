# PROJECT_BRIEF.md — Project 002 · Raktha

## Identity
- **Project number:** 002 (tracker sheet max was 1 → this run takes 002)
- **Product name:** Raktha — Emergency Blood Donor Network
- **Field:** Public health / blood donation (chosen for night 1; not covered by any prior project)

## The real, painful problem
In India, blood banks routinely run short and families in an emergency scramble
through WhatsApp forwards to find a donor of the right blood group in time.
Rare groups (O-, A-, B-, AB-) are hardest: a patient needing B- at 2 AM cannot
wait for a group chat to wake up. Thalassemia and dialysis patients need
scheduled transfusions every few weeks and re-run the same frantic search each
time. Meanwhile willing donors sit idle because nobody knows they exist, and
donors lose track of when they become eligible again (India's 90-day gap rule).

## Vision
A calm, fast, local-first emergency blood network: register donors once, screen
eligibility honestly, post a request in under a minute, and instantly see the
compatible donors to call — sorted by blood-group compatibility, rarity, and
eligibility. Everything works offline in the browser via localStorage; no
account, no backend, no API keys.

## Feature scope (night 1)
1. **Donor registry** — register with name, blood group, phone, area; availability toggle.
2. **Eligibility self-screen (RapidPass-style)** — researched insight #1: the
   American Red Cross app's pre-donation questionnaire (RapidPass) cuts wasted
   trips. We implement a guided self-check (age, weight ≥ 45 kg, 90-day gap,
   recent illness/tattoo/surgery, pregnancy, hemoglobin) with a clear
   eligible / not-yet verdict and the exact next-eligible date.
3. **Emergency request flow** — post a request (patient, group, units, hospital,
   contact, urgency) in one form; auto-expires.
4. **Compatibility-aware matching** — researched insight #2: e-Rakt Kosh's
   real-time availability + rare-donor registry. We compute compatible donor
   groups from the transfusion matrix, flag rare groups, and rank matches by
   eligibility + rarity; blood-bank stock board mirrors the availability view.
5. **Request board** — open requests with urgency badges, one-tap call,
   fulfill/expire actions, auto-expiry.
6. **Donor directory** — search + filter by group and area; shows eligibility
   status and next-eligible date.
7. **Donation history & milestones** — log donations, lifetime units, badges at
   1/5/10/25 donations, next-eligible countdown.
8. **Blood bank directory** — seeded banks with per-group stock levels.
9. **Learn section** — who can donate, myths vs facts, before/after donation tips.

## UI rules (non-negotiable)
- Professional, neat, clean, human-designed. Restrained palette: warm neutrals
  (ink) + one deep crimson accent. Light theme only.
- Minimal animation; generous whitespace; no gradient-heavy styling.
- Mobile-first: bottom tab nav on small screens, touch-friendly targets
  (min 44px), no horizontal scroll.
- Accessibility: visible focus rings, labelled form controls, aria-current on nav.

## Data
- localStorage only (`raktha.*.v1` keys). Seeded on first visit with demo
  donors, requests, and blood banks; user data persists across sessions.

## Success for the night
Hourly runs 23:00–05:00 IST keep adding cycles. `npm run build` green at the
end of every run. Reveal happens only when Rohan says good morning (main
agent handles it); this job stays silent and never pushes/deploys.
