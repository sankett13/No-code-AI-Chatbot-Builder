import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as ContactPayload | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const {
      name,
      email,
      subject = "New contact form submission",
      message,
    } = body;
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic length limits to avoid abuse
    if (
      name.length > 200 ||
      (subject && subject.length > 200) ||
      message.length > 5000
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 413 }
      );
    }

    // Compose email content
    const text = `Contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.4;color:#111">
        <h2>Contact form submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>
      </div>
    `;

    // Check SMTP configuration in environment
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const CONTACT_TO = process.env.CONTACT_TO || process.env.SMTP_USER;
    const CONTACT_FROM = process.env.CONTACT_FROM || SMTP_USER;

    // If SMTP not configured, fallback to logging only but return queued response
    if (
      !SMTP_HOST ||
      !SMTP_PORT ||
      !SMTP_USER ||
      !SMTP_PASS ||
      !CONTACT_TO ||
      !CONTACT_FROM
    ) {
      console.warn(
        "/api/contact: SMTP not configured, logging payload instead",
        { name, email, subject }
      );
      console.log(text);
      return NextResponse.json(
        { ok: true, status: "queued", note: "smtp_not_configured" },
        { status: 202 }
      );
    }

    // Determine secure mode: allow explicit override via SMTP_SECURE env var,
    // otherwise infer from port (465 => secure)
    const SMTP_SECURE_ENV = process.env.SMTP_SECURE;
    const SMTP_SECURE =
      typeof SMTP_SECURE_ENV !== "undefined"
        ? SMTP_SECURE_ENV === "true"
        : SMTP_PORT === 465;

    // Create transporter with explicit secure mode. When secure is true we
    // require TLS. This ensures the SMTP connection is encrypted (SMTPS).
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // use SMTPS when true
      requireTLS: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      subject: `[Contact] ${subject}`,
      text,
      html,
      replyTo: email,
    });

    console.log(`/api/contact: email sent (${info.messageId})`);

    return NextResponse.json(
      { ok: true, status: "sent", id: info.messageId },
      { status: 200 }
    );
  } catch (err) {
    console.error("/api/contact error", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
