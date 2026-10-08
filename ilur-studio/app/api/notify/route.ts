import { NextResponse } from "next/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Inscription liste d'accès anticipé / newsletter.
 * Branche ici ton outil d'e-mailing (Klaviyo, Brevo, Mailchimp…) — voir README.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  const source = body.source === "drop" ? "drop" : "newsletter";

  // TODO : envoyer `email` vers ton fournisseur d'e-mailing.
  console.info(`[notify] ${source}: ${email}`);

  return NextResponse.json({ ok: true });
}
