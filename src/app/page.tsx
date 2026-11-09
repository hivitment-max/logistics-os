"use client";

import React, { useState } from "react";
import Link from "next/link";

const projects = [
  {
    id: "01",
    name: "LUNARA",
    type: "AI / ASTROLOGY",
    description: "AI-powered astrology and tarot ecosystem.",
    color: "#33205b",
    accent: "#d7a5ff",
    symbol: "✳",
    tags: ["AI", "TELEGRAM", "SAAS"],
    url: "#",
  },
  {
    id: "02",
    name: "VELORA",
    type: "BEAUTY TECH",
    description: "Next-generation beauty business platform.",
    color: "#e9c9b6",
    accent: "#8f594b",
    symbol: "V",
    tags: ["PRODUCT", "DESIGN", "TECH"],
    url: "#",
  },
  {
    id: "03",
    name: "EZO",
    type: "PROPTECH",
    description: "Smart property and community management.",
    color: "#102d35",
    accent: "#46d9c5",
    symbol: "◈",
    tags: ["SAAS", "WEB", "SYSTEMS"],
    url: "#",
  },
  {
    id: "04",
    name: "LOGISTICS OS",
    type: "DIGITAL SYSTEMS",
    description: "Modern digital logistics experience.",
    color: "#e87521",
    accent: "#fff2d9",
    symbol: "↗",
    tags: ["WEB", "AUTOMATION"],
    url: "/logistics", // ✅ აქ არის ლინკი ლოჯისტიკის გვერდზე!
  },
];

const services = [
  ["01", "Digital Products", "Web platforms & applications"],
  ["02", "AI & Automation", "Intelligent digital solutions"],
  ["03", "Creative Development", "Design, technology & execution"],
  ["04", "Product Strategy", "From idea to real product"],
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

function Plane() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M21 3 9 14m12-11-7 18-4-8-8-4L21 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState("01");

  return (
    <main className="portfolio">

      {/* MAIN HERO */}
      <section className="hero" id="home">

        <div className="orange-bg" />
        <div className="white-bg" />

        {/* ABSTRACT GRAPHICS - NO HUMAN PHOTOGRAPHY */}
        <div className="abstract-art">
          <div className="art-circle">
            <div className="art-inner-circle" />
            <div className="art-core">S.</div>
          </div>
          <div className="art-orbit orbit-1" />
          <div className="art-orbit orbit-2" />
          <div className="art-orbit orbit-3" />
          <div className="art-star">✳</div>
          <div className="art-cross">✳</div>
          <div className="art-glow" />
          <div className="art-caption">IDEAS IN MOTION — 2026</div>
        </div>

        {/* HEADER */}
        <header className="header">

          <a href="#home" className="brand">
            <span className="brand-symbol">S.</span>
            <span className="brand-label">CREATIVE STUDIO</span>
          </a>

          <nav className="desktop-nav">
            <a href="#work">WORK</a>
            <a href="#about">ABOUT</a>
            <a href="#services">SERVICES</a>
            <a href="#contact">CONTACT</a>
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
              {["work", "about", "services", "contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.toUpperCase()}
                </a>
              ))}
            </nav>
          )}

        </header>

        {/* LEFT SIDE */}
        <div className="hero-left">

          <div className="eyebrow">
            <span />
            INDEPENDENT CREATIVE DEVELOPER
          </div>

          <h1>CREATE</h1>

          <p className="hero-description">
            Ideas that inspire.
            <br />
            Digital experiences that connect.
          </p>

          <a href="#work" className="main-button">
            VIEW PROJECTS <Arrow />
          </a>

          <div className="mini-trust">
            <div className="mini-symbols">
              <span>✳</span>
              <span>◈</span>
              <span>✦</span>
              <span>+</span>
            </div>
            <div>
              <strong>BUILT WITH PURPOSE</strong>
              <small>Ideas transformed into products.</small>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="hero-right">

          <div className="available">
            <span />
            AVAILABLE FOR
          </div>

          <h2>
            Creative
            <br />
            Projects
          </h2>

          <p>Digital products. Technology. New ideas.</p>

          <div className="featured-project">
            <div className="featured-top">
              <span>FEATURED PROJECT</span>
              <span>01 / 04</span>
            </div>

            <div className="featured-visual">
              <div className="featured-decoration">✳</div>
              <span>LUNARA</span>
              <small>THE COSMIC EXPERIENCE</small>
              <div className="featured-orbit" />
            </div>

            <div className="featured-bottom">
              <div>
                <strong>LUNARA</strong>
                <small>AI · ASTROLOGY · DIGITAL PRODUCT</small>
              </div>
              <a href="#work" aria-label="Explore projects">
                <Arrow />
              </a>
            </div>
          </div>

        </div>

        {/* BOTTOM INFORMATION */}
        <div className="hero-footer">

          <div className="hero-footer-left">
            <span>01</span>
            <div />
            <span>04</span>
          </div>

          <div className="hero-footer-center">
            INDEPENDENT DIGITAL PORTFOLIO
          </div>

          <a href="#work">
            EXPLORE WORK <span>↓</span>
          </a>

        </div>

      </section>

      {/* QUICK INFORMATION STRIP */}
      <section className="quick-strip">
        <div>
          <strong>04<span>+</span></strong>
          <small>DIGITAL PROJECTS</small>
        </div>
        <div>
          <strong>AI<span>×</span></strong>
          <small>TECHNOLOGY & INNOVATION</small>
        </div>
        <div>
          <strong>∞</strong>
          <small>IDEAS IN PROGRESS</small>
        </div>
        <div className="strip-note">
          <span>✳</span>
          <strong>THINK. CREATE. BUILD.</strong>
        </div>
      </section>

      {/* SELECTED WORK */}
      <section className="work-section" id="work">

        <div className="section-heading">
          <div>
            <span className="section-kicker">01 / SELECTED WORK</span>
            <h2>Selected <span>projects.</span></h2>
          </div>
          <p>
            A collection of ideas, digital products
            and technology-driven experiments.
          </p>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              href={project.url || "#"}
              key={project.id}
              className={`project-card ${
                activeProject === project.id ? "selected" : ""
              }`}
              onMouseEnter={() => setActiveProject(project.id)}
            >
              <div
                className="project-preview"
                style={{
                  background: project.color,
                  color: project.accent,
                }}
              >
                <span className="preview-number">{project.id}</span>

                <div className="preview-symbol">
                  {project.symbol}
                </div>

                <div className="preview-brand">{project.name}</div>

                <div className="preview-description">
                  {project.type}
                </div>

                <div className="preview-bottom">
                  <span>CREATED WITH VISION</span>
                  <span>↗</span>
                </div>

                <div className="preview-decoration" />
              </div>

              <div className="project-info">
                <div>
                  <span>{project.type}</span>
                  <h3>{project.name}</h3>
                </div>
                <p>{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">

        <div className="about-title">
          <span className="section-kicker">02 / THE MINDSET</span>
          <h2>
            THINK
            <span>DIFFERENT.</span>
          </h2>
        </div>

        <div className="about-text">
          <div className="about-symbol">✳</div>
          <div>
            <h3>Not just ideas.<br />Things that actually work.</h3>
            <p>
              Exploring the intersection of artificial intelligence,
              technology, design and entrepreneurship.
              Turning concepts into practical digital products,
              platforms and experiences.
            </p>
          </div>
        </div>

        <div className="about-bottom">
          <span>CREATIVITY IS THE STARTING POINT.</span>
          <span>EXECUTION MAKES THE DIFFERENCE. ↗</span>
        </div>

      </section>

      {/* SERVICES */}
      <section className="services-section" id="services">

        <div className="section-heading">
          <div>
            <span className="section-kicker">03 / CAPABILITIES</span>
            <h2>What I <span>create.</span></h2>
          </div>
          <p>
            Combining creative thinking with technology
            to build useful digital experiences.
          </p>
        </div>

        <div className="services-list">
          {services.map(([number, title, description]) => (
            <div className="service-row" key={number}>
              <span className="service-number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <Arrow />
            </div>
          ))}
        </div>

      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">

        <div className="contact-decoration">✳</div>

        <span className="section-kicker">04 / LET'S CONNECT</span>

        <h2>
          HAVE AN
          <br />
          <span>IDEA?</span>
        </h2>

        <p>
          Let's turn something interesting
          into something real.
        </p>

        <a href="mailto:hello@example.com" className="contact-button">
          START A CONVERSATION <Arrow />
        </a>

        <div className="contact-meta">
          <span>OPEN TO NEW PROJECTS</span>
          <span>CREATIVE COLLABORATIONS</span>
          <span>2026 — PRESENT</span>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a href="#home" className="footer-logo">S.</a>
        <span>INDEPENDENT CREATIVE PORTFOLIO</span>
        <a href="#home">BACK TO TOP ↑</a>
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

        .portfolio {
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

        /* ABSTRACT ART */

        .abstract-art {
          position: absolute;
          z-index: -1;
          left: 30%;
          top: 16%;
          width: 39%;
          height: 70%;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: none;
        }

        .art-circle {
          position: relative;
          width: min(390px, 85%);
          aspect-ratio: 1;
          border-radius: 50%;
          background: linear-gradient(145deg, #ffbd50, #e85a0b 48%, #54200e);
          box-shadow: 0 30px 100px #9b310c55;
          display: grid;
          place-items: center;
        }

        .art-inner-circle {
          position: absolute;
          inset: 12%;
          border: 1px solid rgba(255,255,255,.45);
          border-radius: 50%;
        }

        .art-core {
          width: 48%;
          height: 48%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: white;
          background: linear-gradient(135deg, #f8a92e, #a53610);
          border: 1px solid #ffffff80;
          box-shadow: inset 0 0 40px #ffffff30, 0 0 50px #ffb34a55;
          font-size: clamp(40px, 7vw, 90px);
          font-weight: 900;
          letter-spacing: -7px;
        }

        .art-orbit {
          position: absolute;
          width: 125%;
          height: 42%;
          border: 1px solid rgba(255,255,255,.55);
          border-radius: 50%;
          transform: rotate(-35deg);
        }

        .orbit-2 {
          transform: rotate(35deg);
          width: 120%;
          height: 60%;
          border-color: rgba(255,215,155,.65);
        }

        .orbit-3 {
          transform: rotate(80deg);
          width: 100%;
          height: 90%;
          border-color: rgba(255,255,255,.3);
        }

        .art-star {
          position: absolute;
          top: 4%;
          right: 8%;
          font-size: 54px;
          color: #ffb52d;
        }

        .art-cross {
          position: absolute;
          left: 4%;
          bottom: 14%;
          color: #fff;
          font-size: 35px;
        }

        .art-glow {
          position: absolute;
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: #ffab28;
          filter: blur(85px);
          opacity: .17;
          z-index: -1;
        }

        .art-caption {
          position: absolute;
          bottom: -2%;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 8px;
          letter-spacing: 2px;
          white-space: nowrap;
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
          font-size: clamp(90px, 10.8vw, 145px);
          line-height: .83;
          font-weight: 900;
          letter-spacing: -8px;
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

        .main-button svg,
        .featured-bottom svg {
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

        .mini-symbols span:nth-child(2) {
          background: #533d76;
        }

        .mini-symbols span:nth-child(3) {
          background: #c77b36;
        }

        .mini-symbols span:last-child {
          background: #ffffff35;
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

        /* HERO RIGHT */

        .hero-right {
          position: absolute;
          right: 4%;
          top: 24%;
          width: 25%;
          z-index: 4;
          color: #191919;
        }

        .available {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #888;
          margin-bottom: 13px;
        }

        .available span {
          width: 6px;
          height: 6px;
          background: #ef7b30;
          border-radius: 50%;
        }

        .hero-right h2 {
          font-size: clamp(25px, 3vw, 36px);
          line-height: 1;
          letter-spacing: -1.5px;
          margin: 0;
          font-weight: 900;
        }

        .hero-right > p {
          font-size: 10px;
          color: #999;
          margin: 10px 0 17px;
        }

        /* FEATURED PROJECT CARD */

        .featured-project {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: #f3f2f0;
        }

        .featured-top {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .6px;
          color: #999;
          padding: 4px 3px 9px;
        }

        .featured-visual {
          height: 112px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #281747, #7143a1);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 14px;
          border-radius: 7px;
        }

        .featured-visual > span {
          font-size: 23px;
          font-weight: 900;
          letter-spacing: 2px;
          z-index: 2;
        }

        .featured-visual small {
          font-size: 6px;
          letter-spacing: 2px;
          z-index: 2;
          margin-top: 4px;
        }

        .featured-decoration {
          position: absolute;
          right: 10px;
          top: -30px;
          font-size: 115px;
          color: #ffffff27;
        }

        .featured-orbit {
          position: absolute;
          right: -12px;
          bottom: -43px;
          width: 135px;
          height: 95px;
          border: 1px solid #ffffff66;
          border-radius: 50%;
          transform: rotate(-35deg);
        }

        .featured-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 2px 1px;
        }

        .featured-bottom strong {
          display: block;
          font-size: 9px;
        }

        .featured-bottom small {
          display: block;
          color: #999;
          font-size: 6px;
          margin-top: 4px;
        }

        .featured-bottom a {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #e8752a;
          color: white;
          display: grid;
          place-items: center;
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

        /* SHARED SECTIONS */

        .work-section,
        .services-section {
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

        /* PROJECT GRID */

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
        }

        .project-card {
          min-width: 0;
          cursor: default;
          display: block; /* Added for Link compatibility */
        }

        .project-preview {
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

        .project-card:hover .project-preview {
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

        .project-info {
          padding: 12px 2px;
        }

        .project-info > div:first-child > span {
          color: #e8752a;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .7px;
        }

        .project-info h3 {
          font-size: 19px;
          letter-spacing: -.5px;
          margin: 5px 0;
        }

        .project-info > p {
          font-size: 9px;
          color: #888;
          line-height: 1.6;
          min-height: 29px;
          margin: 0;
        }

        .project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 10px;
        }

        .project-tags span {
          border: 1px solid #dedbd5;
          border-radius: 20px;
          padding: 4px 7px;
          font-size: 6px;
          color: #777;
          letter-spacing: .4px;
        }

        /* ABOUT */

        .about-section {
          margin: 7px;
          border-radius: 10px;
          background: #eceae5;
          padding: 48px 6% 18px;
        }

        .about-section .about-title h2 {
          font-size: clamp(48px, 7vw, 85px);
          letter-spacing: -5px;
          line-height: .85;
          margin: 15px 0;
        }

        .about-title h2 span {
          color: #e8752a;
          margin-left: 15px;
        }

        .about-text {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 20px;
          margin-top: -8px;
        }

        .about-symbol {
          width: 65px;
          height: 65px;
          display: grid;
          place-items: center;
          background: #f47716;
          color: white;
          border-radius: 50%;
          font-size: 36px;
        }

        .about-text > div:last-child {
          max-width: 350px;
        }

        .about-text h3 {
          font-size: 18px;
          line-height: 1.2;
          margin: 0 0 8px;
        }

        .about-text p {
          font-size: 9px;
          line-height: 1.7;
          color: #777;
          margin: 0;
        }

        .about-bottom {
          border-top: 1px solid #d7d3cc;
          padding-top: 12px;
          margin-top: 28px;
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          letter-spacing: 1px;
          color: #888;
          font-weight: 800;
        }

        /* SERVICES */

        .services-section {
          padding-top: 55px;
          padding-bottom: 55px;
        }

        .services-list {
          border-top: 1px solid #ddd9d2;
        }

        .service-row {
          display: grid;
          grid-template-columns: 40px 1fr 1fr 20px;
          align-items: center;
          gap: 15px;
          padding: 17px 5px;
          border-bottom: 1px solid #ddd9d2;
        }

        .service-number {
          color: #ed792c;
          font-size: 9px;
          font-weight: 800;
        }

        .service-row h3 {
          font-size: 14px;
          margin: 0;
        }

        .service-row p {
          color: #888;
          font-size: 9px;
          margin: 0;
        }

        .service-row svg {
          width: 15px;
        }

        /* CONTACT */

        .contact-section {
          position: relative;
          margin: 7px;
          border-radius: 10px;
          padding: 45px 6% 20px;
          overflow: hidden;
          background: linear-gradient(115deg, #a9360c, #f47b18);
          color: white;
        }

        .contact-decoration {
          position: absolute;
          right: 8%;
          top: -95px;
          font-size: 300px;
          color: #ffffff12;
          pointer-events: none;
        }

        .contact-section h2 {
          position: relative;
          font-size: clamp(55px, 8vw, 90px);
          line-height: .82;
          letter-spacing: -5px;
          margin: 20px 0;
        }

        .contact-section h2 span {
          color: transparent;
          -webkit-text-stroke: 1px white;
        }

        .contact-section > p {
          font-size: 10px;
          color: #ffffffcc;
          margin: 15px 0;
        }

        .contact-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          padding: 13px 18px;
          border-radius: 30px;
          background: white;
          color: #252525;
          font-size: 8px;
          font-weight: 900;
          margin-top: 5px;
        }

        .contact-button svg {
          width: 15px;
        }

        .contact-meta {
          position: relative;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid #ffffff40;
          padding-top: 13px;
          margin-top: 40px;
          font-size: 7px;
          letter-spacing: .9px;
          color: #ffffffbd;
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

          .abstract-art {
            left: 28%;
            width: 40%;
          }

          .projects-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .project-preview {
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
            font-size: clamp(76px, 19vw, 110px);
            letter-spacing: -5px;
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

          .abstract-art {
            top: 52%;
            left: 2%;
            width: 57%;
            height: 43%;
          }

          .art-circle {
            width: 85%;
          }

          .art-core {
            font-size: 46px;
          }

          .art-star {
            font-size: 35px;
          }

          .art-caption {
            font-size: 6px;
          }

          .hero-right {
            top: 54%;
            right: 4%;
            width: 38%;
          }

          .hero-right h2 {
            font-size: 24px;
          }

          .hero-right > p {
            font-size: 8px;
            line-height: 1.5;
          }

          .featured-visual {
            height: 78px;
          }

          .featured-visual > span {
            font-size: 15px;
          }

          .featured-decoration {
            font-size: 80px;
          }

          .featured-bottom strong {
            font-size: 8px;
          }

          .featured-bottom small {
            font-size: 5px;
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

          .work-section,
          .services-section {
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

          .projects-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 11px;
          }

          .project-preview {
            height: 170px;
            padding: 10px;
          }

          .preview-brand {
            font-size: 20px;
          }

          .preview-symbol {
            font-size: 65px;
          }

          .project-info h3 {
            font-size: 16px;
          }

          .project-info > p {
            font-size: 8px;
          }

          .project-tags span {
            font-size: 5px;
          }

          .about-section {
            padding: 35px 5% 15px;
          }

          .about-section .about-title h2 {
            font-size: 52px;
            letter-spacing: -4px;
          }

          .about-title h2 span {
            display: block;
            margin: 7px 0 0;
          }

          .about-text {
            justify-content: flex-start;
            margin-top: 25px;
            gap: 14px;
          }

          .about-symbol {
            min-width: 48px;
            width: 48px;
            height: 48px;
            font-size: 26px;
          }

          .about-text h3 {
            font-size: 15px;
          }

          .about-bottom {
            font-size: 6px;
            gap: 10px;
          }

          .service-row {
            grid-template-columns: 25px 1fr 18px;
            gap: 10px;
          }

          .service-row h3 {
            font-size: 12px;
          }

          .service-row p {
            display: none;
          }

          .contact-section {
            padding: 35px 5% 18px;
          }

          .contact-section h2 {
            font-size: 65px;
            letter-spacing: -4px;
          }

          .contact-decoration {
            font-size: 200px;
            right: 0;
          }

          .contact-meta {
            font-size: 5px;
            letter-spacing: .3px;
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

          .hero-right h2 {
            font-size: 21px;
          }

          .project-preview {
            height: 145px;
          }

          .about-section .about-title h2 {
            font-size: 45px;
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