import Link from "next/link";

export function Mark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
        <rect x="1" y="1" width="30" height="30" rx="9" fill="currentColor" />
        <path d="M8.5 16.4 13.2 21l10.3-10" stroke="var(--brand-mark-line)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.8 9.3h6.8" stroke="var(--brand-mark-line)" strokeWidth="1.8" strokeLinecap="round" opacity=".52" />
      </svg>
    </span>
  );
}

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="brand-lockup" aria-label="VeriFit home">
      <Mark size={32} />
      {!compact ? <span className="brand-name">VeriFit</span> : null}
    </Link>
  );
}
