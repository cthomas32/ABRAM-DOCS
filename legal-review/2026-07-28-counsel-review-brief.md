# Counsel Review Brief — Payments Restructure

**Prepared:** July 28, 2026
**Entity:** Thomas Abram, LLC (Washington, DC)
**Platform:** ABRAM (app.abram.network)
**Documents affected:** Terms of Use §4.1, §8.2, §8.3, §8.4, §8.7 (new); Privacy Policy §2.1
**Status:** Changes are live in production. This brief requests review, not drafting.

> Prepared by ABRAM's engineering process, not by an attorney. Nothing here is legal
> advice. The purpose is to give counsel the factual and technical background needed to
> assess the language that was deployed, and to flag the specific questions we believe
> require professional judgment.

---

## 1. What changed technically (the facts the language rests on)

ABRAM previously processed user-to-user payments as Stripe Connect **destination
charges** on Express connected accounts. Under that configuration, Stripe debits the
**platform's** balance for refunds and chargebacks — meaning ABRAM was, as a matter of
fund flow, the risk-bearing party for transactions between its users, regardless of what
the Terms said.

That has been restructured. Payments between users are now **direct charges** created on
the payee's own connected account, which is configured so that:

| Property | Value | Effect |
|---|---|---|
| `controller.losses.payments` | `stripe` | Stripe, not ABRAM, bears unrecoverable negative balances |
| `controller.fees.payer` | `account` | The payee pays Stripe's processing fees |
| `controller.stripe_dashboard.type` | `full` | The payee has a full Stripe dashboard and manages their own refunds and disputes |

Consequences relevant to the documents:

- The **payee is the merchant of record** on every user-to-user transaction. Funds settle
  directly to the payee's Stripe account; ABRAM never takes custody of them.
- Refunds are issued by the payee from their own Stripe dashboard. ABRAM has no
  operational role in a user-to-user refund and cannot fund one.
- Chargebacks are debited from the payee's balance, not ABRAM's.
- Each payee separately accepts the **Stripe Connected Account Agreement** during
  onboarding, which is where their merchant obligations are defined.
- ABRAM's compensation is an `application_fee_amount` collected on each transaction (the
  "Processing Fee"), plus subscription revenue.

**Why this matters for review:** the previous Terms disclaimed payment liability that
ABRAM in fact bore. The current Terms disclaim liability that ABRAM genuinely does not
bear. Counsel should confirm the language now matches the structure.

---

## 2. Processing Fee — structure and the non-refundable term

The Processing Fee is charged on payments between users, at a rate determined by the
**payee's** subscription plan, with a monthly fee-free volume allowance on paid plans:

| Plan | Rate | Monthly fee-free volume |
|---|---|---|
| Free / Solo Lite | 3% | — |
| Solo Pro | 1% | first $10,000 |
| Team | 0.89% | first $50,000 |
| Studio | 0.5% | first $100,000 |
| Enterprise | Custom (never zero) | Custom |

The allowance is applied marginally — only the portion of a payment above the remaining
monthly allowance is charged.

**Disclosure surfaces.** The fee is shown as a labeled line item ("Processing Fee") on the
invoice or quote before the payer pays; the rate and allowances are published on the
public pricing page; and the sentence *"The processing fee is non-refundable once payment
is completed"* appears on the payment surface and in the invoice PDF footer.

**The term under review (ToS §8.7):** the fee is retained by ABRAM when the underlying
payment is later refunded by the payee or reversed through a dispute, except where a
refund of the fee is required by applicable law. Rate and allowance changes apply
prospectively only.

**Implementation note:** the code default is to retain the fee on every refund path. A
platform-staff-only override exists (`refundApplicationFee`) to return the fee in an
individual case, with the decision recorded in the transaction ledger. This exists
specifically so a legally-required refund can be honored without a code change.

---

## 3. Sales tax

ABRAM has activated Stripe Tax for **its own** sales (subscriptions and AI credit
purchases). Head office is set to the DC address; products are classified as
`txcd_10103001` (Software as a Service — Business Use). Tax is calculated at checkout and
shown to the buyer.

**Currently there are zero tax registrations configured**, so Stripe calculates $0 tax
everywhere. Stripe's threshold monitoring is now active and will indicate where economic
nexus is being approached.

Transactions **between users** are not taxed by ABRAM; ToS §8.4 places that responsibility
on the transacting parties, consistent with the payee being the merchant of record.

---

## 4. Privacy Policy change

One material addition (§2.1): billing address is collected for sales-tax calculation, and
identity/banking details submitted during Stripe onboarding are collected **by Stripe as
the account provider**, not by ABRAM. With full-dashboard connected accounts, Stripe
determines the purposes and means of processing that KYC data.

---

## 5. Questions for counsel

**Payments structure**
1. Does the current §4.1 / §8.2 / §8.3 language accurately and sufficiently disclaim
   liability given the direct-charge structure described in §1 above?
2. Does the structure (payee as merchant of record, ABRAM never taking custody of user
   funds, Stripe as the licensed processor) keep ABRAM outside **money transmitter**
   licensing obligations in DC and in states where users are located? This was a principal
   motivation for the restructure and we would like it confirmed rather than assumed.
3. Should the Terms expressly incorporate the Stripe Connected Account Agreement by
   reference, or is the current descriptive reference sufficient?

**Non-refundable fee (§8.7)**
4. Is the non-refundable term enforceable as drafted, and is the disclosure (pricing page,
   pre-payment line item, one-line notice at the payment surface, invoice footer)
   sufficient to support it under FTC Act §5 and state UDAP statutes?
5. Are there specific carve-outs we should name rather than rely on the general "except
   where required by applicable law" language — e.g. California's automatic renewal law
   for subscriptions, or consumer withdrawal rights if we take non-US consumers?
6. Does the "Processing Fee" label and its presentation satisfy mandatory fee-disclosure
   and all-in pricing rules (FTC unfair-or-deceptive-fees rule; California SB 478), given
   the fee is added to the invoice total rather than embedded in the advertised price?
7. Is prospective-only fee change notice adequate, or should a specific notice period be
   committed to in the Terms?

**Pre-existing clauses worth a look while the document is open**
8. §8.6 restricts moving a platform-formed relationship off-platform to avoid fees for 12
   months. Is this enforceable across the states where our users work, and is the drafting
   defensible as a fee-protection measure rather than a restraint on trade?
9. §6.2 makes AI-training use of user data a separate, non-bundled opt-in. Please confirm
   this satisfies the consent standards we are subject to.

**Tax (may be for the CPA rather than counsel)**
10. Where does Thomas Abram, LLC have an obligation to register and collect sales tax on
    SaaS subscriptions today, starting with DC? We would like a registration list before
    enabling collection, since registering in Stripe asserts a filing obligation.
11. Is `txcd_10103001` (SaaS — Business Use) the correct classification given that some
    subscribers are individual professionals rather than entities?

---

## 6. Where to find the documents

- Terms of Use — `user-guide/ABRAM_Terms_of_Use.md` (published at abram.network/terms-of-use)
- Privacy Policy — `user-guide/ABRAM_Privacy_Policy.md` (published at abram.network/privacy-policy)
- Pricing and fee schedule — abram.network/pricing
- Payment architecture (engineering reference) — `docs/PAYMENT_ARCHITECTURE.md` in the
  application repository

Both legal documents carry **Effective Date: July 27, 2026 | Last Updated: July 28, 2026**.
If counsel's review results in substantive changes, the Effective Date should be revisited
and existing users notified per the change-notification terms in each document.
