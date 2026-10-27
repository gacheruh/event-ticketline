# Ticketline direction

Primary language: English (international event audience in Kenya).  
Anchor type: diagram — a restrained capacity gauge that makes remaining inventory legible at a glance.

## Recommended direction

R1 Utility, with warm ink neutrals and a safety-orange action hue derived from the brand scale. The dashboard treats every ticket type as a live inventory line: name, price, remaining seats, and an explicit capacity bar. There are no decorative photos because the product's thing-to-see is inventory state, not an invented event scene. The action is a native-form availability picker with a live KES total; it is direct, keyboard accessible, and declares its assumptions.

References were chosen for operational clarity rather than visual imitation: GOV.UK's form guidance (plain task language), Stripe's payment flows (transparent totals), Kenya's M-Pesa payment conventions (KES-first presentation), airline seat-selection patterns (availability shown before commitment), and printed venue tickets (a real-world information hierarchy of event, tier, seat/count, and confirmation).

## Alternative

R2 Composed: a bolder event poster area and a customer-facing catalog. It would suit public event marketing, but adds art-direction cost and would distract from this project’s operational reliability demo.

## Proposals to confirm

- Payments are intentionally out of scope for the first build; an order is confirmed by the API request.
- KES is the initial currency; multi-currency pricing is a future extension.

## Review record

- Gate 0: API syntax checks passed; automated route checks cover health, empty inventory, and invalid order rejection.
- Gate 1: native labels, semantic sections, a skip link, visible focus states, and `aria-live` results are present.
- Gate 3: the capacity gauge is the sole visual anchor; no fabricated photos, metrics, testimonials, or urgency cues are used.
- Gate 5: the availability picker updates the KES total and visible remaining count; the final order action carries the selected values.
- Gate 6: mobile layout stacks the workspace and keeps the purchase output above its confirmation action.
- Gate 10: reduced-motion preference is respected; controls meet the 44px target-size floor.
- Gate 13: full browser screenshot, token compilation, and contrast-script evidence are blocked in this environment because Python and Docker are unavailable.
