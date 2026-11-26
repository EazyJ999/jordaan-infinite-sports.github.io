import { WHATSAPP_NUMBER } from "@/lib/whatsapp-order";

const SOCIALS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/jordaan_infinitesports/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@jordansportclothingrsa",
  },
  {
    id: "google",
    label: "Google review",
    href: "https://g.page/r/CZ9bDdaEPGaBEAI/review",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
] as const;

export function SocialLinks() {
  return (
    <div className="flex items-center gap-3">
      {SOCIALS.map((social) => (
        <a
          key={social.id}
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={social.label}
          className="inline-flex h-11 w-11 items-center justify-center bg-[#0e0e0e] text-[#c6de12] hover:text-white"
        >
          <SocialIcon id={social.id} />
        </a>
      ))}
    </div>
  );
}

function SocialIcon({ id }: { id: (typeof SOCIALS)[number]["id"] }) {
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8A3.2 3.2 0 0 0 19.2 16V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.3 6.4a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"
        />
      </svg>
    );
  }
  if (id === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M14.2 3c.4 2.4 1.8 4 4.1 4.4v2.5a7 7 0 0 1-4.1-1.3v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.7a3 3 0 1 0 2.1 2.9V3z"
        />
      </svg>
    );
  }
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          fill="currentColor"
          d="M12 2.2l2.4 6.6h6.8l-5.5 4.2 2.1 6.7L12 15.8 6.2 19.7l2.1-6.7L2.8 8.8h6.8z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 20.5 3.5zM12 20.3a8.3 8.3 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.3 8.3 0 1 1 12 20.3z"
      />
    </svg>
  );
}
