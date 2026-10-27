# Ticketline design brief

## Classification

New product; production implementation. Standard mode.

## Product and users

Ticketline lets Kenyan event organisers create ticketed events and lets attendees purchase a confirmed ticket. The primary operator job is to see availability and fulfil purchases without overselling. The primary buyer job is to confirm that tickets are available and complete a purchase.

## Assumptions

- Market: Kenya; English is the initial interface language; KES is used for prices and dates use EAT.
- Device mix: organisers primarily use laptop browsers; buyers may use mobile browsers.
- Existing design system: none found (maturity level 0). This project creates a small token system.
- Brand assets: none supplied. The visual anchor is an inventory gauge, not photography.

## Direction choices

- Surface mode: Operate for the organiser dashboard; transaction-focused buyer route.
- Register: R1 Utility. This is a repeated, high-consequence inventory task; clarity and recovery states matter more than decorative treatment.
- Interaction depth: I2 Functional. A buyer selects a ticket type and quantity and sees a live total and remaining capacity.
- Signature interaction: availability picker; its visible result is carried into order creation.
- Memorable thing: **capacity you can trust.**
- Attributes: precise, composed, reliable, calm under load.
- Anti-attributes: festival-cliché, generic SaaS dashboard, false scarcity, glossy spectacle.

## Done criteria

- A local Docker Compose run starts API, worker, PostgreSQL, Redis, and Mailpit.
- An organiser can create an event and ticket type; a buyer can place an order.
- Inventory is updated atomically and a confirmation job is consumed exactly once.
- UI uses project design tokens and meets WCAG AA checks.
