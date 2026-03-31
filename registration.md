---
title: Registration
hero_kicker: Attendance
hero_title: Registration Pathways And Fee Schedule
hero_text: Complete registration and payment below. After successful payment, the abstract submission link is sent automatically by email.
---

## Registration Windows

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Period</th>
        <th>Window</th>
        <th>Regular</th>
        <th>Research Staff</th>
        <th>Student</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Early Bird + Abstract Submission</td><td><span class="date">May 1–August 1, 2026</span></td><td>USD 450</td><td>USD 350</td><td>USD 250</td></tr>
      <tr><td>General + Abstract Submission</td><td><span class="date">August 2–23, 2026</span></td><td>USD 500</td><td>USD 400</td><td>USD 300</td></tr>
      <tr><td>Late Registration + Poster Abstracts Only</td><td><span class="date">August 24–September 25, 2026</span></td><td>USD 550</td><td>USD 450</td><td>USD 350</td></tr>
    </tbody>
  </table>
</div>

<div class="callout">
  Payment is verified through Stripe Checkout. The abstract submission link is emailed only after confirmed payment.
</div>

<section class="card registration-flow" aria-label="Automated registration and payment">
  <h2>Automated Registration And Payment</h2>
  <p class="small">
    Submit your details, select a ticket type, and continue to secure Stripe Checkout.
  </p>

  <form id="registration-payment-form" data-checkout-form>
    <div class="form-grid two-col">
      <div>
        <label for="fullName">Full Name</label>
        <input id="fullName" name="fullName" type="text" required>
      </div>
      <div>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required>
      </div>
    </div>

    <div class="form-grid two-col">
      <div>
        <label for="affiliation">Affiliation / Institution</label>
        <input id="affiliation" name="affiliation" type="text" required>
      </div>
      <div>
        <label for="ticketType">Ticket Type</label>
        <select id="ticketType" name="ticketType" required>
          <option value="regular">Regular</option>
          <option value="research">Research Staff</option>
          <option value="student">Student</option>
        </select>
      </div>
    </div>

    <div class="form-grid two-col">
      <div>
        <label for="pricingWindow">Pricing Window</label>
        <select id="pricingWindow" name="pricingWindow" required>
          <option value="early">Early Bird</option>
          <option value="general">General</option>
          <option value="late">Late</option>
        </select>
      </div>
      <div>
        <label>Selected Fee</label>
        <p id="selected-fee" class="fee-preview">USD 450</p>
      </div>
    </div>

    <button class="button primary" type="submit" data-submit-button>
      Continue To Secure Checkout
    </button>
    <p class="small" id="checkout-message" aria-live="polite"></p>
  </form>
</section>

<div class="callout">
  <strong>Fundraising has moved:</strong> The donation checkout is now in a dedicated section.
</div>

<p>
  <a class="button" href="{{ '/fundraising/' | relative_url }}">Go To Fundraising Support</a>
</p>

## Optional Additional Details Form

If you want to collect extra organizer fields before payment, embed a Google Form below and keep payment as the source-of-truth step.

<iframe
  title="Optional pre-registration Google Form"
  width="100%"
  height="620"
  src="https://docs.google.com/forms/d/e/YOUR_REGISTRATION_FORM_ID/viewform?embedded=true"
  frameborder="0"
  marginheight="0"
  marginwidth="0"
  loading="lazy"
  style="border: none; max-width: 100%;">
</iframe>

## Integration Notes

- Set your backend API base URL in `window.ISPVP_CONFIG.CHECKOUT_API_BASE` inside `assets/js/main.js`.
- Configure Stripe price IDs for each ticket type and pricing window in the backend env vars.
- Do not place Stripe secret keys in this repository.

## 2026 Venue Window

- Arrival and registration: <span class="date">Tuesday, October 20, 2026</span>
- Meeting day 1: <span class="date">Wednesday, October 21, 2026</span>
- Meeting day 2: <span class="date">Thursday, October 22, 2026</span>
- Meeting day 3: <span class="date">Friday, October 23, 2026</span>

## What Registration Includes

- Access to all scientific sessions and plenary lectures.
- Poster sessions, welcome reception, and conference dinner.
- Program materials and digital abstract book.
- Coffee breaks and designated lunches.

## Cancellation Policy

- Full refund minus processing fee until 30 days before symposium start.
- Fifty percent refund for cancellations 14-29 days before symposium start.
- No refund within 14 days of symposium start; substitution is permitted.
