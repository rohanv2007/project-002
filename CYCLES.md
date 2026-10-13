# CYCLES.md — Project 002 · Raktha (append-only build log)

Project: 002 · Night: 2026-10-12 · Runs: 23:00–05:00 IST
Research folded in: (1) Red Cross RapidPass pre-donation self-screen;
(2) e-Rakt Kosh real-time group availability + rare-donor registry;
(3) Red Cross geo-targeted shortage alerts, blood-journey tracking,
donation milestones, lifesaving teams + leaderboard, history export.

## Cycle 1 — 23:23 IST
- Scaffolded Next.js 15 App Router + TypeScript + Tailwind v3 app with restrained ink/crimson light-theme palette, mobile bottom nav, sticky header showing "Project 002 · Raktha"; added data layer (types, transfusion compatibility matrix, 90-day eligibility engine, localStorage store) and demo seed data; `npm run build` passes.
- Deployed: no

## Cycle 2 — 23:31 IST
- Added shared UI kit (PageHeader, GroupBadge with rare-group flag, UrgencyBadge, StatCard, EmptyState, form Field) and rebuilt home as a live dashboard: ready-donor/open-request/rare-coverage/bank-stock stats, critical-request call panel, per-group compatibility coverage grid, and dual CTAs. Build passes.
- Deployed: no

## Cycle 3 — 23:38 IST
- Built donor registration page (/donors/register): name, blood group, phone, area, optional last-donation date, availability toggle; inline validation, link to eligibility check. Build passes.
- Deployed: no

## Cycle 4 — 23:42 IST
- Added eligibility self-screen (/eligibility), folding in the researched RapidPass insight: 9-question guided questionnaire (age, weight, health, antibiotics, tattoo, surgery, pregnancy, conditions, haemoglobin) plus last-donation date; evaluates against NACO-aligned rules, shows exact next-eligible date and per-reason deferral guidance. Build passes.
- Deployed: no

## Cycle 5 — 23:47 IST
- Built the emergency request form (/request): patient, group (rare flagged), units, hospital, area, contact, 3 urgency levels driving auto-expiry (24/48/96 h); validation + redirect to the match page. Build passes.
- Deployed: no

## Cycle 6 — 23:52 IST
- Built the request detail + matching page (/requests/[id]): full transfusion-matrix matching, ranking by availability, 90-day eligibility, same-area and rarity; one-tap call buttons, fulfill/close actions, auto-expiry on view, honest empty state pointing at blood-bank stock. Build passes.
- Deployed: no

## Cycle 7 — 23:58 IST
- Built the requests board (/requests): Open/Fulfilled/Expired tabs with live counts, blood-group filter, auto-expiry sweep on load, expiry timestamps on every card, calm empty states. Build passes.
- Deployed: no

## Cycle 8 — 00:04 IST
- Built the donor directory (/donors): name/area search, group filter, "ready only" toggle, per-card eligibility status (ready / eligible-again date / paused), pause-resume and remove actions, registration confirmation banner. Build passes.
- Deployed: no

## Cycle 9 — 00:10 IST
- Built the blood bank directory (/banks): per-group stock bars with low-stock colouring, sort-by-group, and a rare-group low-stock alert panel that directly recruits rare donors — the e-Rakt Kosh real-time-availability insight made tangible. Build passes.
- Deployed: no

## Cycle 10 — 00:16 IST
- Added Learn section (/learn): donor eligibility summary, 6 myth-vs-fact accordions, before/during/after tips, full red-cell compatibility matrix table; plus My Donations (/me): personal donation log, lifetime stats, 1/5/10/25 milestone badges, next-eligible countdown from the 90-day rule. Wired both into desktop + mobile nav. Build passes.
- Deployed: no

## Cycle 11 — 23:58 IST
- Added WhatsApp share to the request detail page (/requests/[id]): one tap opens a pre-filled forward (urgency headline, units + group, patient, hospital/area, contact, valid-till) — the exact message families otherwise type by hand in donor group chats. Build passes.
- Deployed: no

## Cycle 12 — 23:59 IST
- Added search to the requests board (/requests): filter by patient name, hospital, or area alongside the existing group filter — families can find the right emergency in a long board in seconds. Build passes.
- Deployed: no

## Cycle 20 — 01:14 IST
- Added a `timeUntil` countdown helper in lib/blood.ts: board cards and request detail pages now show "expires in 3h 12m" style labels, coloured crimson when under 6 hours — urgency is visible at a glance instead of a raw timestamp. Build passes.
- Deployed: no

## Cycle 19 — 01:08 IST
- Added donor "away until" availability: pausing a donor in the directory now offers an optional return date (auto-resumes after it passes), shows a "Back <date>" badge, and the new `isEffectivelyAvailable` helper is threaded through the directory filter, request matching, home stats, and the shortage engine. Build passes.
- Deployed: no

## Cycle 18 — 01:00 IST
- Accessibility pass: added a skip-to-content link and a `prefers-reduced-motion` rule in globals.css, alongside the existing visible focus rings and 27 aria labels across pages; keyboard and motion-sensitive users get a calmer, navigable app. Build passes.
- Deployed: no

## Cycle 17 — 00:52 IST
- Added export/print to My Donations (/me): one-tap CSV download of the full donation history and a print-friendly record (print stylesheet hides header/nav chrome, adds a printable summary header) — matching the Red Cross app's donation-history export. Build passes.
- Deployed: no

## Cycle 16 — 00:44 IST
- Added donation pledges to request detail pages: donors pledge units toward a request, families see a pledged-vs-needed progress bar, pledge list with call buttons, and an inline pledge form — from the Red Cross app's donation-tracking insight, giving each request a live "is the gap closing" signal. Build passes.
- Deployed: no

## Cycle 15 — 00:35 IST
- Built donor teams (/teams) from the Red Cross "lifesaving teams + leaderboard" insight: create teams, add registered donors, member chips with per-member donation counts, a leaderboard ranked by lifetime donations, and seeded demo teams; wired into desktop and mobile nav (mobile grid now 7 tabs). Build passes.
- Deployed: no

## Cycle 14 — 00:26 IST
- Added blood-journey tracking to My Donations (/me), from the Red Cross "track your blood to the patient" insight: every logged donation now carries a 4-stage journey (Logged → At blood bank → Dispatched → Reached a patient) with a progress bar and a "Next" step button, so donors see their donation move toward a patient. Build passes.
- Deployed: no

## Cycle 13 — 00:20 IST
- Added a shortage-alert engine (`lib/need.ts`): per-group need scoring from urgency-weighted open requests vs ready donors + bank stock, folded in the Red Cross "your blood type is needed in your area" insight; home now shows a "Needed in your area right now" panel with Shortage/Watch badges, reason lines (rare group · no ready donor · bank stock low), and a register CTA. Build passes.
- Deployed: no

## Cycle 21 — 01:20 IST
- Added a "Recently fulfilled" wins strip to the home dashboard: the latest fulfilled requests render as quiet green confirmations — fulfilled requests read as outcomes, not vanished rows. Build passes.
- Deployed: no

## Cycle 22 — 01:01 IST (watchdog recovery)
- Added draft autosave to the emergency request form (/request): all 9 fields persist to localStorage on every keystroke, an interrupted form restores on return with a "draft restored — nothing was lost" notice plus a Discard button, and the draft clears on successful submit. Families interrupted mid-fill no longer start over. Build passes.
- Deployed: no

## Cycle 23 — 01:02 IST (watchdog recovery)
- Added duplicate-donor detection to donor registration (/donors/register): as a phone number is typed, it is normalised (digits, last-10, country-code tolerant) against the registry and an amber notice names the existing donor with their group, area, and a link to the directory — non-blocking, since families sometimes share a phone. Build passes.
- Deployed: no

## Cycle 24 — 01:03 IST (watchdog recovery)
- Added CSV export to the donor directory (/donors): one tap downloads the currently filtered list (name, group, phone, area, readiness status, next-eligible date, lifetime donations) as `raktha-donor-directory.csv` — camp organisers get a clean call list, mirroring the My Donations export pattern. Build passes.
- Deployed: no

## Cycle 25 — 01:18 IST
- Built the personalised donation journey on My Donations (/me), folding in tonight's iDonate research insight: each donor now gets a countdown to their exact next-eligible date (90-day rule), a "best window" recommendation (first two weeks after eligibility, when fresh stock matters most), a persistent reminder queue in localStorage (set / snooze 3 days / cancel), and a green banner alert the day a reminder fires — so nobody loses track of when they can donate again. Build passes.
- Deployed: no

## Cycle 26 — 01:22 IST
- Built the SOS broadcast studio (/requests/[id]/sos): a generated emergency forward (group, units, patient, hospital, contact, expiry, live pledged-vs-needed count, eligible donor groups) with one-tap send via WhatsApp, SMS, or copy-to-clipboard (with fallback + confirmation), plus a calm phone script for calling matched donors; linked from each open request as an "SOS broadcast" button. Build passes.
- Deployed: no

## Cycle 27 — 01:27 IST
- Added a seasonal demand-forecast panel to the home dashboard (lib/forecast.ts): a 12-month India demand model (dengue season Aug–Oct, summer camp trough May–Jun, exam-season dip in March, festival trauma, year-round thalassemia/dialysis need) rendering the next 3 months with Peak/High/Steady badges, drivers, and proactive donation tips — forecasting demand like e-RaktKosh so donors give before the peak, not during it. Build passes.
- Deployed: no

## Cycle 28 — 01:28 IST
- Added an "Add a blood bank" form to the stock board (/banks): a collapsible form with name, area, phone, hours, and per-group stock inputs that appends the new bank to the live board — the directory is no longer seed-only and grows as users report banks. Build passes.
- Deployed: no

## Cycle 29 — 01:29 IST
- Built the blood camps page (/camps): upcoming drives sorted by date with venue, timings, and a "call organiser" button, a past-camps archive, and a full "list a camp" form (name, organiser, venue, area, date, timings, phone) — seeded with two demo camps and backfilled once for returning visitors; wired into desktop header and mobile tab nav (now 8 tabs). Build passes.
- Deployed: no

## Cycle 30 — 01:30 IST
- Turned milestones into a shared badge system (lib/badges.ts): every donor now wears their highest earned badge (First drop / Lifeline / Champion / Legend) as a chip beside their name in the directory, and each earned milestone on My Donations gets a "Share badge" button that opens a pre-filled WhatsApp forward — small, meaningful gamification that recruits new donors. Build passes.
- Deployed: no

## Cycle 31 — 01:31 IST
- Second accessibility pass: full touch-target audit — every sub-44px control (pledge call buttons, pause/resume/call/remove donor buttons, reminder snooze/cancel, CSV export, donation remove/journey buttons, badge share, stock inputs) is now min 44px across all pages; added screen-reader live regions announcing filtered result counts on the request board and donor directory. Build passes.
- Deployed: no

## Cycle 32 — 01:31 IST
- Gave every empty state a face: a hand-drawn line-art illustration system (blood drop, people, blood bank, search, calendar, flag — single-colour, no gradients) rendered above the copy, per-context icons on all 9 empty states, and warmer microcopy (the expired-requests tab now reads "the fulfilled ones went to patients, which is the whole point"). Build passes.
- Deployed: no

## Cycle 33 — 01:32 IST
- Made the request board duplicate-aware and priority-sorted: open requests now sort critical-first, then expiring-soonest (fulfilled/expired stay newest-first), and same-group + same-hospital requests posted within 24h are flagged with a "Possible duplicate" chip (with an explainer tooltip) so families don't split donor attention across repeat posts of the same emergency. Build passes.
- Deployed: no

## Cycle 34 — 01:33 IST
- Added a Settings page (/settings) with two-step-confirmed destructive actions: export all data as JSON, reload the demo dataset, and reset everything — plus a plain-language privacy section (local-only, no account, no tracking) and an About block; linked from a new quiet footer so the nav bars stay uncluttered. Build passes.
- Deployed: no

## Cycle 35 — 01:56 IST (watchdog recovery)
- Kept emergencies alive past the timer: open requests now have an "Extend by 24h" button (pushes expiresAt forward, one tap), and expired requests have "Repost as new request" — it pre-fills the request form via the cycle-22 draft autosave key, so families re-post the same emergency without re-typing every detail. Build passes.
- Deployed: no

## Cycle 36 — 01:58 IST (watchdog recovery)
- Added a print-ready emergency poster to the SOS broadcast studio: a "Print poster" button renders a print-only one-page flyer — giant blood group, units needed, pledged-so-far, patient, hospital, contact, needed-by date — high-contrast black on white for hospital notice boards and blood bank counters, a physical backup for donors the WhatsApp forward never reaches. Build passes.
- Deployed: no

## Cycle 37 — 01:59 IST (watchdog recovery)
- Added "Add to calendar" to every upcoming blood camp: one tap downloads a generated .ics (timed event when the organiser gave timings, all-day fallback otherwise) with camp name, venue, and organiser contact — donors drop the drive into their phone calendar instead of forgetting the date. Build passes.
- Deployed: no

## Cycle 38 — 02:18 IST
- Added commit-to-give pledges on /me (researched insight #3: donors who schedule their next visit are far more likely to return): new Pledge type + usePledges() store, a "Pledge your next donation" scheduler with earliest-date guard (next eligible date), an upcoming-pledge list with cancel, and a due-pledge banner with "I donated today" (logs the donation + clears the pledge), "Push by 7 days", and cancel actions. Build passes.
- Deployed: no

## Cycle 39 — 02:21 IST
- Added "Your blood's impact" to /me (researched insight #4, Penn State/Red Cross: donors told where their blood was used are ~10% more likely to return): an impact-report card for every donation that completes its journey ("reached a patient", lives touched, thank-you note) plus a tip to call the donation centre for the receiving hospital; also a new "Lives touched" stat tile (≈ 3 per unit). Build passes.
- Deployed: no

## Cycle 40 — 02:27 IST
- Rare-phenotype support end to end (researched insight #5 — India's ICMR-NIIH national rare donor registry, June 2025, integrating with e-RaktKosh): Donor gets optional `rarePhenotype` (Bombay (Oh) / Rh-null / Other) captured on the register form and shown as a chip in the directory + CSV; BloodRequest gets optional `rarePhenotypeNeeded` on the request form; request matching scores exact phenotype matches +6 with a "rare match" chip, a "Needs Bombay (Oh)" flag on the request header, and the phenotype in the WhatsApp share text; Learn page gained a rare-phenotypes explainer. Build passes.
- Deployed: no

## Cycle 41 — 02:33 IST
- "Watch this group" alerts (researched feature — real blood services send individually targeted group alerts): new Watch type + useWatches() store, a /watches page with watch form (group + optional area), recent-match hits (donors registered in the last 14 days matching group + locality), watch list with hit counts and remove; home shows a "Watchlist: new donors found" card when hits exist; directory toolbar links to the new page. Build passes.
- Deployed: no

## Cycle 42 — 02:39 IST
- Transfusion patients (recurring-need families — thalassemia, dialysis — are the brief's core pain): new Patient type + usePatients() store and a /patients page (add profile with condition/hospital/next-due, due countdown with overdue handling, one-tap "New request for X" pre-filling the request form via ?patient=, "Mark done — next in 3 weeks"); home shows a "Transfusions due within a week" card; request form restructured with a Suspense boundary for the prefill and shows a pre-filled notice. Build passes.
- Deployed: no

## Cycle 43 — 02:45 IST
- Print-ready donor certificates (Red Cross-style donor recognition): new /me/certificate page rendering a print-only "Certificate of Gratitude" — donor name, milestone badge, lifetime stats, issued date; header/nav/footer already print:hidden so printing yields just the sheet. Added a local-only "Certificate name" field on /me (stored in localStorage) and a "Print certificate" button on every earned milestone. Build passes.
- Deployed: no

## Cycle 44 — 02:50 IST
- Donation streaks (researched: e-RaktKosh lists "generation of regular repeat donors" as a core module; frequency research shows early-year cadence predicts long-term retention): new donationStreak() in lib/badges.ts counts consecutive 90-day windows anchored at the latest donation; /me shows a "N-window streak" banner at 2+ windows celebrating the donor as a regular. Build passes.
- Deployed: no

## Cycle 45 — 02:55 IST
- Camp RSVPs: blood drives live or die on turnout — every upcoming camp card now has a toggleable "I'm going" button (aria-pressed, persists per-browser in localStorage) and a "N people going — including you" count that organisers can see; counts stored on the CampEvent via updateCamp. Build passes.
- Deployed: no

## Cycle 46 — 03:00 IST
- "Update stock" on the stock board: each blood bank card now has an edit mode with − / + steppers per group (touch-friendly 44px, aria-labelled, live counts) so bank staff or volunteers can report today's stock in seconds; every bump stamps updatedAt, and cards show "N units in stock · updated Xh ago". Seeds and the add-bank form also stamp updatedAt. Build passes.
- Deployed: no

## Cycle 47 — 03:04 IST
- Added a calm app-level error boundary (app/error.tsx): a crash now shows a human message ("your saved data is safe — this is a display hiccup"), a Try again button, and a Go home link, with the error digest for diagnosis — never a blank screen mid-emergency. Build passes.
- Deployed: no

## Cycle 48 — 02:58 IST (watchdog recovery)
- Watchlist hit cards on the home page now have a one-tap "Call" button (tel: link, crimson primary) next to the secondary "View" link: when a new matching donor appears on the watchlist, the fastest path is a phone call, not browsing the directory. Build passes.
- Deployed: no

## Cycle 49 — 03:00 IST (watchdog recovery)
- Request board cards now show a live ready-donor supply count ("N ready donors") on the open tab: compatible, available, past-the-90-day-interval donors per request group, green when covered and red when zero — families see at a glance whether the network can actually cover their emergency before tapping through. Build passes.
- Deployed: no

## Cycle 50 — 03:02 IST (watchdog recovery)
- Team leaderboard cards now show "N ready now" alongside member count and lifetime donations: members available and past their 90-day interval — the number that actually matters when a campus club or neighbourhood team gets pinged for an emergency. Build passes.
- Deployed: no

## Cycle 51 — 03:22 IST
- Blood-bank deferral records (researched insight: e-RaktKosh's donor management tracks and blocks donors based on health/donation history): new Deferral type + useDeferrals() store hook + activeDeferralFor()/isDeferred() helpers with automatic end-date expiry; the eligibility page now has a "Were you deferred at a blood bank?" panel (reason + lift date, logged to the owner's own profile) and /me shows an active-deferral alert banner with a clear-early option. Build passes.
- Deployed: no

## Cycle 52 — 03:28 IST
- Deferral enforcement across the network: deferred donors now rank below everyone in the directory (amber "Deferred until <date>" chip, excluded from "available only" filtering), request match lists sink them to the bottom with the deferral date shown and drop them from the callable count, and each donor card has an inline Defer flow (reason + lift date, mirroring the pause pattern) with a clear-early button. Build passes.
- Deployed: no

## Cycle 53 — 03:36 IST
- Donation appointment booking (researched insight: e-RaktKosh lets donors schedule donation appointments and get reminders — booking the slot converts intent into donations): new Appointment type + useAppointments() store; camps page gained a "Book a slot" flow with auto-generated one-hour slots from each camp's advertised timings (fallback "any time" slot), booked state with cancel; /me shows upcoming appointments with today/tomorrow highlighting and a one-tap "I donated — log it" that records the donation and closes the loop. (First build attempt failed type-check on a variable used before declaration; fixed within the cycle.) Build passes.
- Deployed: no

## Cycle 54 — 03:31 IST
- Component-aware requests (researched insight: e-RaktKosh tracks whole blood, plasma and platelets separately — platelets last ~5 days, so platelet requests are genuinely time-critical): new BloodComponent type on requests with a selector in the request form (plain explainer, autosaved in the draft, carried through repost), component chip on the request detail page and in the header subtitle, and the WhatsApp SOS text + phone script now name the component. Older requests default to whole blood. Build passes.
- Deployed: no

## Cycle 55 — 03:32 IST
- Donation-types education in Learn: new "Three ways to donate — and how often" section (whole blood every 3 months, platelets/plasma via apheresis every 2 weeks, with durations and best-for notes) so donors discover that component donation lets them help far more often — ties directly to the component-aware requests from cycle 54. Build passes.
- Deployed: no

## Cycle 56 — 03:34 IST
- Print-ready emergency flyer: new /requests/[id]/print page rendering a one-page noticeboard poster (oversized blood-group badge — GroupBadge gained an "lg" size — units + component, patient, hospital, big contact number, validity) with screen-only controls; a "Print flyer" button sits next to SOS broadcast on the request detail page. Build passes.
- Deployed: no

## Cycle 57 — 03:35 IST
- Invite-a-donor card on /me (researched insight: blood services grow their regular repeat-donor base through referrals — a personal invite converts better than any poster): new buildInviteText() in share.ts using the owner's saved name, card with pre-written invite copy, one-tap WhatsApp share and a copy-to-clipboard button with copied feedback. Build passes.
- Deployed: no

## Cycle 58 — 03:36 IST
- Rare donor registry section on the donors page (researched insight: e-RaktKosh generates rare blood group donor registries; ICMR-NIIH launched India's national rare donor registry in 2025): a dedicated panel above the directory listing every Rh-negative and rare-phenotype donor with a ready/not-ready dot, "N of M ready now" count, deferral-aware status, and one-tap call buttons for the ready ones. Build passes.
- Deployed: no

## Cycle 59 — 03:38 IST
- Import backup in Settings: the export key list now covers all twelve collections (pledges, watches, patients, deferrals and appointments were silently missing from exports), and a new "Import backup" row restores from an export file with shape validation, per-collection counts, clear error messages, and an auto-reload — the local-first loop is complete for phone changes and browser-data wipes. Build passes.
- Deployed: no

## Cycle 60 — 03:39 IST
- Platelet requests treated as time-critical everywhere: the request form nudges families toward Critical urgency when platelets are selected (they last ~5 days and can't be stocked), the request detail page shows a "Time-critical" badge on open platelet requests, and the board's priority sort now floats platelet requests above same-urgency peers. Build passes.
- Deployed: no

## Cycle 61 — 03:40 IST
- Re-share nudge for stalled requests: an open request with zero pledges after 6 hours now shows an amber "No pledges yet — share again" banner with a one-tap WhatsApp re-share, since the request shared twice is the one that gets answered. Build passes.
- Deployed: no

## Cycle 62 — 03:40 IST
- Apheresis openness on donor registration: a new "I'm open to platelet / plasma donation" checkbox (with the 60–90 min explainer) stores openToApheresis on the donor; request match lists for platelet/plasma requests boost those donors in ranking and show an "apheresis-ready" badge, so component requests reach the right donors first. Build passes.
- Deployed: no

## Cycle 63 — 03:41 IST
- "Add to calendar" for donation appointments on /me: each booked appointment now offers a one-tap .ics download, timed from the booked slot when parseable (all-day fallback), so the appointment survives outside the browser too. Build passes.
- Deployed: no

## Cycle 64 — 03:42 IST
- Duplicate-request merge on the detail page: when an older open request exists for the same group at the same hospital within 24h, the newer request shows a "Possible duplicate" banner with a link to the earlier request and a one-tap "Close as duplicate" action, so donors don't get split across two threads for the same emergency. Build passes.
- Deployed: no

## Cycle 65 — 04:06 IST (watchdog recovery)
- Pledge-fulfillment progress on the request board: each card now shows a slim progress bar with "N/Mu pledged" (green "Fully pledged" state when the goal is met), so families scanning the board see which emergencies are still under-covered without opening every card. Build passes.
- Deployed: no

## Cycle 66 — 04:08 IST (watchdog recovery)
- Stale-stock handling on the blood bank board (researched insight: real bank stock data decays fast — e-RaktKosh banks refresh after every collection): banks untouched for 30+ days now carry an amber "Stock may be stale — call to confirm" badge, and a one-tap "Confirm stock" button refreshes the freshness stamp when the caller verifies the numbers still hold. Build passes.
- Deployed: no

## Cycle 67 — 04:09 IST (watchdog recovery)
- "Pledge goal met" banner on the request detail page: when pledged units cover the request, a green status banner explains the usual next step (confirm by phone, then mark fulfilled) so the request gets closed promptly and donors stop getting called. Build passes.
- Deployed: no

## Cycle 68 — 04:28 IST (researched insight)
- Mini-physical vitals per donation (researched insight: the American Red Cross app's donor card surfaces mini-physical results — BP, pulse, hemoglobin — and donors rate seeing them highly): new DonationVitals type (hemoglobin, BP, pulse, weight) on donation records, a view/edit "Mini-physical" panel on each /me history row with validation, an amber flag + Learn link when hemoglobin is under India's 12.5 g/dL donation cutoff, and vitals columns added to the donation-record CSV export. Build passes.
- Deployed: no

## Cycle 69 — 04:31 IST
- FAQ accordion on Learn: eight first-time-donor questions (who can donate, pain, frequency, food, tattoos, weakness, screening tests, period/pregnancy) answered from blood-bank guidance, in an accessible native-details accordion that needs no JavaScript. Build passes.
- Deployed: no

## Cycle 70 — 04:35 IST
- Installable PWA shell: new app/manifest.ts (name, description, crimson theme colour, standalone display) plus a crimson-droplet app/icon.svg — the local-first app can now be added to a phone's home screen and open like a native app. Build passes (20 routes).
- Deployed: no

## Cycle 71 — 04:38 IST
- Banks board filters: new locality search (matches bank name or area) and an "In stock only" checkbox that hides banks with zero units of the selected group — in an emergency nobody should have to open a bank card just to learn it's empty; the empty state now distinguishes "no banks at all" from "no banks match these filters". Build passes.
- Deployed: no

## Cycle 72 — 04:42 IST
- Cumulative impact strip on /me: donations / units / "lives you could touch" (units × 3, sourced to the American Red Cross figure that one unit can be split into components for up to three recipients) now headline the impact section — the motivating number is visible on day one, not only after a journey completes. Build passes.
- Deployed: no

## Cycle 73 — 04:47 IST
- WhatsApp contact on the donor directory: ready donors now get a green "WhatsApp" button beside "Call" that opens a pre-written, polite first message (name + blood group personalised) — donors often answer a text from an unknown number faster than a call, and it leaves a written record. New buildDonorContactText() helper in lib/share.ts. Build passes.
- Deployed: no

## Cycle 74 — 04:52 IST
- First-visit "How Raktha works" strip on home: three numbered cards (Register → Check eligibility → Answer the call) shown once on first visit, dismissible with a localStorage flag — new visitors (and the seeded demo) get oriented before the data-heavy dashboard. Build passes.
- Deployed: no

## Cycle 75 — 04:57 IST
- Eligibility verdict CTAs: an "eligible" result now offers "Find a camp & book a slot" next to registration (the self-screen should end in a booked donation, not just a verdict), and a "not yet" result links to the new donor FAQs so temporary deferrals come with guidance; touch targets brought to 44px. Build passes.
- Deployed: no

## Cycle 76 — 04:57 IST (watchdog recovery)
- Fulfilled-request loop closure: fulfilled requests now show a "Record the donations" panel — tick who actually donated, pledges matched to registered donors by phone (name fallback) get a real DonationRecord at the hospital plus updated lifetime count and last-donation/next-eligible dates; unmatched pledges just close out. A `recorded` flag on pledges prevents double-counting. Build passes.
- Deployed: no

## Cycle 77 — 04:59 IST (watchdog recovery)
- Indian mobile hygiene: new `normalizeIndianPhone` / `isValidIndianMobile` in lib/blood.ts — accepts "+91 98765 43210", "09876543210", "919876543210", validates 10 digits starting 6–9, and stores the canonical "+91 XXXXX XXXXX" form. Applied to the emergency request form and donor registration, so phone matching (pledge → donor history) and tel: links stop breaking on format drift. Build passes.
- Deployed: no

## Cycle 78 — 05:02 IST (watchdog recovery)
- Print flyer tear-off contact strips: a row of dashed-border tear-off tabs under the flyer with the contact number, blood group, and "Blood needed" header — the classic noticeboard trick so a passerby tears one off and keeps the number. Vertical phone on narrow screens, horizontal on wide; prints on the same page. Build passes.
- Deployed: no
