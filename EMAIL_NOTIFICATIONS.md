# Site launch notifications

The maintenance page posts visitor email addresses to the Vercel Function at `/api/notify`. The destination address and email provider key are read only by the server from Vercel environment variables; neither is included in the page source.

## Configure Vercel

1. Create a Resend account and verify a domain you control for sending.
2. Create a Resend API key with sending access for that verified domain.
3. In the Vercel project, open **Settings → Environment Variables** and add these variables for Production (and Preview if needed):
   - `RESEND_API_KEY`: the Resend API key.
   - `RESEND_FROM_EMAIL`: a sender address on the verified domain, such as `Zioners <updates@your-verified-domain.example>`.
   - `SITE_NOTIFICATION_EMAIL`: the private inbox that should receive sign-up notices.
4. Redeploy the project so the function receives the variables.

Each valid submission sends an email notice to the private inbox, with the visitor's address as the reply-to. The current implementation does not keep a separate mailing list, so save the addresses from those notices if you plan to send a launch announcement.
