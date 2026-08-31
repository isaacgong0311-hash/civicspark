// A custom capitol-medallion mark — replaces the generic "icon in a gradient
// rounded square" app-icon pattern with something that reads as a federal seal.
export default function Seal({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" role="img">
      <circle cx="20" cy="20" r="19" fill="#0d1f3c" stroke="#b8830e" strokeWidth="1.3" />
      <circle cx="20" cy="20" r="15.6" fill="none" stroke="#b8830e" strokeWidth="0.6" opacity="0.55" />
      {/* dome */}
      <path d="M20 10.2c-2.7 0-4.9 2.5-4.9 5.6h9.8c0-3.1-2.2-5.6-4.9-5.6z" fill="#fff" />
      <rect x="18.5" y="7.7" width="3" height="2.7" rx="0.4" fill="#fff" />
      {/* colonnade */}
      <rect x="12.2" y="16.3" width="15.6" height="1.4" fill="#fff" />
      <rect x="13.4" y="18.1" width="1.3" height="6.8" fill="#fff" />
      <rect x="16.35" y="18.1" width="1.3" height="6.8" fill="#fff" />
      <rect x="19.3" y="18.1" width="1.3" height="6.8" fill="#fff" />
      <rect x="22.25" y="18.1" width="1.3" height="6.8" fill="#fff" />
      <rect x="25.2" y="18.1" width="1.3" height="6.8" fill="#fff" />
      <rect x="11.6" y="25.4" width="16.8" height="1.5" fill="#fff" />
      <rect x="10.2" y="27.4" width="19.6" height="1.3" fill="#b8830e" />
    </svg>
  );
}
