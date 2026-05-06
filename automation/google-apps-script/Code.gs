const CONFIG = {
  SHEET_ID: '1KAF40YJS1vtn--OCOpJS0S0Ed9WqqK1kCasusSEgX_M',
  SHEET_NAME: 'registrations',
  SHARED_SECRET: '3ZbZl5b5Endgr6KmFDQ9LF2Bb+osFpBqX2TOhc1CsUzcPDil88tlQQY7YZJmSYJD',
  ABSTRACT_FORM_BASE_URL_EARLY_GENERAL: 'https://docs.google.com/forms/d/e/1FAIpQLSfF36B7vCK3crMuTEpiGzNIyT-hhYLubie7l33VNblfQe1RAw/viewform',
  ABSTRACT_FORM_BASE_URL_LATE: 'https://docs.google.com/forms/d/e/1FAIpQLSfxtbR5NR7yzJILlS6SsYg_pQvK2Quipu8bPeM_wLN_2u7FKQ/viewform',
  ABSTRACT_TOKEN_ENTRY_ID: 'entry.1234567890',
  PROGRAM_EMAIL: 'ispvpconference5@gmail.com'
};

const HEADERS = [
  'event_id',
  'session_id',
  'payment_intent_id',
  'paid_at',
  'name',
  'email',
  'affiliation',
  'ticket_type',
  'pricing_window',
  'amount_total',
  'currency',
  'payment_status',
  'abstract_token',
  'email_sent_at',
  'submission_used_at',
  'notes'
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const isDonation = inferDonation_(payload);

    if (payload.secret !== CONFIG.SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    const sheet = getSheet_();
    const sessionId = payload.sessionId || '';
    if (!sessionId) {
      return jsonResponse({ ok: false, error: 'Missing sessionId' });
    }

    const existingRow = findRowBySessionId_(sheet, sessionId);

    const rowValues = [
      payload.eventId || '',
      sessionId,
      payload.paymentIntentId || '',
      payload.paidAt || new Date().toISOString(),
      payload.name || '',
      payload.email || '',
      payload.affiliation || '',
      payload.ticketType || '',
      payload.pricingWindow || '',
      payload.amountTotal || '',
      payload.currency || '',
      'paid',
      payload.abstractToken || '',
      '',
      '',
      isDonation ? 'fundraising' : 'registration'
    ];

    let targetRow = existingRow;
    if (targetRow > 0) {
      const existingData = sheet.getRange(targetRow, 1, 1, HEADERS.length).getValues()[0];
      rowValues[13] = existingData[13] || '';
      rowValues[14] = existingData[14] || '';
      rowValues[15] = existingData[15] || (isDonation ? 'fundraising' : 'registration');
      sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      targetRow = sheet.getLastRow();
    }

    // Send email only once.
    const emailSentAt = sheet.getRange(targetRow, 14).getValue();
    if (!emailSentAt && payload.email) {
      const abstractLink = buildAbstractLink_(payload.abstractToken || '', payload.pricingWindow || '');
      const paymentReceiptUrl = String(payload.paymentReceiptUrl || '').trim();
      const subject = isDonation
        ? 'ISPVP fundraising payment confirmed: thank you for your support'
        : 'ISPVP payment confirmed: abstract submission link';
      const bodyLines = [
        `Dear ${payload.name || 'Participant'},`,
        '',
        isDonation
          ? 'Your ISPVP fundraising payment has been confirmed.'
          : 'Your ISPVP registration payment has been confirmed.',
      ];

      if (paymentReceiptUrl) {
        bodyLines.push(
          '',
          'Payment receipt:',
          paymentReceiptUrl
        );
      }

      if (isDonation) {
        bodyLines.push(
          '',
          'Thank you for funding ISPVP. Your support helps student travel awards and scientific outreach.',
          '',
          'Best regards,',
          'ISPVP Organizing Committee'
        );
      } else {
        bodyLines.push(
          '',
          'Submit your abstract using the secure paid-participant link below:',
          abstractLink,
          '',
          'If the link does not open, contact registration@ispvp.org.',
          '',
          'Best regards,',
          'ISPVP Organizing Committee'
        );
      }

      const body = bodyLines.join('\n');

      const mailOptions = getMailOptions_();
      GmailApp.sendEmail(payload.email, subject, body, mailOptions);

      sheet.getRange(targetRow, 14).setValue(new Date());
    }

    return jsonResponse({ ok: true, row: targetRow });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'ispvp-automation-webhook',
    message: 'Web app is deployed. Send POST requests to this endpoint for webhook processing.'
  });
}

function validateAbstractToken(token) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const header = data[0];
  const tokenIndex = header.indexOf('abstract_token');
  const paymentIndex = header.indexOf('payment_status');
  const usedIndex = header.indexOf('submission_used_at');

  if (!token || tokenIndex < 0 || paymentIndex < 0 || usedIndex < 0) {
    return { ok: false, reason: 'invalid_config' };
  }

  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][tokenIndex]) === String(token)) {
      if (String(data[i][paymentIndex]).toLowerCase() !== 'paid') {
        return { ok: false, reason: 'not_paid' };
      }
      if (data[i][usedIndex]) {
        return { ok: false, reason: 'token_used' };
      }
      return { ok: true, row: i + 1 };
    }
  }

  return { ok: false, reason: 'token_not_found' };
}

function markTokenUsed(token) {
  const result = validateAbstractToken(token);
  if (!result.ok) {
    return result;
  }

  const sheet = getSheet_();
  sheet.getRange(result.row, 15).setValue(new Date());
  return { ok: true };
}

function buildAbstractLink_(token, pricingWindow) {
  const baseUrl = getAbstractFormBaseUrl_(pricingWindow);

  if (!token || !CONFIG.ABSTRACT_TOKEN_ENTRY_ID) {
    return baseUrl;
  }

  const query = `${CONFIG.ABSTRACT_TOKEN_ENTRY_ID}=${encodeURIComponent(token)}`;
  return `${baseUrl}?usp=pp_url&${query}`;
}

function getAbstractFormBaseUrl_(pricingWindow) {
  const windowValue = String(pricingWindow || '').toLowerCase();
  if (windowValue === 'late') {
    return CONFIG.ABSTRACT_FORM_BASE_URL_LATE;
  }

  return CONFIG.ABSTRACT_FORM_BASE_URL_EARLY_GENERAL;
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function findRowBySessionId_(sheet, sessionId) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return -1;
  }

  const header = data[0];
  const sessionIndex = header.indexOf('session_id');
  if (sessionIndex < 0) {
    return -1;
  }

  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][sessionIndex]) === String(sessionId)) {
      return i + 1;
    }
  }

  return -1;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMailOptions_() {
  const options = {};
  const email = String(CONFIG.PROGRAM_EMAIL || '').trim();

  // Avoid bounce notices caused by malformed BCC addresses.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    options.bcc = email;
  }

  return options;
}

function inferDonation_(payload) {
  const checkoutType = String(payload.checkoutType || '').toLowerCase();
  if (checkoutType === 'donation') {
    return true;
  }

  // Backward-compatible fallback: donation events usually have no ticket/pricing/abstract token.
  const hasTicketType = Boolean(String(payload.ticketType || '').trim());
  const hasPricingWindow = Boolean(String(payload.pricingWindow || '').trim());
  const hasAbstractToken = Boolean(String(payload.abstractToken || '').trim());
  return !hasTicketType && !hasPricingWindow && !hasAbstractToken;
}
