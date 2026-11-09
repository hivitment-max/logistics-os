"use client";

import React, { useState } from "react";
import Link from "next/link";

const features = [
  {
    id: "01",
    name: "შეკვეთების მართვა",
    type: "ORDER MANAGEMENT",
    description: "სრული CRUD სისტემა სტატუსების, მარშრუტების და ტვირთის დეტალური ტრეკინგით.",
    color: "#102d35",
    accent: "#46d9c5",
    symbol: "📦",
    tags: ["REAL-TIME", "CRUD", "TRACKING"],
  },
  {
    id: "02",
    name: "ფლოტი და მძღოლები",
    type: "FLEET & HR",
    description: "მანქანების ტექნიკური მდგომარეობის, მძღოლების დოკუმენტაციის და ხელფასების ავტომატური მენეჯმენტი.",
    color: "#33205b",
    accent: "#d7a5ff",
    symbol: "🚛",
    tags: ["MONITORING", "HR", "MAINTENANCE"],
  },
  {
    id: "03",
    name: "AI და ავტომატიზაცია",
    type: "AI & AUTOMATION",
    description: "ხელოვნური ინტელექტით ფასების დინამიური განსაზღვრა, Telegram ბოტი და ავტომატური შეტყობინებები.",
    color: "#e87521",
    accent: "#fff2d9",
    symbol: "🤖",
    tags: ["AI PRICING", "TELEGRAM", "CRON"],
  },
  {
    id: "04",
    name: "ფინანსური ანალიტიკა",
    type: "FINANCE & ANALYTICS",
    description: "ინვოისების გენერაცია (PDF), ხარჯების ტრეკინგი და მოგების ვიზუალური დაშბორდები.",
    color: "#1b4d3e",
    accent: "#a8e6cf",
    symbol: "📊",
    tags: ["INVOICES", "PDF", "DASHBOARD"],
  },
];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
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

export default function LogisticsLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("01");

  return (
    <main className="logistics-landing">

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="orange-bg" />
        <div className="white-bg" />

        {/* LOGISTICS VISUAL (შეცვლილია სატრანსპორტო თემატიკაზე) */}
        <div className="logistics-visual">
          {/* მთავარი ფოტო: თანამედროვე სატვირთო */}
          <div className="main-image">
            <img 
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80" 
              alt="Modern Logistics Truck" 
            />
            <div className="image-overlay" />
          </div>
          
          {/* მცურავი ბარათი: სისტემის ელემენტი */}
          <div className="floating-card">
            <div className="card-icon">🚚</div>
            <div className="card-text">
              <strong>მარშრუტი ოპტიმიზირებულია</strong>
              <small>შეკვეთა #1042 • დროულად მიწოდებული</small>
            </div>
          </div>

          {/* ტრანსპორტის ტიპების ნიშნულები */}
          <div className="vehicle-tags">
            <span>🚛 სატვირთო</span>
            <span>🚐 მარშრუტკა</span>
            <span>🚗 მსუბუქი</span>
          </div>
        </div>

        {/* HEADER */}
        <header className="header">
          <Link href="/" className="brand">
            <span className="brand-symbol">S.</span>
            <span className="brand-label">LOGISTICS OS</span>
          </Link>

          <nav className="desktop-nav">
            <a href="#features">შესაძლებლობები</a>
            <a href="/login">შესვლა</a>
          </nav>

          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
          </button>

          {menuOpen && (
            <nav className="mobile-menu">
              <a href="#features" onClick={() => setMenuOpen(false)}>შესაძლებლობები</a>
              <a href="/login" onClick={() => setMenuOpen(false)}>შესვლა</a>
            </nav>
          )}
        </header>

        {/* LEFT SIDE */}
        <div className="hero-left">
          <div className="eyebrow">
            <span />
            ENTERPRISE LOGISTICS SOLUTION
          </div>

          <h1>LOGISTICS<br/>OS</h1>

          <p className="hero-description">
            სრულყოფილი ლოჯისტიკის მართვის სისტემა.<br />
            შეკვეთები, ფლოტი და ანალიტიკა ერთ სივრცეში.
          </p>

          <Link href="/login" className="main-button">
            სისტემაში შესვლა <Arrow />
          </Link>

          <div className="mini-trust">
            <div className="mini-symbols">
              <span>📦</span>
              <span>🚛</span>
              <span>🤖</span>
              <span>📊</span>
            </div>
            <div>
              <strong>შექმნილია ეფექტურობისთვის</strong>
              <small>ქაოსის ნაცვლად — სრული კონტროლი.</small>
            </div>
          </div>
        </div>

        {/* BOTTOM INFORMATION */}
        <div className="hero-footer">
          <div className="hero-footer-left">
            <span>01</span>
            <div />
            <span>02</span>
          </div>

          <div className="hero-footer-center">
            LOGISTICS MANAGEMENT OPERATING SYSTEM
          </div>

          <a href="#features">
            გაიგე მეტი <span>↓</span>
          </a>
        </div>
      </section>

      {/* QUICK INFORMATION STRIP */}
      <section className="quick-strip">
        <div>
          <strong>100<span>%</span></strong>
          <small>უსაფრთხო ავტორიზაცია</small>
        </div>
        <div>
          <strong>AI<span>×</span></strong>
          <small>ჭკვიანი ფასების სისტემა</small>
        </div>
        <div>
          <strong>24/7</strong>
          <small>რეალური დროის ტრეკინგი</small>
        </div>
        <div className="strip-note">
          <span>✳</span>
          <strong>შეკვეთები · ფლოტი · ანალიტიკა</strong>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <div>
            <span className="section-kicker">01 / შესაძლებლობები</span>
            <h2>ყველაფერი ერთ <span>პლატფორმაზე.</span></h2>
          </div>
          <p>
            შექმნილია იმისთვის, რომ ლოჯისტიკური პროცესები
            იყოს გამჭვირვალე, სწრაფი და ავტომატიზირებული.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <article
              key={feature.id}
              className={`feature-card ${
                activeFeature === feature.id ? "selected" : ""
              }`}
              onMouseEnter={() => setActiveFeature(feature.id)}
            >
              <div
                className="feature-preview"
                style={{
                  background: feature.color,
                  color: feature.accent,
                }}
              >
                <span className="preview-number">{feature.id}</span>
                <div className="preview-symbol">{feature.symbol}</div>
                <div className="preview-brand">{feature.name}</div>
                <div className="preview-description">{feature.type}</div>
                <div className="preview-bottom">
                  <span>OPTIMIZED WORKFLOW</span>
                  <span>↗</span>
                </div>
                <div className="preview-decoration" />
              </div>

              <div className="feature-info">
                <div>
                  <span>{feature.type}</span>
                  <h3>{feature.name}</h3>
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

      {/* FOOTER */}
      <footer className="footer">
        <Link href="/" className="footer-logo">S.</Link>
        <span>LOGISTICS OS · DIGITAL SYSTEMS</span>
        <a href="#home">ზევით ასვლა ↑</a>
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
          background: #f1f0ed;
          color: #191919;
          font-family: Arial, Helvetica, sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        :global(button) {
          font-family: inherit;
        }

        .logistics-landing {
          overflow: hidden;
          width: 100%;
        }

        /* HERO */
        .hero {
          height: min(740px, 90vh);
          min-height: 650px;
          margin: 7px;
          position: relative;
          overflow: hidden;
          border: 5px solid #fa941b;
          border-radius: 17px;
          isolation: isolate;
          background: #e85b0c;
        }

        .orange-bg {
          position: absolute;
          inset: 0;
          z-index: -3;
          background:
            radial-gradient(ellipse at 35% 85%, #ffb62e 0%, transparent 36%),
            linear-gradient(115deg, #a52b0a, #e84b0a 45%, #fa8d15);
        }

        .orange-bg::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          left: 18%;
          top: -53%;
          background: rgba(70, 12, 0, .16);
        }

        .orange-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .09;
          background-image: radial-gradient(white .6px, transparent .6px);
          background-size: 17px 17px;
        }

        .white-bg {
          position: absolute;
          z-index: -2;
          right: 0;
          top: 0;
          width: 49%;
          height: 100%;
          background: #fff;
          border-radius: 18px 0 0 18px;
        }

        /* LOGISTICS VISUAL (ახალი) */
        .logistics-visual {
          position: absolute;
          z-index: -1;
          left: 28%;
          top: 15%;
          width: 45%;
          height: 75%;
          pointer-events: none;
        }

        .main-image {
          width: 100%;
          height: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.3);
          position: relative;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(232, 91, 12, 0.4), transparent);
        }

        .floating-card {
          position: absolute;
          bottom: 15%;
          left: -10%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 16px 20px;
          border-radius: 14px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          gap: 14px;
          z-index: 5;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .card-icon {
          font-size: 28px;
          background: #f1f0ed;
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 12px;
        }

        .card-text strong {
          display: block;
          font-size: 11px;
          color: #191919;
          margin-bottom: 4px;
        }

        .card-text small {
          font-size: 9px;
          color: #888;
        }

        .vehicle-tags {
          position: absolute;
          top: -5%;
          right: -5%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 5;
        }

        .vehicle-tags span {
          background: rgba(255, 255, 255, 0.9);
          color: #191919;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* HEADER */
        .header {
          position: absolute;
          z-index: 10;
          left: 0;
          right: 0;
          top: 0;
          height: 75px;
          display: flex;
          align-items: center;
          padding: 0 4%;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
        }

        .brand-symbol {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .brand-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.3px;
          opacity: .8;
        }

        .desktop-nav {
          display: flex;
          gap: 29px;
          align-items: center;
          margin-left: auto;
          margin-right: 25px;
        }

        .desktop-nav a {
          font-size: 9px;
          font-weight: 800;
          color: #555;
          letter-spacing: .5px;
        }

        .desktop-nav a:hover {
          color: #f47716;
        }

        .menu-button {
          border: none;
          background: #f3f3f3;
          width: 37px;
          height: 37px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
        }

        .menu-button span {
          width: 14px;
          height: 1px;
          background: #333;
        }

        .mobile-menu {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 18px;
          top: 65px;
          right: 4%;
          background: white;
          color: #222;
          padding: 22px;
          min-width: 160px;
          border-radius: 10px;
          box-shadow: 0 10px 35px #0002;
        }

        .mobile-menu a {
          font-size: 10px;
          font-weight: 800;
        }

        /* HERO LEFT */
        .hero-left {
          position: absolute;
          z-index: 3;
          top: 27%;
          left: 4.5%;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.1px;
          margin-bottom: 19px;
        }

        .eyebrow span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: white;
        }

        .hero-left h1 {
          font-size: clamp(70px, 9vw, 130px);
          line-height: .9;
          font-weight: 900;
          letter-spacing: -6px;
          margin: 0 0 20px -5px;
          color: white;
        }

        .hero-description {
          font-size: 14px;
          line-height: 1.55;
          color: #ffffffdf;
          margin: 0 0 23px;
        }

        .main-button {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          background: white;
          color: #303030;
          border-radius: 30px;
          padding: 14px 20px;
          font-size: 9px;
          font-weight: 900;
          transition: .25s;
        }

        .main-button:hover {
          background: #252525;
          color: white;
          transform: translateY(-3px);
        }

        .main-button svg {
          width: 16px;
          height: 16px;
        }

        .mini-trust {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 37px;
        }

        .mini-symbols {
          display: flex;
        }

        .mini-symbols span {
          display: grid;
          place-items: center;
          width: 33px;
          height: 33px;
          border-radius: 50%;
          border: 2px solid #ed6612;
          margin-left: -7px;
          background: #252525;
          color: white;
          font-size: 13px;
        }

        .mini-symbols span:first-child {
          margin-left: 0;
        }

        .mini-trust strong {
          display: block;
          color: white;
          font-size: 8px;
          letter-spacing: .4px;
        }

        .mini-trust small {
          display: block;
          color: #ffffffc9;
          font-size: 9px;
          margin-top: 4px;
        }

        /* HERO FOOTER */
        .hero-footer {
          position: absolute;
          left: 4.5%;
          right: 4.5%;
          bottom: 2.5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #ffffffbd;
          font-size: 7px;
          letter-spacing: 1px;
        }

        .hero-footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-footer-left div {
          width: 30px;
          height: 1px;
          background: #ffffff9a;
        }

        .hero-footer a {
          color: #777;
          font-weight: 800;
        }

        /* QUICK STRIP */
        .quick-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #1b1b1b;
          color: white;
          margin: 7px;
          border-radius: 10px;
          padding: 20px 5%;
          gap: 15px;
          align-items: center;
        }

        .quick-strip > div {
          display: flex;
          align-items: center;
          gap: 12px;
          border-right: 1px solid #ffffff20;
        }

        .quick-strip > div:last-child {
          border: none;
        }

        .quick-strip strong {
          font-size: 24px;
          letter-spacing: -1px;
        }

        .quick-strip strong span {
          color: #f58a31;
        }

        .quick-strip small {
          font-size: 7px;
          letter-spacing: .8px;
          color: #aaa;
          line-height: 1.5;
        }

        .strip-note {
          color: #f58a31;
          font-size: 10px;
        }

        .strip-note strong {
          font-size: 8px;
          letter-spacing: .7px;
        }

        /* FEATURES SECTION */
        .features-section {
          padding: 65px 6%;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
        }

        .section-kicker {
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.4px;
          color: #e8752a;
        }

        .section-heading h2 {
          font-size: clamp(34px, 4vw, 48px);
          letter-spacing: -2px;
          margin: 12px 0 0;
          line-height: 1;
        }

        .section-heading h2 span {
          color: #ed792c;
        }

        .section-heading > p {
          max-width: 250px;
          font-size: 10px;
          line-height: 1.8;
          color: #888;
          margin: 0 0 3px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
        }

        .feature-card {
          min-width: 0;
          cursor: default;
        }

        .feature-preview {
          height: 210px;
          border-radius: 9px;
          overflow: hidden;
          position: relative;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: transform .3s;
        }

        .feature-card:hover .feature-preview {
          transform: translateY(-4px);
        }

        .preview-number {
          position: absolute;
          left: 13px;
          top: 12px;
          font-size: 8px;
          opacity: .7;
        }

        .preview-symbol {
          position: absolute;
          right: 15px;
          top: 20px;
          font-size: 90px;
          line-height: 1;
          opacity: .18;
        }

        .preview-brand {
          position: relative;
          z-index: 2;
          font-size: clamp(20px, 2.3vw, 29px);
          font-weight: 900;
          letter-spacing: -1px;
        }

        .preview-description {
          position: relative;
          z-index: 2;
          font-size: 7px;
          letter-spacing: 1px;
          margin-top: 5px;
        }

        .preview-bottom {
          position: absolute;
          bottom: 13px;
          left: 14px;
          right: 14px;
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          letter-spacing: .8px;
        }

        .preview-decoration {
          position: absolute;
          width: 160px;
          height: 160px;
          border: 1px solid currentColor;
          opacity: .22;
          border-radius: 50%;
          right: -65px;
          bottom: -80px;
        }

        .feature-info {
          padding: 12px 2px;
        }

        .feature-info > div:first-child > span {
          color: #e8752a;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .7px;
        }

        .feature-info h3 {
          font-size: 19px;
          letter-spacing: -.5px;
          margin: 5px 0;
        }

        .feature-info > p {
          font-size: 9px;
          color: #888;
          line-height: 1.6;
          min-height: 29px;
          margin: 0;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 10px;
        }

        .feature-tags span {
          border: 1px solid #dedbd5;
          border-radius: 20px;
          padding: 4px 7px;
          font-size: 6px;
          color: #777;
          letter-spacing: .4px;
        }

        /* FOOTER */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 7%;
          min-height: 60px;
          background: #191919;
          color: white;
          font-size: 7px;
          letter-spacing: .8px;
        }

        .footer-logo {
          font-size: 24px;
          font-weight: 900;
        }

        .footer-logo::first-letter {
          color: #f47716;
        }

        .footer > span {
          color: #999;
        }

        .footer > a:last-child {
          color: #ccc;
        }

        /* RESPONSIVE */
        @media(max-width: 900px) {
          .hero {
            min-height: 650px;
          }

          .hero-left h1 {
            font-size: 100px;
          }

          .logistics-visual {
            left: 25%;
            width: 50%;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .feature-preview {
            height: 230px;
          }
        }

        @media(max-width: 600px) {
          .hero {
            height: 790px;
            min-height: 790px;
            margin: 4px;
            border-width: 4px;
          }

          .white-bg {
            top: 49%;
            width: 100%;
            height: 51%;
            border-radius: 14px 14px 0 0;
          }

          .header {
            height: 65px;
            padding: 0 5%;
          }

          .brand-label {
            font-size: 7px;
          }

          .desktop-nav {
            display: none;
          }

          .hero-left {
            top: 16%;
            left: 6%;
          }

          .hero-left h1 {
            font-size: clamp(60px, 16vw, 90px);
            letter-spacing: -4px;
          }

          .eyebrow {
            font-size: 7px;
          }

          .hero-description {
            font-size: 11px;
            margin-bottom: 17px;
          }

          .mini-trust {
            display: none;
          }

          .logistics-visual {
            top: 50%;
            left: 5%;
            width: 90%;
            height: 45%;
          }

          .floating-card {
            left: 5%;
            bottom: 10%;
            padding: 12px 16px;
          }

          .card-icon {
            width: 40px;
            height: 40px;
            font-size: 22px;
          }

          .card-text strong {
            font-size: 10px;
          }

          .vehicle-tags {
            top: -10%;
            right: 0;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 6px;
          }

          .vehicle-tags span {
            font-size: 8px;
            padding: 6px 10px;
          }

          .hero-footer {
            display: none;
          }

          .quick-strip {
            grid-template-columns: repeat(2, 1fr);
            padding: 17px 6%;
            gap: 18px 10px;
          }

          .quick-strip > div {
            border: none;
          }

          .quick-strip strong {
            font-size: 21px;
          }

          .quick-strip small {
            font-size: 6px;
          }

          .features-section {
            padding: 43px 5%;
          }

          .section-heading {
            display: block;
          }

          .section-heading h2 {
            font-size: 36px;
          }

          .section-heading > p {
            margin-top: 15px;
          }

          .features-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 11px;
          }

          .feature-preview {
            height: 170px;
            padding: 10px;
          }

          .preview-brand {
            font-size: 20px;
          }

          .preview-symbol {
            font-size: 65px;
          }

          .feature-info h3 {
            font-size: 16px;
          }

          .feature-info > p {
            font-size: 8px;
          }

          .feature-tags span {
            font-size: 5px;
          }

          .footer {
            padding: 15px 5%;
            font-size: 6px;
          }
        }

        @media(max-width: 360px) {
          .hero {
            height: 750px;
            min-height: 750px;
          }

          .feature-preview {
            height: 145px;
          }
        }

        @media(prefers-reduced-motion: reduce) {
          :global(html) {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}