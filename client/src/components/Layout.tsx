import { useHashLocation } from "wouter/use-hash-location";
import { Link } from "wouter";
import { BookOpen, PlusCircle } from "lucide-react";

const NAV = [
  { href: "/", label: "Recipe Library", icon: BookOpen },
  { href: "/new", label: "New Recipe", icon: PlusCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useHashLocation();

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "#f0ebe1" }}>

      {/* Sidebar */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: "#faf7f2",
        borderRight: "1px solid #d4ccbc",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #d4ccbc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg aria-label="Lao Peng You" viewBox="0 0 32 32" width="28" height="28" fill="none">
              <rect width="32" height="32" rx="6" fill="#014643" />
              <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
                fontFamily="DM Serif Display, Georgia, serif" fontSize="17" fill="#f5ede0" fontWeight="400">老</text>
            </svg>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 13, color: "#014643", lineHeight: 1.2 }}>
                Lao Peng You
              </div>
              <div style={{ fontSize: 10, color: "#888070", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recipe Bible</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }} data-testid="sidebar-nav">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <a
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: 3,
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#014643" : "#888070",
                    background: isActive ? "rgba(1,70,67,0.08)" : "none",
                    textDecoration: "none", transition: "all 0.1s",
                    marginBottom: 2,
                  }}
                  data-testid={`nav-${label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Icon size={15} />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid #d4ccbc" }}>
          <span style={{ fontSize: 10, color: "#b0a898", letterSpacing: "0.04em" }}>© 2026 LPY Kitchen</span>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 200, minHeight: "100dvh" }} data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
