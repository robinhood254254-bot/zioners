const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const origin = request.headers.origin;
  const requestHost = request.headers["x-forwarded-host"] || request.headers.host;
  if (origin && new URL(origin).host !== requestHost) {
    return response.status(403).json({ error: "Request not allowed" });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  } catch {
    return response.status(400).json({ error: "Invalid request" });
  }

  if (!body || typeof body !== "object") {
    return response.status(400).json({ error: "Invalid request" });
  }

  // Quietly accept bot submissions without sending email.
  if (typeof body.website === "string" && body.website.trim()) {
    return response.status(200).json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ error: "Enter a valid email address" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.SITE_NOTIFICATION_EMAIL;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    console.error("Notification email is not configured");
    return response.status(503).json({ error: "Notifications are temporarily unavailable" });
  }

  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: "New site launch notification request",
        text: `A visitor asked to be notified when the Zioners site is ready.\n\nEmail: ${email}`
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!result.ok) {
      console.error("Notification email provider returned an error", result.status);
      return response.status(502).json({ error: "Could not send notification request" });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Notification email request failed", error.name);
    return response.status(502).json({ error: "Could not send notification request" });
  }
};
