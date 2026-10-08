"use client";

import { useId, useState, type FormEvent } from "react";

type Props = { source: "drop" | "newsletter"; cta: string; placeholder?: string; tone?: "dark" | "light" };

/** Formulaire e-mail (liste d'accès anticipé / newsletter). Envoie vers /api/notify. */
export function EmailForm({ source, cta, placeholder = "ton@email.com", tone = "dark" }: Props) {
  const id = useId();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setState("loading");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState("ok");
      setMessage(source === "drop" ? "C'est noté. Tu seras prévenu·e avant tout le monde." : "Bienvenue dans la famille ILUR.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error && err.message ? err.message : "Oups, réessaie dans un instant.");
    }
  }

  const border = tone === "dark" ? "border-bone/30 focus-within:border-pink" : "border-ink/30 focus-within:border-ink";

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <label htmlFor={id} className="sr-only">
        Adresse e-mail
      </label>
      <div className={`flex flex-col gap-3 border-b pb-3 transition-colors sm:flex-row sm:items-center ${border}`}>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={placeholder}
          disabled={state === "loading" || state === "ok"}
          className="mono min-h-11 flex-1 bg-transparent text-sm normal-case placeholder:text-current placeholder:opacity-40 focus:outline-none"
        />
        <button type="submit" className="btn-pink shrink-0" disabled={state === "loading" || state === "ok"}>
          {state === "loading" ? "…" : state === "ok" ? "Inscrit ✓" : cta}
        </button>
      </div>
      <p role="status" aria-live="polite" className={`mono mt-3 min-h-5 text-[11px] ${state === "error" ? "text-pink" : "opacity-70"}`}>
        {message}
      </p>
    </form>
  );
}
