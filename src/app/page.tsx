"use client";

import React, { useState } from "react";
import Link from "next/link";

const projects = [
  {
    id: "01",
    name: "LUNARA",
    type: "AI / ასტროლოგია",
    description: "ხელოვნური ინტელექტით მომუშავე ასტროლოგიისა და ტაროს ეკოსისტემა.",
    accent: "#f1dcff",
    bg1: "#140a30",
    bg2: "#4b2a8c",
    glow: "rgba(176,120,255,.6)",
    tags: ["AI", "ტელეგრამი", "SaaS"],
    url: "#",
  },
  {
    id: "02",
    name: "VELORA",
    type: "ბიუთი ტექნოლოგია",
    description: "ახალი თაობის პლატფორმა ბიუთი ბიზნესისთვის.",
    accent: "#fff1ea",
    bg1: "#3f1233",
    bg2: "#d9728a",
    glow: "rgba(255,196,160,.6)",
    tags: ["პროდუქტი", "დიზაინი", "ტექ"],
    url: "#",
  },
  {
    id: "03",
    name: "EZO",
    type: "უძრავი ქონება",
    description: "ჭკვიანი სისტემა შენობებისა და თემის მართვისთვის.",
    accent: "#c6fff6",
    bg1: "#041419",
    bg2: "#0e5560",
    glow: "rgba(70,217,197,.5)",
    tags: ["SaaS", "ვები", "სისტემები"],
    url: "#",
  },
  {
    id: "04",
    name: "LOGISTICS OS",
    type: "ციფრული სისტემები",
    description: "თანამედროვე ციფრული ლოჯისტიკის გამოცდილება.",
    accent: "#fff2d9",
    bg1: "#2b1004",
    bg2: "#e0691c",
    glow: "rgba(255,196,110,.6)",
    tags: ["ვები", "ავტომატიზაცია"],
    url: "/logistics",
  },
];

type BoxDef = {
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
  c: string;
  kind: "win" | "tape" | "plain";
};

// 3D ყუთები. ზომები უგანზომილებოა: სცენა თავისით მასშტაბირდება ბარათის ზომასთან
// (ცენტრი = სცენის ცენტრი; y დადებითი = ქვემოთ)
const boxes: Record<string, BoxDef[]> = {
  "03": [
    { w: 170, h: 10, d: 150, x: 0, y: 50, z: 0, c: "#1b6a73", kind: "plain" },
    { w: 46, h: 96, d: 46, x: -50, y: -3, z: 16, c: "#46d9c5", kind: "win" },
    { w: 40, h: 62, d: 40, x: 8, y: 14, z: 40, c: "#2fb3a3", kind: "win" },
    { w: 38, h: 126, d: 38, x: 44, y: -18, z: -22, c: "#7ff0df", kind: "win" },
    { w: 30, h: 40, d: 30, x: -42, y: 25, z: -38, c: "#23978f", kind: "win" },
  ],
  "04": [
    { w: 176, h: 8, d: 156, x: 0, y: 44, z: 0, c: "#a8460f", kind: "plain" },
    { w: 66, h: 54, d: 66, x: -32, y: 13, z: 10, c: "#ffe1b3", kind: "tape" },
    { w: 50, h: 40, d: 50, x: 36, y: 20, z: 26, c: "#ffcf8a", kind: "tape" },
    { w: 38, h: 30, d: 38, x: -32, y: -29, z: 10, c: "#fff0d4", kind: "tape" },
    { w: 44, h: 34, d: 44, x: 26, y: 23, z: -36, c: "#ffc274", kind: "tape" },
  ],
};

const services = [
  ["01", "ციფრული პროდუქტები", "ვებ პლატფორმები და აპლიკაციები"],
  ["02", "AI და ავტომატიზაცია", "ჭკვიანი ციფრული გადაწყვეტილებები"],
  ["03", "კრეატიული დეველოპმენტი", "დიზაინი, ტექნოლოგია და რეალიზაცია"],
  ["04", "პროდუქტის სტრატეგია", "იდეიდან რეალურ პროდუქტამდე"],
];

const navItems = [
  { id: "work", label: "პროექტები" },
  { id: "about", label: "შესახებ" },
  { id: "services", label: "სერვისები" },
  { id: "contact", label: "კონტაქტი" },
];

const faces = ["front", "back", "left", "right", "top", "bottom"];

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function Home() {
  const [pulse, setPulse] = useState<string | null>(null);

  // ერთგვერდიან დიზაინში სქროლი არ არის, ამიტომ მენიუ შესაბამის ბლოკს აუნათებს
  const highlight = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setPulse(id);
    window.setTimeout(() => setPulse(null), 1400);
  };

  const pulseClass = (id: string) => (pulse === id ? "pulse" : "");

  return (
    <main className="screen">
      <section className="stage" id="home">
        <div className="orange-bg" />

        {/* ჰედერი */}
        <header className="header">
          <a href="#home" className="brand" onClick={highlight("home")}>
            <span className="brand-symbol">S.</span>
            <span className="brand-label">კრეატიული სტუდია</span>
          </a>

          <nav className="nav" aria-label="მთავარი ნავიგაცია">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={highlight(item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pill">
            <span />
            ღიაა ახალი პროექტებისთვის
          </div>
        </header>

        {/* მარცხენა მხარე */}
        <div className="left">
          <div className="eyebrow">
            <span />
            დამოუკიდებელი კრეატიული დეველოპერი
          </div>

          <h1>შექმენი</h1>

          <p className="hero-description">
            იდეები, რომლებიც შთააგონებს.
            <br />
            ციფრული გამოცდილება, რომელიც აკავშირებს.
          </p>

          <a
            href="#work"
            className="main-button"
            onClick={highlight("work")}
          >
            პროექტების ნახვა <Arrow />
          </a>

          <div className="bottom">
            <div className={`mindset ${pulseClass("about")}`} id="about">
              <h3>არა მხოლოდ იდეები. რაც რეალურად მუშაობს.</h3>
              <p>
                ვეძებ გადაკვეთას ხელოვნურ ინტელექტს, ტექნოლოგიას, დიზაინსა და
                მეწარმეობას შორის და იდეებს ვაქცევ რეალურ ციფრულ პროდუქტებად,
                პლატფორმებად და გამოცდილებად.
              </p>
            </div>

            <div className="stats">
              <div>
                <strong>
                  04<span>+</span>
                </strong>
                <small>ციფრული პროექტი</small>
              </div>
              <div>
                <strong>
                  AI<span>×</span>
                </strong>
                <small>ტექნოლოგია</small>
              </div>
              <div>
                <strong>∞</strong>
                <small>მიმდინარე იდეა</small>
              </div>
            </div>
          </div>

          {/* აბსტრაქტული გრაფიკა */}
          <div className="art" aria-hidden="true">
            <div className="art-circle">
              <div className="art-inner" />
              <div className="art-core">S.</div>
            </div>
            <div className="art-orbit orbit-1" />
            <div className="art-orbit orbit-2" />
            <div className="art-star">✳</div>
          </div>
        </div>

        {/* მარჯვენა მხარე */}
        <div className="right">
          <div className="right-head">
            <h2>არჩეული პროექტები.</h2>
            <p>ციფრული პროდუქტები. ტექნოლოგია. ახალი იდეები.</p>
          </div>

          <div
            className={`projects-grid ${pulseClass("work")}`}
            id="work"
          >
            {projects.map((project) => (
              <Link
                href={project.url || "#"}
                key={project.id}
                className="project-link"
                aria-label={`${project.name} — ${project.type}`}
              >
                {/* სტილები Link-ზე არ ვრცელდება, ამიტომ ბარათი შიდა div-ია */}
                <div
                  className="project-card"
                  style={{
                    color: project.accent,
                    background: `radial-gradient(circle at 72% 30%, ${project.glow}, transparent 60%), linear-gradient(150deg, ${project.bg1}, ${project.bg2})`,
                  }}
                >
                  {/* 3D ბანერი */}
                  <span className="scene" aria-hidden="true">
                    <span className="persp">
                      <span className="floor" />
                      <span className="stage3d">
                        {project.id === "01" && (
                          <>
                            <span className="moon-ring ring-a" />
                            <span className="moon-ring ring-b" />
                            <span className="moon" />
                            <span className="spark sp1">✦</span>
                            <span className="spark sp2">✦</span>
                            <span className="spark sp3">✳</span>
                          </>
                        )}

                        {project.id === "02" && (
                          <>
                            <span className="tile t1" />
                            <span className="tile t2" />
                            <span className="tile t3">V</span>
                            <span className="pearl p1" />
                            <span className="pearl p2" />
                          </>
                        )}

                        {(boxes[project.id] ?? []).map((b, i) => (
                          <span
                            key={i}
                            className={`box ${b.kind}`}
                            style={
                              {
                                "--w": b.w,
                                "--h": b.h,
                                "--d": b.d,
                                "--x": b.x,
                                "--y": b.y,
                                "--z": b.z,
                                "--c": b.c,
                              } as React.CSSProperties
                            }
                          >
                            {faces.map((f) => (
                              <i key={f} className={`face ${f}`} />
                            ))}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>

                  <div className="pc-top">
                    <span className="pc-type">{project.type}</span>
                    <span className="pc-arrow">
                      <Arrow />
                    </span>
                  </div>

                  <div className="pc-bottom">
                    <span className="pc-name">{project.name}</span>
                    <span className="pc-desc">{project.description}</span>
                    <span className="pc-tags">
                      {project.tags.map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div
            className={`services ${pulseClass("services")}`}
            id="services"
          >
            {services.map(([number, title, description]) => (
              <div className="service" key={number}>
                <span className="service-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>

          <div className={`contact ${pulseClass("contact")}`} id="contact">
            <div className="contact-decoration">✳</div>
            <div className="contact-text">
              <h2>გაქვს იდეა?</h2>
              <p>გავხადოთ საინტერესო იდეა რეალობად.</p>
            </div>
            <a href="mailto:hello@example.com" className="contact-button">
              დამიკავშირდი <Arrow />
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html),
        :global(body) {
          height: 100%;
          margin: 0;
          overflow: hidden;
        }

        :global(body) {
          background: #f1f0ed;
          color: #191919;
          font-family: "Noto Sans Georgian", "BPG Nino Mtavruli", Sylfaen,
            "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        }

        :global(a) {
          color: inherit;
          text-decoration: none;
        }

        :global(button) {
          font-family: inherit;
        }

        /* Link კომპონენტზე styled-jsx კლასს ვერ აყენებს, ამიტომ global */
        :global(.project-link) {
          display: block;
          min-width: 0;
          min-height: 0;
          height: 100%;
          border-radius: 14px;
        }

        :global(.project-link:focus-visible) {
          outline: 3px solid #191919;
          outline-offset: 3px;
        }

        /* ===== ეკრანი ===== */

        .screen {
          height: 100vh;
          height: 100dvh;
          width: 100%;
          padding: 7px;
          overflow: hidden;
        }

        .stage {
          position: relative;
          height: 100%;
          display: grid;
          grid-template-columns: 54% 46%;
          grid-template-rows: minmax(0, 1fr);
          border: 4px solid #fa941b;
          border-radius: 17px;
          overflow: hidden;
          isolation: isolate;
          background: #e85b0c;
        }

        .orange-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            radial-gradient(ellipse at 30% 90%, #ffb62e 0%, transparent 38%),
            linear-gradient(115deg, #a52b0a, #e84b0a 45%, #fa8d15);
        }

        .orange-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.09;
          background-image: radial-gradient(white 0.6px, transparent 0.6px);
          background-size: 17px 17px;
        }

        .pulse {
          outline: 2px solid currentColor;
          outline-offset: 6px;
          border-radius: 10px;
        }

        a:focus-visible {
          outline: 2px solid #191919;
          outline-offset: 3px;
        }

        /* ===== ჰედერი ===== */

        .header {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 0;
          right: 0;
          height: clamp(52px, 8vh, 72px);
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 3.5% 0 4.5%;
          pointer-events: none;
        }

        .header > * {
          pointer-events: auto;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }

        .brand-symbol {
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .brand-label {
          font-size: 12px;
          font-weight: 700;
          opacity: 0.9;
        }

        .nav {
          display: flex;
          gap: 24px;
          margin-left: auto;
        }

        .nav a {
          font-size: 12px;
          font-weight: 700;
          color: #555;
        }

        .nav a:hover {
          color: #f47716;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 30px;
          background: #f3f2f0;
          font-size: 11px;
          font-weight: 700;
          color: #666;
          white-space: nowrap;
        }

        .pill span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2fbf71;
        }

        /* ===== მარცხენა მხარე ===== */

        .left {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          padding: clamp(66px, 11vh, 96px) 3.5% 3.5% 4.5%;
          color: #fff;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: clamp(8px, 2vh, 18px);
        }

        .eyebrow span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
        }

        .left h1 {
          font-size: clamp(48px, min(8.6vw, 14vh), 130px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
          margin: 0 0 clamp(8px, 2vh, 20px) -0.03em;
        }

        .hero-description {
          font-size: clamp(13px, 2vh, 16px);
          line-height: 1.55;
          color: #ffffffe6;
          margin: 0 0 clamp(12px, 2.4vh, 22px);
        }

        .main-button {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          background: #fff;
          color: #303030;
          border-radius: 30px;
          padding: 12px 18px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          transition: 0.25s;
        }

        .main-button:hover {
          background: #252525;
          color: #fff;
        }

        .main-button svg,
        .pc-arrow svg,
        .contact-button svg {
          width: 15px;
          height: 15px;
        }

        .bottom {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: clamp(10px, 2.2vh, 20px);
          max-width: 48%;
        }

        .mindset h3 {
          font-size: clamp(15px, 2.6vh, 19px);
          line-height: 1.3;
          margin: 0 0 8px;
        }

        .mindset p {
          font-size: 12px;
          line-height: 1.65;
          color: #ffffffd6;
          margin: 0;
        }

        .stats {
          display: flex;
          gap: 16px;
        }

        .stats > div {
          padding-left: 10px;
          border-left: 1px solid #ffffff4d;
        }

        .stats > div:first-child {
          padding-left: 0;
          border-left: none;
        }

        .stats strong {
          display: block;
          font-size: clamp(18px, 3vh, 24px);
          letter-spacing: -1px;
        }

        .stats strong span {
          color: #ffd08a;
        }

        .stats small {
          display: block;
          margin-top: 3px;
          font-size: 11px;
          color: #ffffffc4;
        }

        /* ===== აბსტრაქტული გრაფიკა ===== */

        .art {
          position: absolute;
          right: 4%;
          bottom: 5%;
          width: min(30vh, 19vw);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .art-circle {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(145deg, #ffbd50, #e85a0b 48%, #54200e);
          box-shadow: 0 25px 80px #9b310c66;
          display: grid;
          place-items: center;
        }

        .art-inner {
          position: absolute;
          inset: 12%;
          border: 1px solid #ffffff73;
          border-radius: 50%;
        }

        .art-core {
          width: 48%;
          height: 48%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #f8a92e, #a53610);
          border: 1px solid #ffffff80;
          box-shadow: inset 0 0 30px #ffffff30;
          font-size: min(7vh, 4.4vw);
          font-weight: 900;
          letter-spacing: -4px;
        }

        .art-orbit {
          position: absolute;
          width: 125%;
          height: 42%;
          border: 1px solid #ffffff8c;
          border-radius: 50%;
          transform: rotate(-35deg);
        }

        .orbit-2 {
          width: 118%;
          height: 58%;
          transform: rotate(35deg);
          border-color: #ffd79ba6;
        }

        .art-star {
          position: absolute;
          top: -4%;
          right: 2%;
          font-size: 34px;
          color: #ffb52d;
        }

        /* ===== მარჯვენა მხარე ===== */

        .right {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          gap: clamp(8px, 1.8vh, 16px);
          padding: clamp(60px, 10vh, 82px) 3% 2.4% 3%;
          background: #fff;
          border-radius: 18px 0 0 18px;
          color: #191919;
        }

        .right-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
        }

        .right-head h2 {
          margin: 0;
          font-size: clamp(20px, 3.4vh, 28px);
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .right-head p {
          margin: 0;
          font-size: 12px;
          color: #888;
        }

        /* ===== პროექტების ბანერები ===== */

        .projects-grid {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .project-card {
          position: relative;
          height: 100%;
          overflow: hidden;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
          border-radius: 14px;
          box-shadow:
            inset 0 1px 0 #ffffff33,
            0 1px 2px #0002;
          transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        }

        /* წერტილოვანი ფაქტურა */
        .project-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(#ffffff2e 1px, transparent 1.3px);
          background-size: 16px 16px;
          -webkit-mask-image: linear-gradient(135deg, #000, transparent 65%);
          mask-image: linear-gradient(135deg, #000, transparent 65%);
          pointer-events: none;
        }

        /* ტექსტის წაკითხვადობისთვის ქვედა ჩრდილი */
        .project-card::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 58%;
          z-index: 0;
          background: linear-gradient(to top, #000000a6, transparent);
          pointer-events: none;
        }

        .project-card:hover {
          transform: translateY(-3px);
          box-shadow:
            inset 0 1px 0 #ffffff4d,
            0 16px 30px #0000004d;
        }

        /* --- 3D სცენა: ზომა ბარათის ზომას მიყვება (cqmin) --- */

        .scene {
          position: absolute;
          top: 4%;
          right: 0;
          width: 66%;
          height: 74%;
          container-type: size;
          z-index: 1;
          pointer-events: none;
        }

        .persp {
          position: absolute;
          inset: 0;
          perspective: 420cqmin;
          perspective-origin: 50% 38%;
        }

        .floor {
          position: absolute;
          left: 50%;
          top: 78%;
          width: 68%;
          height: 11%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse, #00000080, transparent 70%);
          filter: blur(3px);
        }

        .stage3d {
          --u: 0.38cqmin;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          transform-style: preserve-3d;
          transform: rotateX(-20deg) rotateY(-30deg);
          animation: sway 9s ease-in-out infinite alternate;
        }

        .project-card:hover .stage3d {
          animation-duration: 4.5s;
        }

        @keyframes sway {
          from {
            transform: rotateX(-22deg) rotateY(-46deg);
          }
          to {
            transform: rotateX(-17deg) rotateY(-6deg);
          }
        }

        @keyframes bob {
          from {
            transform: translateY(-6%);
          }
          to {
            transform: translateY(6%);
          }
        }

        /* --- ყუთი (EZO / LOGISTICS OS) --- */

        .box {
          --W: calc(var(--w) * var(--u));
          --H: calc(var(--h) * var(--u));
          --D: calc(var(--d) * var(--u));
          position: absolute;
          width: var(--W);
          height: var(--H);
          left: calc(var(--W) / -2);
          top: calc(var(--H) / -2);
          transform-style: preserve-3d;
          transform: translate3d(
            calc(var(--x) * var(--u)),
            calc(var(--y) * var(--u)),
            calc(var(--z) * var(--u))
          );
        }

        .face {
          position: absolute;
          display: block;
          background-color: var(--c);
          background-image: linear-gradient(
            155deg,
            #ffffff4d,
            #ffffff00 60%
          );
          box-shadow: inset 0 0 0 1px #ffffff40;
        }

        .face.front,
        .face.back {
          width: var(--W);
          height: var(--H);
          left: 0;
          top: 0;
        }

        .face.front {
          transform: translateZ(calc(var(--D) / 2));
        }

        .face.back {
          transform: rotateY(180deg) translateZ(calc(var(--D) / 2));
          filter: brightness(0.6);
        }

        .face.left,
        .face.right {
          width: var(--D);
          height: var(--H);
          left: calc(var(--W) / 2 - var(--D) / 2);
          top: 0;
        }

        .face.right {
          transform: rotateY(90deg) translateZ(calc(var(--W) / 2));
          filter: brightness(0.72);
        }

        .face.left {
          transform: rotateY(-90deg) translateZ(calc(var(--W) / 2));
          filter: brightness(0.6);
        }

        .face.top,
        .face.bottom {
          width: var(--W);
          height: var(--D);
          left: 0;
          top: calc(var(--H) / 2 - var(--D) / 2);
        }

        .face.top {
          transform: rotateX(90deg) translateZ(calc(var(--H) / 2));
          filter: brightness(1.2);
        }

        .face.bottom {
          transform: rotateX(-90deg) translateZ(calc(var(--H) / 2));
          filter: brightness(0.5);
        }

        /* შენობის ფანჯრები */
        .box.win .face.front,
        .box.win .face.back,
        .box.win .face.left,
        .box.win .face.right {
          background-image:
            linear-gradient(155deg, #ffffff4d, #ffffff00 60%),
            repeating-linear-gradient(
              0deg,
              transparent 0 calc(9 * var(--u)),
              #ffffff47 calc(9 * var(--u)) calc(11 * var(--u))
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0 calc(11 * var(--u)),
              #00000026 calc(11 * var(--u)) calc(13 * var(--u))
            );
        }

        /* ყუთზე წებოვანი ლენტი */
        .box.tape .face {
          background-image:
            linear-gradient(155deg, #ffffff4d, #ffffff00 60%),
            linear-gradient(
              90deg,
              transparent 40%,
              #e8752ad9 40% 60%,
              transparent 60%
            );
        }

        /* --- LUNARA: მთვარე ბეჭდებით --- */

        .moon {
          --s: calc(92 * var(--u));
          position: absolute;
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          border-radius: 50%;
          background:
            radial-gradient(circle at 62% 66%, #00000038 0 calc(8 * var(--u)), transparent calc(9 * var(--u))),
            radial-gradient(circle at 36% 62%, #0000002b 0 calc(5 * var(--u)), transparent calc(6 * var(--u))),
            radial-gradient(circle at 58% 34%, #00000024 0 calc(4 * var(--u)), transparent calc(5 * var(--u))),
            radial-gradient(circle at 30% 28%, #fbeaff, #b47cff 42%, #4a2a8a 78%, #20103f);
          box-shadow:
            0 0 calc(40 * var(--u)) #b47cffa6,
            inset calc(-8 * var(--u)) calc(-10 * var(--u)) calc(22 * var(--u)) #0000008c;
          animation: bob 5s ease-in-out infinite alternate;
        }

        .moon-ring {
          position: absolute;
          border-radius: 50%;
          border-style: solid;
        }

        .ring-a {
          --s: calc(176 * var(--u));
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          border-width: calc(6 * var(--u));
          border-color: #e6c4ffd9;
          transform: rotateX(76deg) rotateY(-10deg);
          box-shadow: 0 0 calc(18 * var(--u)) #c490ff99;
        }

        .ring-b {
          --s: calc(216 * var(--u));
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          border-width: calc(2 * var(--u));
          border-color: #ffffff80;
          transform: rotateX(76deg) rotateY(-10deg);
        }

        .spark {
          position: absolute;
          color: #fff;
          text-shadow: 0 0 8px #d8b4ff;
          line-height: 1;
        }

        .sp1 {
          font-size: calc(26 * var(--u));
          transform: translate3d(calc(-84 * var(--u)), calc(-66 * var(--u)), calc(50 * var(--u)));
        }

        .sp2 {
          font-size: calc(20 * var(--u));
          transform: translate3d(calc(74 * var(--u)), calc(46 * var(--u)), calc(-30 * var(--u)));
        }

        .sp3 {
          font-size: calc(32 * var(--u));
          color: #ffd08a;
          transform: translate3d(calc(62 * var(--u)), calc(-72 * var(--u)), calc(70 * var(--u)));
        }

        /* --- VELORA: მინის ფირფიტები და მარგალიტი --- */

        .tile {
          --s: calc(104 * var(--u));
          position: absolute;
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          border-radius: calc(24 * var(--u));
          display: grid;
          place-items: center;
          font-size: calc(48 * var(--u));
          font-weight: 900;
          box-shadow:
            inset 0 0 0 1px #ffffff80,
            inset calc(8 * var(--u)) calc(8 * var(--u)) calc(20 * var(--u)) #ffffff4d,
            0 calc(10 * var(--u)) calc(30 * var(--u)) #3f123366;
        }

        .t1 {
          background: linear-gradient(145deg, #ffe9da, #f3a98f);
          transform: translate3d(calc(-34 * var(--u)), calc(14 * var(--u)), calc(-60 * var(--u))) rotateZ(-10deg);
          opacity: 0.8;
        }

        .t2 {
          background: linear-gradient(145deg, #ffd1c2, #d9728a);
          transform: translate3d(calc(-12 * var(--u)), calc(4 * var(--u)), calc(-18 * var(--u))) rotateZ(-4deg);
          opacity: 0.92;
        }

        .t3 {
          background: linear-gradient(145deg, #fff7f0, #f6c9b0);
          color: #8f3f55;
          transform: translate3d(calc(10 * var(--u)), calc(-6 * var(--u)), calc(28 * var(--u))) rotateZ(3deg);
        }

        .pearl {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 30%, #fff, #ffe3d4 45%, #d9967c 100%);
          box-shadow:
            0 calc(8 * var(--u)) calc(18 * var(--u)) #3f123380,
            inset calc(-4 * var(--u)) calc(-5 * var(--u)) calc(10 * var(--u)) #b8654c88;
        }

        .p1 {
          --s: calc(44 * var(--u));
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          translate: calc(56 * var(--u)) calc(-44 * var(--u)) calc(76 * var(--u));
          animation: bob 4s ease-in-out infinite alternate;
        }

        .p2 {
          --s: calc(22 * var(--u));
          width: var(--s);
          height: var(--s);
          left: calc(var(--s) / -2);
          top: calc(var(--s) / -2);
          translate: calc(-70 * var(--u)) calc(52 * var(--u)) calc(60 * var(--u));
          animation: bob 3.2s ease-in-out infinite alternate-reverse;
        }

        /* ===== ბარათის ტექსტი ===== */

        .pc-top,
        .pc-bottom {
          position: relative;
          z-index: 2;
        }

        .pc-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .pc-type {
          display: inline-block;
          max-width: calc(100% - 38px);
          padding: 4px 10px;
          border-radius: 20px;
          background: #ffffff1f;
          border: 1px solid #ffffff38;
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pc-arrow {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ffffff1f;
          border: 1px solid #ffffff4d;
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          transition:
            background 0.25s,
            color 0.25s,
            transform 0.25s;
        }

        .project-card:hover .pc-arrow {
          background: #fff;
          color: #191919;
          transform: translate(2px, -2px);
        }

        .pc-name {
          display: block;
          font-size: clamp(19px, 3vh, 26px);
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1.05;
          color: #fff;
          text-shadow: 0 2px 12px #0006;
        }

        .pc-desc {
          display: block;
          max-width: 92%;
          max-height: 0;
          margin-top: 0;
          overflow: hidden;
          opacity: 0;
          font-size: 12px;
          line-height: 1.45;
          transition:
            max-height 0.3s ease,
            opacity 0.3s ease,
            margin 0.3s ease;
        }

        .project-card:hover .pc-desc {
          max-height: 56px;
          margin-top: 5px;
          opacity: 0.95;
        }

        .pc-tags {
          display: none;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 8px;
        }

        .pc-tags i {
          font-style: normal;
          padding: 2px 9px;
          border-radius: 20px;
          background: #ffffff1f;
          border: 1px solid #ffffff38;
          font-size: 10px;
        }

        /* მაღალ ეკრანებზე აღწერა და თეგები ყოველთვის ჩანს */
        @media (min-width: 861px) and (min-height: 860px) {
          .pc-desc {
            max-height: 56px;
            margin-top: 5px;
            opacity: 0.95;
          }

          .pc-tags {
            display: flex;
          }
        }

        /* ===== სერვისები ===== */

        .services {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 18px;
        }

        .service {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 10px;
          align-items: baseline;
          padding: 8px 0;
          border-top: 1px solid #e4e0d9;
        }

        .service-number {
          color: #ed792c;
          font-size: 11px;
          font-weight: 800;
        }

        .service h3 {
          margin: 0;
          font-size: 13px;
        }

        .service p {
          grid-column: 2;
          margin: 2px 0 0;
          font-size: 11px;
          color: #888;
        }

        /* ===== კონტაქტი ===== */

        .contact {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: clamp(12px, 2.2vh, 20px) 20px;
          border-radius: 12px;
          background: linear-gradient(115deg, #a9360c, #f47b18);
          color: #fff;
        }

        .contact-decoration {
          position: absolute;
          right: 20%;
          top: -60px;
          font-size: 170px;
          line-height: 1;
          color: #ffffff14;
          pointer-events: none;
        }

        .contact-text {
          position: relative;
          min-width: 0;
        }

        .contact h2 {
          margin: 0;
          font-size: clamp(20px, 3.4vh, 28px);
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .contact p {
          margin: 6px 0 0;
          font-size: 12px;
          color: #ffffffd9;
        }

        .contact-button {
          position: relative;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 30px;
          background: #fff;
          color: #252525;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          transition: 0.25s;
        }

        .contact-button:hover {
          background: #252525;
          color: #fff;
        }

        /* ===== რესპონსივი ===== */

        @media (max-width: 1180px) {
          .pill {
            display: none;
          }
        }

        @media (max-width: 1000px) {
          .right-head p {
            display: none;
          }

          .bottom {
            max-width: 55%;
          }
        }

        /* დაბალი ეკრანები (დესკტოპი) */
        @media (min-width: 861px) and (max-height: 760px) {
          .mindset p,
          .service p {
            display: none;
          }
        }

        @media (min-width: 861px) and (max-height: 640px) {
          .stats {
            display: none;
          }

          .art {
            width: min(22vh, 15vw);
          }
        }

        /* პლანშეტი და ტელეფონი: ერთი სვეტი, სქროლის გარეშე */
        @media (max-width: 860px) {
          .stage {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto minmax(0, 1fr);
            border-width: 3px;
          }

          .nav,
          .pill,
          .bottom,
          .art,
          .right-head p,
          .pc-desc,
          .pc-tags,
          .service p,
          .contact p,
          .contact-decoration {
            display: none;
          }

          .header {
            padding: 0 6%;
          }

          .left {
            padding: 58px 6% 16px;
          }

          .left h1 {
            font-size: clamp(48px, min(17vw, 10vh), 96px);
          }

          .hero-description {
            font-size: 13px;
            margin-bottom: 12px;
          }

          .main-button {
            padding: 10px 16px;
          }

          .right {
            padding: 14px 5% 12px;
            border-radius: 16px 16px 0 0;
            gap: 8px;
          }

          .right-head h2 {
            font-size: 18px;
          }

          .project-card {
            padding: 9px;
          }

          .pc-type {
            font-size: 10px;
            padding: 3px 8px;
          }

          .pc-arrow {
            width: 24px;
            height: 24px;
          }

          .pc-arrow svg {
            width: 12px;
            height: 12px;
          }

          .pc-name {
            font-size: 16px;
          }

          .services {
            column-gap: 12px;
          }

          .service {
            padding: 5px 0;
          }

          .service h3 {
            font-size: 12px;
          }

          .contact {
            padding: 12px 14px;
          }

          .contact h2 {
            font-size: 18px;
          }

          .contact-button {
            padding: 10px 12px;
            font-size: 11px;
            gap: 8px;
          }
        }

        @media (max-width: 860px) and (max-height: 640px) {
          .eyebrow,
          .hero-description {
            display: none;
          }

          .left h1 {
            font-size: 48px;
            margin-bottom: 10px;
          }
        }

        @media (max-width: 380px) {
          .brand-label {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}