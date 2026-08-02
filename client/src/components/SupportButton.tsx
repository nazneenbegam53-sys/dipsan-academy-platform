import { useEffect, useRef, useState } from "react";

const SUPPORT_PHONES = [
  { display: "8617377547", wa: "918617377547" },
  { display: "9734721311", wa: "919734721311" },
] as const;

/** Typed as gamil in the request — corrected to gmail so the link works */
const SUPPORT_EMAIL = "asishdip2020@gmail.com";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.6 3.8c.4-.4 1.1-.5 1.6-.2l2.3 1.3c.5.3.7.9.5 1.4l-.8 2.1c-.1.4 0 .8.3 1.1l2.4 2.4c.3.3.7.4 1.1.3l2.1-.8c.5-.2 1.1 0 1.4.5l1.3 2.3c.3.5.2 1.2-.2 1.6l-1.2 1.2c-.5.5-1.2.7-1.9.5-1.7-.5-3.7-1.9-5.6-3.8-1.9-1.9-3.3-3.9-3.8-5.6-.2-.7 0-1.4.5-1.9L6.6 3.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SupportButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative z-[1] inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-mist transition hover:border-gold hover:bg-gold/20 sm:h-11 sm:w-11"
        aria-label="Support contacts"
        aria-expanded={open}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),340px)] overflow-hidden rounded-2xl border border-white/10 bg-coal shadow-2xl">
          <div className="border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="text-sm font-semibold text-mist">Contact support</div>
            <p className="mt-0.5 text-xs text-bronze">Call, WhatsApp, or email.</p>
          </div>
          <ul className="divide-y divide-white/5 p-1.5 sm:p-2">
            {SUPPORT_PHONES.map((p) => (
              <li key={p.display} className="flex flex-wrap items-center gap-2 rounded-xl px-2 py-2 sm:flex-nowrap sm:px-3 sm:py-2.5">
                <span className="min-w-0 flex-1 text-sm font-semibold tracking-wide text-mist">
                  {p.display}
                </span>
                <a
                  href={`tel:+91${p.display}`}
                  className="inline-flex items-center gap-1 rounded-full border border-aurora/35 bg-aurora/10 px-2 py-1.5 text-[10px] font-semibold text-aurora transition hover:border-aurora hover:bg-aurora/20 sm:gap-1.5 sm:px-2.5 sm:text-[11px]"
                  aria-label={`Call ${p.display}`}
                >
                  <PhoneIcon />
                  <span className="sm:inline">Call</span>
                </a>
                <a
                  href={`https://wa.me/${p.wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-2 py-1.5 text-[10px] font-semibold text-[#25D366] transition hover:border-[#25D366] hover:bg-[#25D366]/20 sm:gap-1.5 sm:px-2.5 sm:text-[11px]"
                  aria-label={`WhatsApp ${p.display}`}
                >
                  <WhatsAppIcon />
                  <span className="sm:hidden">WA</span>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-mist transition hover:bg-white/5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aurora/15 text-aurora">
                  <MailIcon />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-wide">{SUPPORT_EMAIL}</span>
                  <span className="text-[11px] text-bronze">Email</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SupportButton;
