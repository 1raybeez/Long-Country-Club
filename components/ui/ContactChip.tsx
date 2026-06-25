import Image from "next/image";

type ContactChipProps = {
  readonly method: string;
};

type ContactMethodDisplay = {
  readonly label: string;
  readonly logoSrc?: string;
  readonly logoAlt: string;
};

export function ContactChip({ method }: ContactChipProps) {
  const contact = getContactMethodDisplay(method);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--lcc-border)] bg-[var(--lcc-surface)] px-2.5 py-1.5 font-ui text-[0.68rem] font-black uppercase text-[var(--lcc-text)]">
      {contact.logoSrc && (
        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[var(--lcc-gold-soft)]">
          <Image
            src={contact.logoSrc}
            alt={contact.logoAlt}
            width={20}
            height={20}
            className="h-[18px] w-[18px] object-contain"
          />
        </span>
      )}
      {contact.label}
    </span>
  );
}

function getContactMethodDisplay(method: string): ContactMethodDisplay {
  const normalizedMethod = method.toLowerCase();

  if (normalizedMethod.includes("sleeper")) {
    return {
      label: "Sleeper DM",
      logoSrc: "/logos/Sleeper.png",
      logoAlt: "Sleeper logo",
    };
  }

  if (normalizedMethod.includes("whatsapp")) {
    return {
      label: "WhatsApp",
      logoSrc: "/logos/WhatsApp.png",
      logoAlt: "WhatsApp logo",
    };
  }

  if (normalizedMethod.includes("venmo")) {
    return {
      label: "Venmo",
      logoSrc: "/logos/Venmo.png",
      logoAlt: "Venmo logo",
    };
  }

  if (
    normalizedMethod.includes("text") ||
    normalizedMethod.includes("imessage")
  ) {
    return {
      label: "Text / iMessage",
      logoSrc: "/logos/iMessage.png",
      logoAlt: "iMessage logo",
    };
  }

  return {
    label: method,
    logoAlt: "",
  };
}
