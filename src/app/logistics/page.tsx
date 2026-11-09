
"use client";

import React, { useState } from "react";
import Link from "next/link";

const features = [
  {
    id: "01",
    name: "შეკვეთების მართვა",
    type: "ORDER MANAGEMENT",
    description:
      "შეკვეთების სრული ციკლი, სტატუსები, მარშრუტები, ტვირთის კონტროლი და რეალურ დროში მონიტორინგი.",
    accent: "#f28a32",
    bg: "#fff0df",
    icon: "package",
    tags: ["ORDERS", "TRACKING", "STATUS"],
  },
  {
    id: "02",
    name: "ფლოტი და მძღოლები",
    type: "FLEET MANAGEMENT",
    description:
      "ავტომობილების, მძღოლების, ტექნიკური მომსახურებისა და დოკუმენტაციის ცენტრალიზებული მართვა.",
    accent: "#8970db",
    bg: "#eeeaff",
    icon: "fleet",
    tags: ["VEHICLES", "DRIVERS", "SERVICE"],
  },
  {
    id: "03",
    name: "AI ავტომატიზაცია",
    type: "INTELLIGENT AUTOMATION",
    description:
      "AI-ზე დაფუძნებული ფასები, პროცესების ავტომატიზაცია, Telegram ინტეგრაცია და შეტყობინებები.",
    accent: "#e87936",
    bg: "#ffeadb",
    icon: "ai",
    tags: ["AI PRICING", "BOT", "AUTOMATION"],
  },
  {
    id: "04",
    name: "ფინანსები და ანალიტიკა",
    type: "FINANCE & ANALYTICS",
    description:
      "შემოსავლების, ხარჯების, მოგების, ინვოისებისა და ფინანსური მაჩვენებლების კონტროლი.",
    accent: "#299b7a",
    bg: "#e1f5ec",
    icon: "finance",
    tags: ["FINANCE", "INVOICES", "REPORTS"],
  },
];

function Arrow({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17L17 7M7 7h10v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogisticsIllustration() {
  return (
    <svg
      viewBox="0 0 620 530"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logistics-svg"
      role="img"
      aria-label="ლოგისტიკური ქსელის ვექტორული ილუსტრაცია"
    >
      <defs>
        <linearGradient id="mapGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff2e3" />
          <stop offset="1" stopColor="#ffd5a7" />
        </linearGradient>

        <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f18a32" />
          <stop offset="1" stopColor="#d94d19" />
        </linearGradient>

        <filter id="shadow">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Map background */}
      <rect
        x="35"
        y="35"
        width="550"
        height="460"
        rx="28"
        fill="url(#mapGradient)"
      />

      {/* Decorative map grid */}
      <g stroke="#e4b989" strokeWidth="1" opacity=".45">
        <path d="M35 115H585M35 195H585M35 275H585M35 355H585M35 435H585" />
        <path d="M115 35V495M195 35V495M275 35V495M355 35V495M435 35V495M515 35V495" />
      </g>

      {/* Abstract geographical roads */}
      <g
        stroke="#fff"
        strokeWidth="15"
        strokeLinecap="round"
        opacity=".85"
      >
        <path d="M45 390C150 320 170 390 250 300S400 220 575 260" />
        <path d="M100 50C170 150 210 170 310 170S440 100 570 80" />
        <path d="M160 480C210 410 300 420 365 340S450 280 560 340" />
      </g>

      <g
        stroke="#e6b982"
        strokeWidth="1.5"
        strokeDasharray="5 7"
        opacity=".7"
      >
        <path d="M45 390C150 320 170 390 250 300S400 220 575 260" />
        <path d="M100 50C170 150 210 170 310 170S440 100 570 80" />
      </g>

      {/* Route shadow */}
      <path
        d="M120 345C170 345 165 195 275 195S370 345 485 145"
        stroke="#d35a20"
        strokeWidth="15"
        opacity=".12"
        filter="url(#shadow)"
      />

      {/* Main route */}
      <path
        d="M120 345C170 345 165 195 275 195S370 345 485 145"
        stroke="url(#routeGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="9 9"
      />

      {/* Route nodes */}
      <g>
        <circle cx="120" cy="345" r="18" fill="#fff" />
        <circle cx="120" cy="345" r="10" fill="#f28a32" />

        <circle cx="275" cy="195" r="18" fill="#fff" />
        <circle cx="275" cy="195" r="10" fill="#f28a32" />

        <circle cx="485" cy="145" r="18" fill="#fff" />
        <circle cx="485" cy="145" r="10" fill="#e05b26" />
      </g>

      {/* Location labels */}
      <g fontFamily="Arial, sans-serif" fill="#633c29">
        <rect x="65" y="378" width="112" height="36" rx="10" fill="#fff" />
        <text x="121" y="401" fontSize="11" textAnchor="middle" fontWeight="bold">
          TBILISI
        </text>

        <rect x="230" y="222" width="100" height="36" rx="10" fill="#fff" />
        <text x="280" y="245" fontSize="11" textAnchor="middle" fontWeight="bold">
          ISTANBUL
        </text>

        <rect x="438" y="103" width="100" height="30" rx="9" fill="#fff" />
        <text x="488" y="123" fontSize="10" textAnchor="middle" fontWeight="bold">
          EUROPE
        </text>
      </g>

      {/* Central logistics package illustration */}
      <g transform="translate(210 285)">
        <rect
          x="4"
          y="10"
          width="160"
          height="125"
          rx="20"
          fill="#ad541e"
          opacity=".12"
        />
        <rect x="0" y="0" width="160" height="125" rx="20" fill="#fff" />

        <path
          d="M80 27L119 49V94L80 116L41 94V49L80 27Z"
          fill="#f5a14b"
        />
        <path
          d="M80 27L119 49L80 71L41 49L80 27Z"
          fill="#ffc77f"
        />
        <path d="M80 71V116L41 94V49L80 71Z" fill="#df7b2e" />
        <path d="M80 71L119 49V94L80 116V71Z" fill="#ef9845" />
        <path d="M80 27V71" stroke="#fff1dc" strokeWidth="2" />
        <path d="M41 49L80 71L119 49" stroke="#fff1dc" strokeWidth="2" />

        <circle cx="130" cy="17" r="15" fill="#e4f5e9" />
        <path
          d="M123 17L128 22L137 12"
          stroke="#299b65"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Floating status card */}
      <g transform="translate(365 365)">
        <rect x="4" y="6" width="175" height="92" rx="14" fill="#b86c36" opacity=".12" />
        <rect width="175" height="92" rx="14" fill="#fff" />
        <circle cx="22" cy="25" r="6" fill="#36b986" />
        <text
          x="37"
          y="28"
          fill="#666"
          fontSize="10"
          fontWeight="bold"
          fontFamily="Arial"
        >
          DELIVERY STATUS
        </text>
        <text
          x="18"
          y="57"
          fill="#252525"
          fontSize="17"
          fontWeight="bold"
          fontFamily="Arial"
        >
          In Transit
        </text>
        <rect x="18" y="70" width="139" height="5" rx="3" fill="#eee" />
        <rect x="18" y="70" width="105" height="5" rx="3" fill="#f28a32" />
      </g>

      {/* Small decorative elements */}
      <circle cx="520" cy="400" r="28" stroke="#e99b56" strokeWidth="2" opacity=".5" />
      <circle cx="520" cy="400" r="10" fill="#f28a32" opacity=".25" />
      <circle cx="75" cy="125" r="6" fill="#f28a32" />
      <circle cx="530" cy="225" r="8" fill="#e5a66e" />
      <circle cx="175" cy="95" r="5" fill="#e5a66e" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "package":
      return (
        <svg {...common}>
          <path d="M20 4L34 11V29L20 36L6 29V11L20 4Z" />
          <path d="M6 11L20 19L34 11M20 19V36M13 7.5L27 15.5" />
        </svg>
      );

    case "fleet":
      return (
        <svg {...common}>
          <rect x="4" y="10" width="21" height="17" rx="3" />
          <path d="M25 16H31L36 22V27H25V16Z" />
          <circle cx="12" cy="29" r="3.5" fill="currentColor" />
          <circle cx="30" cy="29" r="3.5" fill="currentColor" />
        </svg>
      );

    case "ai":
      return (
        <svg {...common}>
          <path d="M20 4L23.5 15.5L35 20L23.5 24.5L20 36L16.5 24.5L5 20L16.5 15.5L20 4Z" />
          <path d="M32 4V12M28 8H36M8 28V35M4.5 31.5H11.5" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <rect x="5" y="7" width="30" height="26" rx="4" />
          <path d="M11 26V21M19 26V14M27 26V18" />
          <path d="M10 12H30" opacity=".4" />
        </svg>
      );
  }
}

export default function LogisticsLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="landing" id="home">

      {/* HERO */}
      <section className="hero">

        <div className="hero-orange">
          <div className="orange-circle circle-one" />
          <div className="orange-circle circle-two" />
          <div className="orange-grid" />
        </div>

        <div className="hero-white" />

        {/* HEADER */}
        <header className="header">
          <Link href="/" className="brand">
            <span className="brand-icon">L.</span>
            <span className="brand-text">
              LOGISTICS
              <small>MANAGEMENT OS</small>
            </span>
          </Link>

          <nav className="desktop-nav">
            <a href="#features">შესაძლებლობები</a>
            <a href="#workflow">როგორ მუშაობს</a>
            <a href="#about">ჩვენ შესახებ</a>
            <Link href="/login" className="nav-login">
              შესვლა <Arrow size={13} />
            </Link>
          </nav>

          <button
            className={`menu-toggle ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="მენიუს გახსნა"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>

          {menuOpen && (
            <nav className="mobile-menu">
              <a href="#features" onClick={closeMenu}>შესაძლებლობები</a>
              <a href="#workflow" onClick={closeMenu}>როგორ მუშაობს</a>
              <a href="#about" onClick={closeMenu}>ჩვენ შესახებ</a>
              <Link href="/login" onClick={closeMenu}>სისტემაში შესვლა</Link>
            </nav>
          )}
        </header>

        {/* HERO CONTENT */}
        <div className="hero-content">
          <div className="hero-left">

            <div className="eyebrow">
              <span className="eyebrow-dot" />
              SMART LOGISTICS MANAGEMENT
            </div>

            <h1>
              LOGISTICS
              <span>WITHOUT</span>
              LIMITS<span className="title-dot">.</span>
            </h1>

            <p className="hero-description">
              ლოჯისტიკის მართვის ახალი სტანდარტი.
              <br />
              შეკვეთები, ტრანსპორტი და ფინანსები
              <br />
              ერთიან, ჭკვიან პლატფორმაში.
            </p>

            <div className="hero-actions">
              <Link href="/login" className="primary-button">
                სისტემაში შესვლა
                <Arrow size={17} />
              </Link>

              <a href="#features" className="secondary-button">
                შესაძლებლობები
                <span>↓</span>
              </a>
            </div>

            <div className="hero-bottom-info">
              <div className="info-symbols">
                <span>01</span>
                <span>02</span>
                <span>03</span>
              </div>
              <div>
                <strong>ONE PLATFORM. TOTAL CONTROL.</strong>
                <small>ყველა პროცესი ერთ სივრცეში.</small>
              </div>
            </div>
          </div>

          {/* RIGHT VECTOR AREA */}
          <div className="hero-right">
            <div className="availability">
              <span className="availability-dot" />
              LOGISTICS MANAGEMENT
              <strong>SMART OPERATIONS</strong>
            </div>

            <div className="illustration-wrap">
              <LogisticsIllustration />
            </div>

            <div className="floating-top-card">
              <div className="top-card-icon">
                <FeatureIcon type="package" />
              </div>
              <div>
                <small>ACTIVE SHIPMENTS</small>
                <strong>Order Management</strong>
              </div>
              <span className="online-dot" />
            </div>

            <div className="floating-bottom-card">
              <div className="bottom-card-head">
                <span>DELIVERY PERFORMANCE</span>
                <span className="performance-label">LIVE</span>
              </div>
              <div className="performance-number">
                98.5<span>%</span>
              </div>
              <div className="performance-bars">
                <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
              </div>
              <small>Smart logistics intelligence</small>
            </div>
          </div>
        </div>

        {/* HERO FOOTER */}
        <div className="hero-footer">
          <span>LOGISTICS MANAGEMENT OPERATING SYSTEM</span>
          <div className="footer-line" />
          <a href="#features">EXPLORE PLATFORM ↓</a>
        </div>
      </section>

      {/* STATISTICS STRIP */}
      <section className="stats-strip">
        <div className="stat-item">
          <span className="stat-icon">↗</span>
          <div>
            <strong>ORDERS</strong>
            <small>შეკვეთების ცენტრალიზებული მართვა</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icon">⌖</span>
          <div>
            <strong>TRACKING</strong>
            <small>მარშრუტებისა და მიწოდების კონტროლი</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icon">✳</span>
          <div>
            <strong>AI POWERED</strong>
            <small>ჭკვიანი პროცესები და ავტომატიზაცია</small>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-icon">▥</span>
          <div>
            <strong>ANALYTICS</strong>
            <small>ფინანსური და ოპერაციული ანალიტიკა</small>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-top">
          <div>
            <div className="section-kicker">
              <span /> 01 / PLATFORM FEATURES
            </div>
            <h2>
              ყველა პროცესი.
              <br />
              <span>ერთი სისტემა.</span>
            </h2>
          </div>

          <p>
            თანამედროვე ლოჯისტიკური კომპანიისთვის შექმნილი
            ინტეგრირებული პლატფორმა, რომელიც ოპერაციებს
            უფრო მარტივსა და გამჭვირვალეს ხდის.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.id}>
              <div
                className="feature-visual"
                style={{
                  background: feature.bg,
                  color: feature.accent,
                }}
              >
                <span className="feature-number">{feature.id}</span>

                <div className="feature-visual-icon">
                  <FeatureIcon type={feature.icon} />
                </div>

                <div className="feature-visual-title">
                  {feature.type}
                </div>

                <div className="feature-visual-decoration" />
                <div className="feature-visual-circle" />

                <span className="feature-visual-arrow">
                  <Arrow size={19} />
                </span>
              </div>

              <div className="feature-content">
                <div className="feature-name-row">
                  <h3>{feature.name}</h3>
                  <span className="feature-id">{feature.id}</span>
                </div>

                <p>{feature.description}</p>

                <div className="feature-tags">
                  {feature.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="workflow-section" id="workflow">
        <div className="workflow-heading">
          <div>
            <div className="section-kicker">
              <span /> 02 / WORKFLOW
            </div>
            <h2>კონტროლი. სიზუსტე. <span>ეფექტურობა.</span></h2>
          </div>
          <p>ერთი სამუშაო გარემო, სრული პროცესის მართვისთვის.</p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-card workflow-main">
            <div className="workflow-card-top">
              <span>01 — OPERATIONS</span>
              <span>↗</span>
            </div>

            <div className="workflow-graphic">
              <div className="workflow-node node-a">
                <span>01</span>
                <strong>ORDER</strong>
              </div>
              <div className="workflow-connector" />
              <div className="workflow-node node-b">
                <span>02</span>
                <strong>ROUTE</strong>
              </div>
              <div className="workflow-connector" />
              <div className="workflow-node node-c">
                <span>03</span>
                <strong>DELIVERY</strong>
              </div>
            </div>

            <h3>შეკვეთიდან მიწოდებამდე</h3>
            <p>მართე შეკვეთის სრული სასიცოცხლო ციკლი ერთიან სამუშაო პროცესში.</p>
          </div>

          <div className="workflow-card workflow-dark">
            <div className="workflow-card-top">
              <span>02 — INTELLIGENCE</span>
              <span>✳</span>
            </div>

            <div className="chart-graphic">
              <div className="chart-label">
                <span>OPERATIONAL INSIGHTS</span>
                <strong>ANALYTICS</strong>
              </div>
              <div className="chart-bars">
                {[35, 55, 43, 75, 60, 90, 72, 100, 82, 95].map(
                  (height, index) => (
                    <div
                      key={index}
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>
            </div>

            <h3>მონაცემებზე დაფუძნებული მართვა</h3>
            <p>აკონტროლე ბიზნესის შედეგები, ხარჯები და ფინანსური ეფექტიანობა.</p>
          </div>

          <div className="workflow-card workflow-orange">
            <div className="workflow-card-top">
              <span>03 — AUTOMATION</span>
              <span>↗</span>
            </div>

            <div className="automation-graphic">
              <div className="automation-center">AI</div>
              <div className="automation-orbit orbit-one" />
              <div className="automation-orbit orbit-two" />
              <span className="orbit-point point-one">✳</span>
              <span className="orbit-point point-two">↗</span>
              <span className="orbit-point point-three">✓</span>
            </div>

            <h3>ჭკვიანი ავტომატიზაცია</h3>
            <p>შეამცირე ხელით შესასრულებელი სამუშაო და გააუმჯობესე ოპერაციები.</p>
          </div>
        </div>
      </section>

      {/* ABOUT / CTA */}
      <section className="cta-section" id="about">
        <div className="cta-decoration">
          <div />
          <div />
          <div />
        </div>

        <div className="cta-content">
          <div className="section-kicker">
            <span /> 03 / THE NEXT STEP
          </div>

          <h2>
            შენი ლოჯისტიკა.
            <br />
            შენი <span>კონტროლი.</span>
          </h2>

          <p>
            მართე შეკვეთები, ფლოტი და ფინანსები
            ერთი თანამედროვე პლატფორმიდან.
          </p>

          <Link href="/login" className="cta-button">
            პლატფორმაზე გადასვლა
            <Arrow size={18} />
          </Link>
        </div>

        <div className="cta-side">
          <div className="cta-logo">L.</div>
          <span>SMART LOGISTICS</span>
          <span>ONE CONNECTED SYSTEM</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Link href="/" className="footer-brand">
          <span>L.</span>
          LOGISTICS OS
        </Link>

        <div className="footer-center">
          LOGISTICS MANAGEMENT OPERATING SYSTEM
        </div>

        <a href="#home" className="back-top">
          ზევით ასვლა ↑
        </a>
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
          scroll-padding-top: 20px;
        }

        :global(body) {
          margin: 0;
          background: #f4f2ee;
          color: #20201f;
          font-family: Arial, Helvetica, sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        :global(button) {
          font-family: inherit;
        }

        .landing {
          width: 100%;
          overflow: hidden;
          padding: 7px;
          background: #f4f2ee;
        }

        /* HERO */

        .hero {
          position: relative;
          min-height: 680px;
          height: min(760px, 88vh);
          overflow: hidden;
          border: 4px solid #f49a32;
          border-radius: 17px;
          isolation: isolate;
          background: #f15e16;
        }

        .hero-orange {
          position: absolute;
          z-index: -3;
          inset: 0;
          background:
            radial-gradient(ellipse at 32% 90%, #ffbd42 0%, transparent 42%),
            linear-gradient(120deg, #a72d0a 0%, #e84d0e 48%, #f68d20 100%);
        }

        .orange-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.12);
        }

        .circle-one {
          width: 650px;
          height: 650px;
          left: 12%;
          top: -65%;
          background: rgba(80, 20, 0, .1);
        }

        .circle-two {
          width: 430px;
          height: 430px;
          left: 20%;
          bottom: -50%;
          background: rgba(255, 195, 64, .14);
        }

        .orange-grid {
          position: absolute;
          inset: 0;
          opacity: .09;
          background-image: radial-gradient(#fff 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .hero-white {
          position: absolute;
          z-index: -2;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          border-radius: 20px 0 0 20px;
          background: #fff;
        }

        /* HEADER */

        .header {
          position: absolute;
          z-index: 20;
          top: 0;
          left: 0;
          right: 0;
          height: 78px;
          padding: 0 4%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }

        .brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #e85d19;
          border-radius: 11px;
          font-size: 24px;
          font-weight: 900;
        }

        .brand-text {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .brand-text small {
          display: block;
          font-size: 7px;
          letter-spacing: 1.5px;
          margin-top: 4px;
          opacity: .75;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .desktop-nav a {
          color: #555;
          font-size: 10px;
          font-weight: 800;
          transition: color .2s;
        }

        .desktop-nav a:hover {
          color: #ec772c;
        }

        .desktop-nav .nav-login {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 17px;
          background: #f4f3f0;
          border-radius: 30px;
        }

        .menu-toggle {
          display: none;
          width: 39px;
          height: 39px;
          border: none;
          border-radius: 50%;
          background: #f4f3f0;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
        }

        .menu-toggle span {
          width: 15px;
          height: 1.5px;
          background: #222;
          transition: .2s;
        }

        .menu-toggle.active span:first-child {
          transform: translateY(3.2px) rotate(45deg);
        }

        .menu-toggle.active span:last-child {
          transform: translateY(-3.2px) rotate(-45deg);
        }

        .mobile-menu {
          position: absolute;
          right: 4%;
          top: 68px;
          min-width: 190px;
          padding: 19px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: white;
          color: #222;
          border-radius: 13px;
          box-shadow: 0 12px 35px #0002;
        }

        .mobile-menu a {
          font-size: 12px;
          font-weight: 700;
        }

        /* HERO CONTENT */

        .hero-content {
          position: absolute;
          top: 78px;
          bottom: 42px;
          left: 0;
          right: 0;
          display: grid;
          grid-template-columns: 48% 52%;
        }

        .hero-left {
          position: relative;
          z-index: 3;
          padding: 105px 0 30px 5%;
          color: #fff;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 22px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 12px #fff;
        }

        .hero-left h1 {
          font-size: clamp(55px, 6.6vw, 94px);
          font-weight: 950;
          letter-spacing: -5px;
          line-height: .91;
          margin: 0 0 24px;
        }

        .hero-left h1 span {
          display: block;
          color: #ffe2c0;
        }

        .hero-left h1 .title-dot {
          display: inline;
          color: #ffd08b;
        }

        .hero-description {
          font-size: 13px;
          line-height: 1.8;
          color: #fff0e5;
          margin: 0 0 24px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 11px;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          background: white;
          color: #272727;
          border-radius: 30px;
          padding: 14px 19px;
          font-size: 10px;
          font-weight: 900;
          transition: .25s;
        }

        .primary-button:hover {
          background: #242424;
          color: white;
          transform: translateY(-3px);
        }

        .secondary-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #ffffff80;
          border-radius: 30px;
          padding: 13px 17px;
          font-size: 9px;
          font-weight: 800;
          transition: .2s;
        }

        .secondary-button:hover {
          background: #ffffff20;
        }

        .hero-bottom-info {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 48px;
        }

        .info-symbols {
          display: flex;
        }

        .info-symbols span {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 2px solid #e7651c;
          margin-left: -7px;
          background: #8e3518;
          font-size: 9px;
          font-weight: 900;
        }

        .info-symbols span:first-child {
          margin-left: 0;
        }

        .hero-bottom-info strong {
          display: block;
          font-size: 8px;
          letter-spacing: .7px;
        }

        .hero-bottom-info small {
          display: block;
          font-size: 9px;
          margin-top: 5px;
          color: #ffffffbd;
        }

        /* VECTOR VISUAL */

        .hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px 3% 15px;
        }

        .availability {
          position: absolute;
          z-index: 3;
          right: 7%;
          top: 11px;
          color: #777;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .availability-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 7px;
          background: #2da87a;
          border-radius: 50%;
        }

        .availability strong {
          display: block;
          color: #262626;
          font-size: 15px;
          letter-spacing: -.4px;
          margin-top: 7px;
        }

        .illustration-wrap {
          width: 100%;
          max-width: 550px;
          margin-top: 5px;
        }

        .logistics-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .floating-top-card {
          position: absolute;
          z-index: 5;
          top: 17%;
          left: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 14px;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 12px 30px #00000012;
          animation: floating 4s ease-in-out infinite;
        }

        .top-card-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 10px;
          background: #fff0df;
          color: #e98232;
        }

        .floating-top-card small {
          display: block;
          font-size: 7px;
          color: #999;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .floating-top-card strong {
          display: block;
          font-size: 10px;
          margin-top: 5px;
        }

        .online-dot {
          width: 7px;
          height: 7px;
          background: #35b982;
          border-radius: 50%;
          margin-left: 6px;
        }

        .floating-bottom-card {
          position: absolute;
          z-index: 5;
          right: 3%;
          bottom: 3%;
          width: 190px;
          padding: 14px;
          background: white;
          border-radius: 13px;
          box-shadow: 0 12px 35px #00000012;
        }

        .bottom-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #888;
          font-size: 7px;
          font-weight: 800;
        }

        .performance-label {
          padding: 4px 6px;
          border-radius: 5px;
          background: #e3f5eb;
          color: #28966c;
        }

        .performance-number {
          margin-top: 7px;
          font-size: 29px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .performance-number span {
          color: #e87e2c;
          font-size: 16px;
        }

        .performance-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 25px;
          margin: 7px 0;
        }

        .performance-bars i {
          flex: 1;
          height: 65%;
          border-radius: 3px;
          background: #f2a15b;
        }

        .performance-bars i:nth-child(2n) {
          height: 90%;
        }

        .performance-bars i:nth-child(3n) {
          height: 45%;
        }

        .floating-bottom-card > small {
          font-size: 8px;
          color: #999;
        }

        @keyframes floating {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        /* HERO FOOTER */

        .hero-footer {
          position: absolute;
          z-index: 4;
          bottom: 0;
          left: 5%;
          right: 5%;
          height: 38px;
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 7px;
          letter-spacing: 1.2px;
          color: #ffffffb9;
        }

        .footer-line {
          flex: 1;
          height: 1px;
          background: #ffffff45;
        }

        .hero-footer a {
          color: #fff;
          font-weight: 900;
        }

        /* STATS */

        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 8px;
          padding: 17px 4%;
          background: #20201f;
          border-radius: 10px;
          color: white;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 12px;
          border-right: 1px solid #ffffff20;
        }

        .stat-item:last-child {
          border: none;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #ffffff10;
          color: #f49a4b;
          font-size: 20px;
        }

        .stat-item strong {
          display: block;
          font-size: 10px;
          letter-spacing: .8px;
        }

        .stat-item small {
          display: block;
          margin-top: 5px;
          color: #a5a5a5;
          font-size: 8px;
          line-height: 1.5;
        }

        /* FEATURES */

        .features-section {
          padding: 48px 4% 45px;
        }

        .section-top,
        .workflow-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 23px;
        }

        .section-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.3px;
          color: #e77a31;
        }

        .section-kicker > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e77a31;
        }

        .section-top h2,
        .workflow-heading h2 {
          margin: 10px 0 0;
          font-size: clamp(30px, 4vw, 43px);
          line-height: 1.08;
          letter-spacing: -2px;
        }

        .section-top h2 span,
        .workflow-heading h2 span {
          color: #e77a31;
        }

        .section-top > p {
          max-width: 300px;
          margin: 0 0 4px;
          color: #85827e;
          font-size: 10px;
          line-height: 1.8;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
        }

        .feature-card {
          min-width: 0;
          overflow: hidden;
          background: #fff;
          border: 1px solid #eae7e1;
          border-radius: 11px;
          transition: transform .25s, box-shadow .25s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px #0000000b;
        }

        .feature-visual {
          position: relative;
          height: 145px;
          margin: 8px;
          padding: 14px;
          overflow: hidden;
          border-radius: 8px;
        }

        .feature-number {
          position: relative;
          z-index: 2;
          font-size: 9px;
          font-weight: 900;
          opacity: .7;
        }

        .feature-visual-icon {
          position: absolute;
          z-index: 2;
          left: 16px;
          top: 45px;
        }

        .feature-visual-title {
          position: absolute;
          z-index: 2;
          bottom: 15px;
          left: 15px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .feature-visual-decoration {
          position: absolute;
          width: 150px;
          height: 150px;
          right: -45px;
          top: -50px;
          border: 1px solid currentColor;
          border-radius: 50%;
          opacity: .25;
        }

        .feature-visual-circle {
          position: absolute;
          width: 95px;
          height: 95px;
          right: 5px;
          bottom: -45px;
          border: 13px solid currentColor;
          border-radius: 50%;
          opacity: .13;
        }

        .feature-visual-arrow {
          position: absolute;
          right: 13px;
          bottom: 12px;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          background: #ffffffb5;
          border-radius: 50%;
        }

        .feature-content {
          padding: 10px 13px 15px;
        }

        .feature-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 5px;
        }

        .feature-name-row h3 {
          font-size: 15px;
          letter-spacing: -.4px;
          margin: 0;
        }

        .feature-id {
          color: #aaa;
          font-size: 8px;
          font-weight: 800;
        }

        .feature-content p {
          min-height: 48px;
          margin: 9px 0;
          color: #888;
          font-size: 9px;
          line-height: 1.7;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .feature-tags span {
          padding: 5px 7px;
          border: 1px solid #ebe8e3;
          border-radius: 20px;
          color: #888;
          font-size: 6px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        /* WORKFLOW */

        .workflow-section {
          padding: 35px 4% 45px;
          background: #eae7e1;
        }

        .workflow-heading {
          margin-bottom: 22px;
        }

        .workflow-heading h2 {
          font-size: clamp(26px, 3.2vw, 36px);
        }

        .workflow-heading > p {
          max-width: 250px;
          color: #888;
          font-size: 9px;
          line-height: 1.7;
        }

        .workflow-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr 1fr;
          gap: 12px;
        }

        .workflow-card {
          position: relative;
          min-height: 245px;
          padding: 16px;
          overflow: hidden;
          border-radius: 11px;
          background: white;
        }

        .workflow-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #8b8882;
        }

        .workflow-card h3 {
          position: relative;
          z-index: 2;
          margin: 14px 0 6px;
          font-size: 16px;
        }

        .workflow-card > p {
          position: relative;
          z-index: 2;
          max-width: 290px;
          margin: 0;
          font-size: 9px;
          line-height: 1.7;
          color: #999;
        }

        .workflow-graphic {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 36px;
          gap: 5px;
        }

        .workflow-node {
          width: 74px;
          height: 65px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 9px;
          background: #fff0df;
          color: #e87b2d;
        }

        .workflow-node span {
          font-size: 9px;
        }

        .workflow-node strong {
          font-size: 8px;
        }

        .node-b {
          background: #eeeaff;
          color: #8970db;
        }

        .node-c {
          background: #e1f5ec;
          color: #299b7a;
        }

        .workflow-connector {
          width: 18px;
          height: 2px;
          background: #e5a15e;
        }

        .workflow-dark {
          background: #242422;
          color: white;
        }

        .workflow-dark .workflow-card-top {
          color: #aaa;
        }

        .chart-graphic {
          height: 105px;
          margin-top: 20px;
          padding: 10px 12px;
          border: 1px solid #ffffff16;
          border-radius: 9px;
          background: #ffffff08;
        }

        .chart-label {
          display: flex;
          justify-content: space-between;
          color: #aaa;
          font-size: 7px;
        }

        .chart-label strong {
          color: #f49a4b;
        }

        .chart-bars {
          height: 55px;
          margin-top: 8px;
          display: flex;
          align-items: flex-end;
          gap: 7px;
        }

        .chart-bars div {
          flex: 1;
          border-radius: 3px 3px 0 0;
          background: linear-gradient(to top, #df6728, #ffbc72);
          opacity: .9;
        }

        .workflow-orange {
          background: #f17d32;
          color: white;
        }

        .workflow-orange .workflow-card-top {
          color: #fff0df;
        }

        .workflow-orange > p {
          color: #fff0df;
        }

        .automation-graphic {
          position: relative;
          height: 112px;
          margin-top: 12px;
          display: grid;
          place-items: center;
        }

        .automation-center {
          z-index: 2;
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: white;
          color: #e87b2d;
          font-size: 20px;
          font-weight: 900;
        }

        .automation-orbit {
          position: absolute;
          width: 95px;
          height: 95px;
          border: 1px solid #ffffff75;
          border-radius: 50%;
        }

        .orbit-two {
          width: 120px;
          height: 120px;
          border-style: dashed;
          opacity: .6;
        }

        .orbit-point {
          position: absolute;
          z-index: 3;
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          background: white;
          color: #e87b2d;
          border-radius: 50%;
          font-size: 11px;
        }

        .point-one {
          top: 3px;
          left: calc(50% - 11px);
        }

        .point-two {
          right: calc(50% - 62px);
          bottom: 15px;
        }

        .point-three {
          left: calc(50% - 62px);
          bottom: 15px;
        }

        /* CTA */

        .cta-section {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 240px;
          margin: 8px 0;
          padding: 28px 5%;
          overflow: hidden;
          border-radius: 11px;
          background: #222220;
          color: white;
        }

        .cta-content {
          position: relative;
          z-index: 2;
        }

        .cta-content h2 {
          margin: 12px 0;
          font-size: clamp(33px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -2px;
        }

        .cta-content h2 span {
          color: #f49a4b;
        }

        .cta-content > p {
          margin: 0 0 16px;
          color: #aaa;
          font-size: 10px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          padding: 12px 17px;
          border-radius: 30px;
          background: #f28a32;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          transition: .2s;
        }

        .cta-button:hover {
          background: #fff;
          color: #222;
        }

        .cta-side {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          color: #aaa;
          font-size: 8px;
          letter-spacing: 1.3px;
        }

        .cta-logo {
          width: 100px;
          height: 100px;
          display: grid;
          place-items: center;
          border: 1px solid #ffffff25;
          border-radius: 25px;
          color: #f49a4b;
          font-size: 65px;
          font-weight: 900;
        }

        .cta-decoration {
          position: absolute;
          right: 20%;
          top: -150px;
          opacity: .08;
        }

        .cta-decoration div {
          position: absolute;
          width: 350px;
          height: 350px;
          border: 1px solid #fff;
          border-radius: 50%;
        }

        .cta-decoration div:nth-child(2) {
          width: 280px;
          height: 280px;
          left: 35px;
          top: 35px;
        }

        .cta-decoration div:nth-child(3) {
          width: 210px;
          height: 210px;
          left: 70px;
          top: 70px;
        }

        /* FOOTER */

        .footer {
          min-height: 55px;
          padding: 10px 3%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          color: #777;
          font-size: 8px;
          letter-spacing: .8px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #222;
          font-weight: 900;
        }

        .footer-brand span {
          color: #e87b2d;
          font-size: 22px;
        }

        .footer-center {
          color: #aaa;
        }

        .back-top {
          font-weight: 800;
        }

        /* RESPONSIVE: TABLET */

        @media (max-width: 1000px) {
          .hero {
            min-height: 650px;
          }

          .hero-left {
            padding-top: 110px;
          }

          .hero-left h1 {
            font-size: clamp(55px, 7vw, 75px);
          }

          .floating-top-card {
            left: -5px;
          }

          .floating-bottom-card {
            right: 0;
          }

          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .feature-visual {
            height: 125px;
          }

          .workflow-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .workflow-orange {
            grid-column: span 2;
          }
        }

        /* RESPONSIVE: MOBILE */

        @media (max-width: 650px) {
          .landing {
            padding: 4px;
          }

          .hero {
            height: auto;
            min-height: 0;
            border-width: 3px;
            border-radius: 13px;
          }

          .hero-orange {
            height: 590px;
          }

          .hero-white {
            top: 590px;
            right: 0;
            width: 100%;
            height: 420px;
            border-radius: 14px 14px 0 0;
          }

          .header {
            height: 65px;
            padding: 0 5%;
          }

          .brand-icon {
            width: 34px;
            height: 34px;
            font-size: 21px;
          }

          .brand-text {
            font-size: 10px;
          }

          .desktop-nav {
            display: none;
          }

          .menu-toggle {
            display: flex;
          }

          .hero-content {
            position: relative;
            top: auto;
            bottom: auto;
            display: flex;
            flex-direction: column;
          }

          .hero-left {
            padding: 100px 6% 25px;
          }

          .eyebrow {
            font-size: 8px;
            margin-bottom: 17px;
          }

          .hero-left h1 {
            font-size: clamp(53px, 12vw, 76px);
            letter-spacing: -3.5px;
            margin-bottom: 18px;
          }

          .hero-description {
            font-size: 11px;
            line-height: 1.7;
            margin-bottom: 17px;
          }

          .primary-button {
            padding: 12px 16px;
            font-size: 9px;
          }

          .secondary-button {
            padding: 11px 13px;
            font-size: 8px;
          }

          .hero-bottom-info {
            margin-top: 25px;
          }

          .hero-right {
            height: 390px;
            padding: 25px 3% 35px;
          }

          .illustration-wrap {
            width: 100%;
            max-width: 430px;
          }

          .availability {
            top: 0;
            right: 7%;
            font-size: 7px;
          }

          .availability strong {
            font-size: 12px;
          }

          .floating-top-card {
            top: 14%;
            left: 2%;
            padding: 8px;
            gap: 7px;
          }

          .top-card-icon {
            width: 31px;
            height: 31px;
          }

          .top-card-icon svg {
            width: 24px;
            height: 24px;
          }

          .floating-top-card small {
            font-size: 6px;
          }

          .floating-top-card strong {
            font-size: 8px;
          }

          .floating-bottom-card {
            width: 150px;
            right: 3%;
            bottom: 0;
            padding: 10px;
          }

          .performance-number {
            font-size: 23px;
          }

          .hero-footer {
            position: relative;
            left: auto;
            right: auto;
            bottom: auto;
            height: 35px;
            margin: 0 5%;
            font-size: 6px;
            gap: 10px;
          }

          .stats-strip {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 4px;
            padding: 14px 3%;
          }

          .stat-item {
            border: none;
            padding: 4px;
            gap: 8px;
          }

          .stat-icon {
            width: 30px;
            height: 30px;
            font-size: 16px;
          }

          .stat-item strong {
            font-size: 8px;
          }

          .stat-item small {
            font-size: 7px;
          }

          .features-section {
            padding: 36px 3% 30px;
          }

          .section-top {
            display: block;
            margin-bottom: 19px;
          }

          .section-top h2 {
            font-size: 35px;
          }

          .section-top > p {
            max-width: 100%;
            margin-top: 12px;
            font-size: 9px;
          }

          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .feature-visual {
            height: 115px;
            margin: 5px;
            padding: 10px;
          }

          .feature-visual-icon {
            top: 37px;
            left: 12px;
          }

          .feature-visual-icon svg {
            width: 29px;
            height: 29px;
          }

          .feature-visual-title {
            left: 10px;
            bottom: 10px;
            font-size: 6px;
          }

          .feature-visual-arrow {
            width: 24px;
            height: 24px;
            right: 8px;
            bottom: 8px;
          }

          .feature-content {
            padding: 7px 9px 11px;
          }

          .feature-name-row h3 {
            font-size: 12px;
          }

          .feature-content p {
            font-size: 8px;
            line-height: 1.6;
            min-height: 63px;
          }

          .feature-tags {
            gap: 3px;
          }

          .feature-tags span {
            padding: 4px 5px;
            font-size: 5px;
          }

          .workflow-section {
            padding: 29px 3%;
          }

          .workflow-heading {
            display: block;
          }

          .workflow-heading h2 {
            font-size: 27px;
          }

          .workflow-heading > p {
            margin-top: 10px;
          }

          .workflow-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .workflow-card {
            min-height: 220px;
          }

          .workflow-orange {
            grid-column: auto;
          }

          .workflow-graphic {
            margin-top: 28px;
          }

          .cta-section {
            min-height: 230px;
            padding: 24px 5%;
          }

          .cta-content h2 {
            font-size: 34px;
          }

          .cta-content > p {
            max-width: 250px;
            font-size: 9px;
            line-height: 1.7;
          }

          .cta-side {
            display: none;
          }

          .footer {
            min-height: 50px;
            padding: 8px 2%;
            font-size: 7px;
          }

          .footer-center {
            display: none;
          }
        }

        @media (max-width: 360px) {
          .hero-left h1 {
            font-size: 49px;
          }

          .hero-right {
            height: 340px;
          }

          .floating-top-card {
            transform: scale(.88);
            transform-origin: left top;
          }

          .features-grid {
            gap: 7px;
          }

          .feature-name-row h3 {
            font-size: 11px;
          }

          .feature-content p {
            font-size: 7px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(html) {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
