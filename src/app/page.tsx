
"use client";

import React from "react";

const projects = [
  {
    number: "01",
    name: "LUNARA",
    category: "AI · ASTROLOGY · TELEGRAM MINI APP",
    description:
      "An AI-powered astrology platform combining personalized horoscopes, tarot experiences and a digital rewards ecosystem.",
    image:
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1200&q=85",
    color: "#25134c",
    url: "#",
  },
  {
    number: "02",
    name: "VELORA",
    category: "BEAUTY TECH · BRANDING · DIGITAL PRODUCT",
    description:
      "A modern beauty technology concept focused on elegant client experiences, appointments and professional management.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85",
    color: "#d8b9a7",
    url: "#",
  },
  {
    number: "03",
    name: "EZO",
    category: "PROPTECH · SAAS · MANAGEMENT",
    description:
      "A digital property management ecosystem connecting residents, administrators and building communities.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    color: "#142b36",
    url: "#",
  },
  {
    number: "04",
    name: "LOGISTICS OS",
    category: "LOGISTICS · DIGITAL SYSTEMS · WEB",
    description:
      "A digital platform concept designed to present projects, organize services and simplify business workflows.",
    image:
      "https://images.unsplash.com/photo-1494412574643-35d324698f9c?auto=format&fit=crop&w=1200&q=85",
    color: "#d86a23",
    url: "#",
  },
];

function ArrowIcon() {
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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M5 8h14M5 16h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="portfolio">

      {/* HERO */}
      <section className="hero" id="home">

        <div className="orange-background">
          <div className="orange-circle circle-one" />
          <div className="orange-circle circle-two" />
          <div className="orange-glow" />
        </div>

        <div className="white-background" />

        {/* MAIN PORTRAIT */}
        <div className="portrait">
          <img
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=90"
            alt="Creative professional portrait"
          />
        </div>

        {/* HEADER */}
        <header className="header">

          <a href="#home" className="brand">
            <span className="brand-name">S<span>.</span></span>
            <span className="brand-description">CREATIVE PORTFOLIO</span>
          </a>

          <nav className="navigation">
            <a href="#work">WORK</a>
            <a href="#about">ABOUT</a>
            <a href="#services">SERVICES</a>
            <a href="#contact">CONTACT</a>
          </nav>

          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() =>
              document.querySelector(".mobile-menu")?.classList.toggle("open")
            }
          >
            <MenuIcon />
          </button>

          <nav className="mobile-menu">
            <a href="#work">WORK</a>
            <a href="#about">ABOUT</a>
            <a href="#services">SERVICES</a>
            <a href="#contact">CONTACT</a>
          </nav>

        </header>

        {/* LEFT CONTENT */}
        <div className="hero-content">

          <span className="eyebrow">
            <span className="eyebrow-dot" />
            INDEPENDENT CREATIVE DEVELOPER
          </span>

          <h1>CREATE</h1>

          <p className="hero-description">
            Ideas that inspire.
            <br />
            Projects that connect.
          </p>

          <a href="#work" className="view-button">
            VIEW WORK
            <ArrowIcon />
          </a>

          <div className="social-proof">
            <div className="avatar-stack">
              <span>✦</span>
              <span>◈</span>
              <span>✧</span>
              <span>＋</span>
            </div>

            <div className="social-proof-text">
              <strong>CREATIVE THINKING. DIGITAL EXECUTION.</strong>
              <p>Building ideas into digital experiences.</p>
            </div>
          </div>

        </div>

        {/* RIGHT CONTENT */}
        <div className="hero-side">

          <span className="availability">
            AVAILABLE FOR <i />
          </span>

          <h2>
            Freelance
            <br />
            Projects
          </h2>

          <p>
            Let's create something
            extraordinary together.
          </p>

        </div>

        {/* TESTIMONIAL / INTRO CARD */}
        <div className="floating-card">

          <span className="quote-mark">“</span>

          <p>
            Turning ambitious ideas into meaningful digital experiences.
          </p>

          <div className="card-footer">
            <div>
              <strong>CREATIVE MINDSET</strong>
              <span>DESIGN · DEVELOPMENT · IDEAS</span>
            </div>

            <div className="card-avatar">S.</div>
          </div>

        </div>

        <div className="hero-bottom">
          <span>INDEPENDENT CREATIVE PORTFOLIO</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>

      </section>

      {/* WORK SECTION */}
      <section className="work-section" id="work">

        <div className="section-header">
          <div>
            <span className="section-label">01 — SELECTED WORK</span>
            <h2>
              Ideas into
              <br />
              <span>experiences.</span>
            </h2>
          </div>

          <p>
            A collection of digital products, platforms,
            creative concepts and experiments.
            Each project starts with an idea.
          </p>
        </div>

        <div className="project-grid">

          {projects.map((project) => (
            <a
              href={project.url}
              key={project.number}
              className="project-card"
            >
              <div
                className="project-image"
                style={{ backgroundColor: project.color }}
              >
                <img src={project.image} alt={project.name} />

                <span className="project-number">
                  {project.number}
                </span>

                <span className="project-arrow">
                  <ArrowIcon />
                </span>
              </div>

              <div className="project-info">
                <div>
                  <span className="project-category">
                    {project.category}
                  </span>
                  <h3>{project.name}</h3>
                </div>

                <p>{project.description}</p>
              </div>
            </a>
          ))}

        </div>

        <div className="work-bottom">
          <span>MORE IDEAS. MORE POSSIBILITIES.</span>
          <span>2026 — PRESENT</span>
        </div>

      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">

        <div className="about-label">
          <span className="section-label">02 — ABOUT</span>
        </div>

        <div className="about-content">
          <h2>
            I don't just build
            <br />
            websites.
            <br />
            I build <span>ideas.</span>
          </h2>

          <div className="about-description">
            <p>
              I am an independent creator exploring the intersection
              of technology, design, artificial intelligence
              and digital products.
            </p>

            <p>
              From early-stage concepts to fully developed digital
              platforms, I enjoy transforming ambitious ideas
              into experiences that people can actually use.
            </p>

            <a href="#contact" className="about-link">
              LET'S CONNECT <ArrowIcon />
            </a>
          </div>
        </div>

      </section>

      {/* SERVICES */}
      <section className="services-section" id="services">

        <span className="section-label">03 — WHAT I DO</span>

        <h2>
          From imagination
          <br />
          <span>to implementation.</span>
        </h2>

        <div className="services-grid">

          {[
            ["01", "Digital Products", "Creating digital platforms, applications and product experiences."],
            ["02", "AI & Automation", "Exploring intelligent systems and practical AI-powered solutions."],
            ["03", "Web Development", "Building modern, responsive and functional web experiences."],
            ["04", "Creative Concepts", "Turning original ideas into visual identities and digital concepts."],
          ].map(([number, title, description]) => (
            <div className="service-item" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowIcon />
            </div>
          ))}

        </div>

      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">

        <span className="section-label">04 — GET IN TOUCH</span>

        <h2>
          Have an idea?
          <br />
          <span>Let's create.</span>
        </h2>

        <p>
          Every great project starts with a conversation.
          Let's make your next idea happen.
        </p>

        <a href="mailto:hello@example.com" className="contact-button">
          START A CONVERSATION
          <ArrowIcon />
        </a>

        <div className="contact-bottom">
          <span>OPEN TO INTERESTING PROJECTS</span>
          <span>LET'S MAKE SOMETHING GREAT.</span>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="footer">

        <a href="#home" className="footer-brand">
          S<span>.</span>
        </a>

        <p>Independent Creative Portfolio © 2026</p>

        <a href="#home">BACK TO TOP ↑</a>

      </footer>

      <style jsx>{`

        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          scroll-behavior: smooth;
        }

        :global(body) {
          margin: 0;
          background: #f4f3f0;
          color: #171717;
          font-family: Arial, Helvetica, sans-serif;
        }

        :global(a) {
          text-decoration: none;
          color: inherit;
        }

        :global(button) {
          font-family: inherit;
        }

        .portfolio {
          width: 100%;
          overflow: hidden;
        }

        /* HERO */

        .hero {
          position: relative;
          height: min(760px, 94vh);
          min-height: 680px;
          margin: 8px;
          border: 5px solid #f7931e;
          border-radius: 19px;
          overflow: hidden;
          isolation: isolate;
          background: #ed5b0b;
          color: #fff;
        }

        .orange-background {
          position: absolute;
          inset: 0;
          z-index: -3;
          background: linear-gradient(
            120deg,
            #a52b0c 0%,
            #e44b0a 36%,
            #ff8b14 70%,
            #f9a31b 100%
          );
        }

        .orange-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(120, 25, 0, .13);
        }

        .circle-one {
          width: 520px;
          height: 520px;
          left: 20%;
          top: -60%;
        }

        .circle-two {
          width: 440px;
          height: 440px;
          left: 26%;
          bottom: -30%;
          background: rgba(255, 191, 46, .23);
        }

        .orange-glow {
          position: absolute;
          width: 450px;
          height: 450px;
          left: 15%;
          bottom: -30%;
          background: rgba(255, 175, 27, .25);
          filter: blur(70px);
          border-radius: 50%;
        }

        .white-background {
          position: absolute;
          z-index: -2;
          right: 0;
          top: 0;
          width: 49%;
          height: 100%;
          background: #fff;
          border-radius: 18px 0 0 18px;
        }

        /* PORTRAIT */

        .portrait {
          position: absolute;
          z-index: -1;
          left: 22%;
          bottom: 0;
          width: 49%;
          height: 90%;
          overflow: hidden;
        }

        .portrait img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          filter: saturate(.85) contrast(1.05);
          mask-image: linear-gradient(
            to bottom,
            black 0%,
            black 85%,
            transparent 100%
          );
        }

        /* HEADER */

        .header {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 88px;
          padding: 0 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-name {
          font-size: 29px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .brand-name span,
        .footer-brand span {
          color: #f7931e;
        }

        .brand-description {
          font-size: 9px;
          letter-spacing: 1.3px;
          font-weight: 700;
          color: rgba(255,255,255,.8);
        }

        .navigation {
          display: flex;
          gap: 34px;
          align-items: center;
          margin-left: auto;
          margin-right: 35px;
        }

        .navigation a {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .7px;
          color: #555;
          transition: color .2s;
        }

        .navigation a:hover {
          color: #f47716;
        }

        .menu-button {
          width: 39px;
          height: 39px;
          border: none;
          border-radius: 50%;
          background: #f3f3f3;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .menu-button svg {
          width: 22px;
        }

        .mobile-menu {
          display: none;
          position: absolute;
          top: 75px;
          right: 5%;
          background: white;
          color: #171717;
          padding: 20px 25px;
          border-radius: 12px;
          box-shadow: 0 10px 30px #00000015;
          flex-direction: column;
          gap: 20px;
          min-width: 160px;
        }

        .mobile-menu.open {
          display: flex;
        }

        .mobile-menu a {
          font-size: 11px;
          font-weight: 700;
        }

        /* LEFT HERO */

        .hero-content {
          position: absolute;
          left: 4.5%;
          top: 28%;
          z-index: 2;
        }

        .eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 9px;
          color: rgba(255,255,255,.85);
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }

        .hero-content h1 {
          font-size: clamp(95px, 11vw, 155px);
          font-weight: 900;
          line-height: .85;
          letter-spacing: -8px;
          margin: 0 0 25px -7px;
          color: #fff;
        }

        .hero-description {
          font-size: 15px;
          line-height: 1.5;
          color: rgba(255,255,255,.85);
          margin: 0 0 28px;
        }

        .view-button {
          background: #fff;
          color: #252525;
          border-radius: 40px;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          padding: 15px 22px;
          font-size: 10px;
          font-weight: 800;
          transition: .25s;
        }

        .view-button:hover {
          background: #252525;
          color: white;
          transform: translateY(-3px);
        }

        .view-button svg {
          width: 16px;
          height: 16px;
        }

        /* SOCIAL PROOF */

        .social-proof {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 65px;
        }

        .avatar-stack {
          display: flex;
        }

        .avatar-stack span {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 2px solid #ed6512;
          margin-left: -8px;
          background: #272727;
          color: #fff;
          font-size: 14px;
        }

        .avatar-stack span:first-child {
          margin-left: 0;
        }

        .avatar-stack span:nth-child(2) {
          background: #d98b70;
        }

        .avatar-stack span:nth-child(3) {
          background: #536a78;
        }

        .avatar-stack span:last-child {
          background: rgba(255,255,255,.18);
        }

        .social-proof-text strong {
          font-size: 8px;
          letter-spacing: .5px;
        }

        .social-proof-text p {
          font-size: 10px;
          color: rgba(255,255,255,.75);
          margin: 6px 0 0;
        }

        /* RIGHT HERO */

        .hero-side {
          position: absolute;
          right: 8%;
          top: 30%;
          z-index: 3;
          color: #171717;
        }

        .availability {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #888;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .availability i {
          width: 6px;
          height: 6px;
          background: #f47716;
          border-radius: 50%;
        }

        .hero-side h2 {
          font-size: 34px;
          letter-spacing: -1.5px;
          line-height: 1.05;
          margin: 0;
          font-weight: 800;
        }

        .hero-side p {
          font-size: 11px;
          color: #888;
          line-height: 1.7;
          max-width: 180px;
          margin-top: 18px;
        }

        /* FLOATING CARD */

        .floating-card {
          position: absolute;
          right: 4%;
          bottom: 5%;
          z-index: 5;
          width: 225px;
          background: #f7f7f7;
          color: #222;
          padding: 17px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.05);
        }

        .quote-mark {
          font-family: Georgia, serif;
          font-size: 35px;
          line-height: .8;
          font-weight: 900;
          color: #e77730;
        }

        .floating-card > p {
          font-size: 10px;
          line-height: 1.6;
          color: #555;
          margin: 10px 0 17px;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-footer strong {
          display: block;
          font-size: 8px;
        }

        .card-footer span {
          display: block;
          margin-top: 4px;
          font-size: 7px;
          color: #999;
        }

        .card-avatar {
          width: 37px;
          height: 37px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #e87726;
          color: #fff;
          font-weight: 900;
          font-size: 15px;
        }

        .hero-bottom {
          position: absolute;
          left: 4.5%;
          right: 4.5%;
          bottom: 2%;
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          letter-spacing: 1px;
          color: rgba(255,255,255,.6);
        }

        /* WORK */

        .work-section {
          padding: 125px 8%;
          background: #f5f4f1;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 65px;
        }

        .section-label {
          color: #e8752a;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .section-header h2,
        .about-content h2,
        .services-section > h2 {
          font-size: clamp(45px, 6vw, 76px);
          line-height: .98;
          letter-spacing: -4px;
          margin: 25px 0 0;
          font-weight: 800;
        }

        .section-header h2 span,
        .about-content h2 span,
        .services-section > h2 span {
          color: #ef762b;
        }

        .section-header > p {
          max-width: 290px;
          color: #888;
          font-size: 12px;
          line-height: 1.9;
          margin: 0 0 5px;
        }

        .project-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px 25px;
        }

        .project-card {
          display: block;
          min-width: 0;
        }

        .project-image {
          position: relative;
          height: 340px;
          border-radius: 12px;
          overflow: hidden;
        }

        .project-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .6s;
        }

        .project-card:hover .project-image img {
          transform: scale(1.05);
        }

        .project-number {
          position: absolute;
          left: 20px;
          top: 20px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          z-index: 2;
        }

        .project-arrow {
          position: absolute;
          right: 20px;
          bottom: 20px;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #171717;
          border-radius: 50%;
          transition: .25s;
        }

        .project-arrow svg {
          width: 18px;
        }

        .project-card:hover .project-arrow {
          background: #f47716;
          color: #fff;
        }

        .project-info {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding-top: 23px;
        }

        .project-category {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .8px;
          color: #999;
        }

        .project-info h3 {
          font-size: 26px;
          letter-spacing: -1px;
          margin: 9px 0 0;
        }

        .project-info > p {
          max-width: 210px;
          color: #888;
          font-size: 10px;
          line-height: 1.8;
          margin: 0;
        }

        .work-bottom {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #deddd9;
          margin-top: 70px;
          padding-top: 20px;
          color: #999;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        /* ABOUT */

        .about-section {
          padding: 110px 8%;
          background: #fff;
        }

        .about-content {
          display: grid;
          grid-template-columns: 1.3fr .7fr;
          align-items: center;
          gap: 8%;
          margin-top: 45px;
        }

        .about-description p {
          font-size: 13px;
          line-height: 1.9;
          color: #888;
          margin-bottom: 20px;
        }

        .about-link {
          display: inline-flex;
          align-items: center;
          gap: 15px;
          margin-top: 15px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #e8752a;
        }

        .about-link svg {
          width: 17px;
        }

        /* SERVICES */

        .services-section {
          padding: 110px 8%;
          background: #ebe9e5;
        }

        .services-section > h2 {
          margin-bottom: 65px;
        }

        .services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 35px;
        }

        .service-item {
          position: relative;
          padding: 28px 40px 28px 0;
          border-top: 1px solid #d7d4ce;
        }

        .service-item > span {
          color: #e8752a;
          font-size: 9px;
          font-weight: 800;
        }

        .service-item h3 {
          font-size: 22px;
          letter-spacing: -.6px;
          margin: 17px 0 10px;
        }

        .service-item p {
          max-width: 300px;
          font-size: 11px;
          line-height: 1.8;
          color: #888;
        }

        .service-item > svg {
          position: absolute;
          right: 0;
          top: 35px;
          width: 18px;
        }

        /* CONTACT */

        .contact-section {
          position: relative;
          padding: 110px 8%;
          background: linear-gradient(120deg, #b83c0b, #f47716 65%, #f99b21);
          color: white;
          overflow: hidden;
        }

        .contact-section::after {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 50%;
          right: -10%;
          top: -50%;
          pointer-events: none;
        }

        .contact-section h2 {
          position: relative;
          z-index: 1;
          font-size: clamp(65px, 10vw, 125px);
          letter-spacing: -6px;
          line-height: .9;
          margin: 35px 0;
        }

        .contact-section h2 span {
          color: transparent;
          -webkit-text-stroke: 1px white;
        }

        .contact-section > p {
          font-size: 13px;
          color: rgba(255,255,255,.8);
          line-height: 1.8;
          max-width: 360px;
          margin-bottom: 30px;
        }

        .contact-button {
          display: inline-flex;
          align-items: center;
          gap: 25px;
          padding: 17px 23px;
          background: #fff;
          color: #222;
          border-radius: 40px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .8px;
          transition: .25s;
        }

        .contact-button:hover {
          background: #222;
          color: white;
          transform: translateY(-3px);
        }

        .contact-button svg {
          width: 17px;
        }

        .contact-bottom {
          display: flex;
          justify-content: space-between;
          margin-top: 100px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.25);
          font-size: 8px;
          letter-spacing: 1px;
          color: rgba(255,255,255,.7);
        }

        /* FOOTER */

        .footer {
          min-height: 90px;
          padding: 25px 8%;
          background: #171717;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .footer-brand {
          font-size: 25px;
          font-weight: 900;
        }

        .footer p,
        .footer > a:last-child {
          font-size: 9px;
          color: #999;
        }

        /* RESPONSIVE */

        @media(max-width: 1000px) {
          .hero-content h1 {
            font-size: 110px;
          }

          .portrait {
            left: 23%;
            width: 48%;
          }

          .hero-side {
            right: 5%;
          }

          .hero-side h2 {
            font-size: 28px;
          }

          .project-image {
            height: 280px;
          }
        }

        @media(max-width: 700px) {

          .hero {
            height: 850px;
            min-height: 850px;
            margin: 5px;
            border-width: 4px;
            border-radius: 13px;
          }

          .white-background {
            top: 48%;
            width: 100%;
            height: 52%;
            border-radius: 15px 15px 0 0;
          }

          .header {
            height: 70px;
            padding: 0 6%;
          }

          .brand-name {
            font-size: 24px;
          }

          .brand-description {
            font-size: 7px;
          }

          .navigation {
            display: none;
          }

          .hero-content {
            top: 17%;
            left: 6%;
          }

          .eyebrow {
            font-size: 7px;
          }

          .hero-content h1 {
            font-size: clamp(78px, 19vw, 115px);
            letter-spacing: -5px;
          }

          .hero-description {
            font-size: 12px;
          }

          .view-button {
            padding: 13px 18px;
            font-size: 9px;
          }

          .social-proof {
            display: none;
          }

          .portrait {
            left: 2%;
            width: 66%;
            height: 47%;
            bottom: 0;
          }

          .portrait img {
            object-position: center 20%;
          }

          .hero-side {
            top: 55%;
            right: 5%;
            width: 36%;
          }

          .availability {
            font-size: 7px;
          }

          .hero-side h2 {
            font-size: clamp(22px, 6vw, 31px);
          }

          .hero-side p {
            font-size: 9px;
          }

          .floating-card {
            width: 185px;
            right: 3%;
            bottom: 3%;
            padding: 13px;
          }

          .floating-card > p {
            font-size: 9px;
          }

          .hero-bottom {
            display: none;
          }

          .work-section,
          .about-section,
          .services-section,
          .contact-section {
            padding: 75px 7%;
          }

          .section-header {
            display: block;
            margin-bottom: 40px;
          }

          .section-header h2,
          .about-content h2,
          .services-section > h2 {
            font-size: clamp(43px, 10vw, 65px);
            letter-spacing: -3px;
          }

          .section-header > p {
            margin-top: 25px;
          }

          .project-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .project-image {
            height: 260px;
          }

          .project-info {
            display: block;
          }

          .project-info > p {
            max-width: 320px;
            margin-top: 15px;
          }

          .about-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .services-grid {
            grid-template-columns: 1fr;
          }

          .contact-section h2 {
            font-size: clamp(65px, 14vw, 95px);
            letter-spacing: -4px;
          }

          .contact-bottom {
            margin-top: 65px;
            font-size: 7px;
          }

          .footer {
            flex-wrap: wrap;
            padding: 25px 7%;
          }

        }

        @media(max-width: 390px) {
          .hero {
            height: 820px;
            min-height: 820px;
          }

          .hero-side h2 {
            font-size: 22px;
          }

          .floating-card {
            width: 165px;
          }

          .project-image {
            height: 220px;
          }
        }

        @media(prefers-reduced-motion: reduce) {
          :global(html) {
            scroll-behavior: auto;
          }

          *,
          *::before,
          *::after {
            transition-duration: .01ms !important;
          }
        }

      `}</style>
    </main>
  );
}
