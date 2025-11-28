import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

export default function Portfolio() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center">

      {/* Background Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-52 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[140px]"
          style={{ background: "rgba(255,255,255,0.25)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full opacity-10 blur-[140px]"
          style={{ background: "rgba(255,255,255,0.18)" }}
        />
      </div>

      {/* Mouse Glow */}
      <div
        className="fixed w-[420px] h-[420px] rounded-full pointer-events-none z-10 transition-all duration-500 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 210,
          top: mousePosition.y - 210,
        }}
      />

      {/* Main Content */}
      <div className="text-center max-w-4xl px-6 relative z-20">

        {/* Circular Initials Logo */}
        <div className="mb-14 relative inline-block group">
          <div className="relative">
            {/* Decorative rings */}
            <div className="absolute -inset-4 rounded-full border border-white/20 group-hover:border-white/40 transition-all duration-500"></div>
            <div className="absolute -inset-8 rounded-full border border-white/10 group-hover:border-white/20 transition-all duration-500"></div>

            {/* "AY" Circle */}
            <div className="w-40 h-40 rounded-full bg-white/5 border border-white/20 backdrop-blur-md 
                            flex items-center justify-center text-5xl font-light tracking-widest
                            group-hover:bg-white/10 transition-all duration-300">
              AY
            </div>
          </div>
        </div>

        {/* Name */}
        <h1 className="text-6xl md:text-8xl font-light mb-8 tracking-widest text-white/90">
          AYUSH YADAV
        </h1>

        {/* Tagline */}
        <p className="mb-14 text-gray-400 font-light max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
          Learning new things in entrepreneurship, leadership, and psychology.  
          I read a chapter daily and write private blog entries—some may be shared in the future.
        </p>

        {/* Buttons */}
        <div className="flex gap-6 justify-center flex-wrap mb-16">
          <a
            href="mailto:ayush@mentallyprepare.in"
            className="px-8 py-3 border border-white/30 hover:border-white hover:bg-white/10
                       transition-all duration-300 flex items-center gap-2 text-sm tracking-wider">
            <Mail size={18} />
            <span>CONTACT</span>
          </a>

          <a
            href="https://www.mentallyprepare.in"
            target="_blank"
            className="px-8 py-3 bg-white text-black hover:bg-gray-200
                       transition-all duration-300 flex items-center gap-2 text-sm tracking-wider">
            <ExternalLink size={18} />
            <span>WORK</span>
          </a>
        </div>

        {/* Social Links */}
        <div className="flex gap-6 justify-center items-center mb-10">
          {[
            { icon: <Linkedin size={20} />, link: "https://linkedin.com/in/ayushyadav" },
            { icon: <Github size={20} />, link: "https://github.com/ayushprv" }
          ].map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center
                         hover:border-white hover:bg-white/10 transition-all duration-300">
              {item.icon}
            </a>
          ))}
        </div>

        {/* Footer */}
        <p className="text-gray-700 text-sm tracking-wider">
          © 2026 AYUSH YADAV
        </p>
      </div>
    </div>
  );
}
