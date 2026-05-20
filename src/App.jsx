import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowDown, Mail, Linkedin, Facebook, Globe, Star, Sparkles, Zap } from 'lucide-react';

// --- THEME CONFIGURATION ---
const THEME = {
  black: '#1a1a1a', 
  white: '#F5F5F0', 
  accent: '#FF3333', 
};

// --- DATA ---
const PORTFOLIO_DATA = {
  profile: {
    name: "Tran Vu Anh Duy",
    role: "Multimedia Designer",
    email: "anhduy25work@gmail.com",
    phone: "0822 021 418",
    facebook: "https://www.facebook.com/tvad.25"
  },
  intro: {
    line1: "PORTFOLIO", 
    line2: "2026",      
    sub: "Bridging the gap between functional UI and cinematic storytelling."
  },
  projects: [
    {
      id: "01",
      title: "EDURA LMS",
      subtitle: "LMS",
      category: "Product Design",
      description: "A learning platform designed to combat user fatigue through strict visual hierarchy and seamless user journeys. Rated 'Excellent' for UX innovation.",
      tags: ["UX Research", "UI Design", "Prototyping"],
      imageUrl: "/project1.jpg",
      link: "https://www.behance.net/gallery/241524417/Edura-LMS"
    },
    {
      id: "02",
      title: "VERIS APP",
      subtitle: "SOCIAL",
      category: "UX/UI Design",
      description: "A next-generation social networking prioritizing user privacy and emotion. Redefined the feed algorithm interface for clarity.",
      tags: ["Mobile App", "User Interface", "Interaction"],
      imageUrl: "/project2.jpg"
    },
    {
      id: "03",
      title: "VIE PERFUME",
      subtitle: "BRAND",
      category: "Graphic Design",
      description: "Comprehensive brand identity for a luxury fragrance line. The visual language captures the essence of olfactory elegance through minimalist typography and packaging.",
      tags: ["Branding", "Packaging", "Visual Identity"],
      imageUrl: "/project3.jpg"
    }
  ],
  skills: [
    "Design Thinking", "AI-Assisted Design", "Motion Graphics", "Project Management",
    "Time Management", "Adaptability", "Teamwork", "Attention to Detail"
  ],
  experience: [
    {
      company: "HOSANA MEDIA",
      role: "Multimedia Executive",
      year: "Sep 2024 — Feb 2025", 
      type: "Full-time",
      details: "Produced high-impact marketing assets (packaging, banners). Managed end-to-end filming and editing for TVCs & MVs. Collaborated on content strategy."
    },
    {
      company: "UPWORK",
      role: "Multimedia Creator",
      year: "2024 — Present", 
      type: "Freelance",
      details: "Created and optimized video content for cross-platform growth. Filmed and edited professional promotional videos. Provided comprehensive UI/Visual design services."
    },
    {
      company: "DESIGNVELOPER",
      role: "UX/UI Designer Intern",
      year: "Sep 2025 — Dec 2025", 
      type: "Internship",
      details: "Conducted UX research via surveys. Designed brand-consistent UI, optimizing layout and typography. Collaborated with Developers for accurate design handoff."
    }
  ],
  education: [
    { 
      school: "Saigon University", 
      degree: "Bachelor's Degree in Information Technology",
      year: "2021 — 2026",
      details: "Performance: Graduated with Good Tier. Key Focus: System Analyze and Design, Human-Computer Interaction (HCI), Usability Testing, and Web/App Prototyping."
    },
    { 
      school: "Arena Multimedia", 
      degree: "Advanced Diploma in Multimedia",
      year: "2024 — Present",
      details: "Performance: Achieved Distinction Tier in Semester 2 (UX/UI Design for Web & App). Key Focus: User-centric design principles, mobile app prototyping, wireframing, and responsive web interfaces."
    },
    { 
      school: "Green Academy", 
      degree: "Certificate in Professional Video Editing",
      year: "2022 — 2023",
      details: "Graduation Grade: Distinction. Key Focus: Visual effects compositing, and motion graphics for digital media. Recognized as a top-performing student with strong aptitude in Adobe Premiere & After Effects."
    }
  ]
};

// --- ANIMATION VARIANTS (SCROLL EFFECTS) ---
const SECTION_ANIMATIONS = {
  profile: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  },
  education: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
  },
  work: {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } }
  },
  footer: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1, delay: 0.2 } }
  }
};

// --- COMPONENTS ---

// 1. ARCANE RUNES INTRO (FIXED: NO FREEZING)
const RuneGlitchIntro = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [runeText, setRuneText] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [triggerGlitch, setTriggerGlitch] = useState(false);

  const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ∆∑∏ΩΨΦΞ";

  // EFFECT 1: Counter Progress (Chạy 0-100%)
  useEffect(() => {
    // Tổng thời gian chạy số: khoảng 3.5 giây
    const counterDuration = 3500; 
    const intervalTime = counterDuration / 100;

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // EFFECT 2: Runes Animation (Chữ chạy loạn xạ)
  useEffect(() => {
    // Nếu đã hiện chữ Welcome thì dừng chạy runes
    if (showWelcome) return; 

    const runeInterval = setInterval(() => {
      let randomRunes = "";
      for (let i = 0; i < 6; i++) {
        randomRunes += RUNES[Math.floor(Math.random() * RUNES.length)];
      }
      setRuneText(randomRunes);
    }, 60); 

    return () => clearInterval(runeInterval);
  }, [showWelcome]); 

  // EFFECT 3: Trigger Welcome (Khi đếm xong)
  useEffect(() => {
    if (count === 100) {
      setShowWelcome(true);
    }
  }, [count]);

  // EFFECT 4: Exit Sequence (Khi Welcome hiện ra -> Glitch -> Thoát)
  // Tách riêng Effect này để đảm bảo không bị hủy ngang chừng
  useEffect(() => {
    if (showWelcome) {
      const sequence = async () => {
        // 1. Giữ chữ WELCOME đứng yên khoảng 1 giây cho người xem đọc
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. Kích hoạt hiệu ứng Glitch
        setTriggerGlitch(true);
        
        // 3. Glitch trong 0.6 giây
        await new Promise(resolve => setTimeout(resolve, 600));

        // 4. Gọi hàm kết thúc để vào web chính
        onComplete();
      };

      sequence();
    }
  }, [showWelcome, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.5 } }} 
    >
      <style>{`
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 1px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(1px, -1px); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, -1px); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
          40% { clip-path: inset(30% 0 20% 0); transform: translate(2px, 1px); }
          60% { clip-path: inset(10% 0 80% 0); transform: translate(-1px, -2px); }
          80% { clip-path: inset(50% 0 30% 0); transform: translate(1px, 2px); }
          100% { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 1px); }
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0a0a0a;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 #ff00c1;
          clip-path: inset(0);
          animation: glitch-anim-1 0.3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: -1px 0 #00fff9;
          clip-path: inset(0);
          animation: glitch-anim-2 0.3s infinite linear alternate-reverse;
        }
      `}</style>

      {/* BACKGROUND: COUNTER (Low Opacity, Blur) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-syne font-black text-[30vw] text-white opacity-10 blur-sm tabular-nums tracking-tighter">
          {count}%
        </span>
      </div>

      {/* FOREGROUND: RUNES & WELCOME */}
      <div className="relative z-10 text-center">
         {!showWelcome ? (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="font-mono text-[#FF3333] text-4xl md:text-6xl tracking-[1em] font-bold min-h-[60px]"
            >
               {runeText}
            </motion.div>
         ) : (
            <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className={`font-syne font-black text-6xl md:text-9xl text-white uppercase tracking-tighter ${triggerGlitch ? 'glitch-text' : ''}`}
               data-text="WELCOME"
            >
               WELCOME
            </motion.div>
         )}
      </div>

      <div className="absolute bottom-10 w-full px-12">
        <div className="w-full h-[1px] bg-white/10 overflow-hidden">
           <motion.div 
             className="h-full bg-[#FF3333]" 
             style={{ width: `${count}%` }}
           />
        </div>
      </div>
    </motion.div>
  );
};

const Marquee = ({ text, speed = 20, direction = 1, className = "bg-white border-y border-black" }) => (
  <div className={`overflow-hidden whitespace-nowrap py-2 ${className}`}> 
    <motion.div 
      className="inline-block"
      animate={{ x: direction === 1 ? [0, -1000] : [-1000, 0] }}
      transition={{ ease: "linear", duration: speed, repeat: Infinity }}
    >
      {[...Array(8)].map((_, i) => (
        <span key={i} className="text-2xl md:text-4xl font-bold font-syne uppercase mx-6 text-black opacity-80">
          {text} <span className="text-[#FF3333] mx-3">•</span>
        </span>
      ))}
    </motion.div>
  </div>
);

const EasterEgg = () => {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleClick = () => {
    setActive(!active);
    const newParticles = [...Array(5)].map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 50,
      y: (Math.random() - 0.5) * 50,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  return (
    <div className="absolute top-24 right-12 z-50 hidden md:block">
      <div className="relative">
        <motion.div
          className="cursor-pointer relative w-24 h-24 flex items-center justify-center"
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            className="absolute inset-0 border border-black/20 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border border-dashed border-[#FF3333]/50 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className={`w-12 h-12 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${active ? 'bg-[#FF3333]' : ''}`}
            animate={active ? {
              y: [0, -15, 0],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
             {active ? <Zap size={24} className="fill-white" /> : <Star size={24} />}
          </motion.div>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 1, x: p.x, y: p.y }}
              transition={{ duration: 0.8 }}
              className="absolute w-2 h-2 bg-[#FF3333] rounded-full pointer-events-none"
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: 20 }}
          animate={{ 
            opacity: active ? 1 : 0,
            scale: active ? 1 : 0.5,
            x: active ? 0 : 20,
            rotate: active ? [0, -5, 5, 0] : 0
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute top-8 right-24 bg-white border border-black px-4 py-2 rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] whitespace-nowrap origin-right pointer-events-none"
        >
          <span className="font-mono text-xs font-bold text-black flex items-center gap-2">
            Let's create magic! <Sparkles size={12} className="text-[#FF3333] animate-pulse"/>
          </span>
          <div className="absolute top-1/2 -right-2 w-3 h-3 bg-white border-t border-r border-black transform rotate-45 -translate-y-1/2"></div>
        </motion.div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  return (
    <a 
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full border-t border-white/20 min-h-[80vh] flex flex-col justify-center hover:bg-white/5 transition-colors duration-500 cursor-pointer overflow-hidden"
    >
      <div className="px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center relative z-20 w-full">
        <div className="mb-8 md:mb-0">
           <span className="font-mono text-xs text-[#FF3333] mb-2 block tracking-widest">
             {project.id} / {project.category.toUpperCase()}
           </span>
           <h3 className="text-6xl md:text-8xl font-syne font-bold uppercase leading-[0.8] group-hover:translate-x-4 transition-transform duration-500 text-white">
             {project.title.split(' ')[0]} <br/>
             <span className="text-transparent stroke-text-white">{project.subtitle}</span>
           </h3>
        </div>
        
        <div className="max-w-md md:text-right">
           <p className="font-sans text-lg text-gray-400 mb-6 group-hover:text-white transition-colors line-clamp-3">
             {project.description}
           </p>
           <div className="flex flex-wrap gap-2 md:justify-end">
             {project.tags.map(tag => (
               <span key={tag} className="border border-white/30 px-3 py-1 text-xs font-mono uppercase bg-transparent text-gray-400 group-hover:border-white group-hover:text-white transition-all">
                 {tag}
               </span>
             ))}
           </div>
        </div>
      </div>

      <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
         <img 
            src={project.imageUrl} 
            alt={project.title}
            className="w-full h-full object-cover opacity-40 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000"
         />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
    </a>
  );
};

export default function GraphicDesignPortfolio() {
  const [loading, setLoading] = useState(true);
  const { scrollYProgress } = useScroll();
  const yHeroBg = useTransform(scrollYProgress, [0, 1], [0, 200]);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [loading]);

  return (
    <div className="bg-[#F5F5F0] text-[#1a1a1a] min-h-screen selection:bg-[#FF3333] selection:text-white font-sans overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .font-syne { font-family: 'Space Grotesk', sans-serif; }
        .font-sans { font-family: 'Manrope', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .stroke-text {
          -webkit-text-stroke: 1px #1a1a1a;
          color: transparent;
        }
        
        .stroke-text-white {
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.8);
          color: transparent;
        }
        
        .group:hover .stroke-text {
           -webkit-text-stroke: 1px #FF3333;
           color: transparent;
        }
        
        .stroke-text-bg {
           -webkit-text-stroke: 2px rgba(26, 26, 26, 0.3); 
           color: transparent;
           fill: transparent;
           transition: -webkit-text-stroke 0.6s ease;
        }
        
        .hero-section:hover .stroke-text-bg {
           -webkit-text-stroke: 2px rgba(255, 51, 51, 0.6); 
        }

        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #F5F5F0; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>

      {/* --- INTRO OVERLAY --- */}
      <AnimatePresence>
        {loading && <RuneGlitchIntro onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <nav className="fixed w-full px-6 py-6 flex justify-between items-center z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-black/10">
        <div className="font-syne font-bold text-xl uppercase tracking-tighter flex items-center gap-2">
          <div className="w-4 h-4 bg-[#FF3333] rounded-full animate-pulse"></div>
          JUE.STUDIO
        </div>
        <div className="flex gap-6 text-xs font-mono uppercase">
          <a href="#about" className="hover:underline decoration-[#FF3333] underline-offset-4">Profile</a>
          <a href="#work" className="hover:underline decoration-[#FF3333] underline-offset-4">Work</a>
          <a href="#contact" className="hover:underline decoration-[#FF3333] underline-offset-4">Contact</a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-20 relative overflow-hidden hero-section cursor-default bg-[#F5F5F0]">
        
        <EasterEgg />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
           <motion.h1 
             style={{ y: yHeroBg }} 
             className="font-syne font-bold text-[35vw] leading-none tracking-tighter stroke-text-bg select-none"
           >
             2026
           </motion.h1>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ y: 100, opacity: 0 }}
            animate={!loading ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="font-syne font-extrabold text-[15vw] leading-[0.8] tracking-tighter text-black mix-blend-darken"
          >
            {PORTFOLIO_DATA.intro.line1}
          </motion.h1>
          
          <div className="flex flex-col md:flex-row items-start md:items-end mt-4">
             <div className="md:ml-2">
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={!loading ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 1, delay: 1 }}
                  className="font-mono text-sm text-[#FF3333] mb-2 uppercase tracking-widest"
                >
                  Multimedia Executive
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={!loading ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 1, delay: 1.1 }}
                  className="max-w-md font-sans text-xl font-medium border-l-4 border-black pl-6 text-gray-800 leading-relaxed"
                >
                  {PORTFOLIO_DATA.intro.sub}
                </motion.p>
             </div>
          </div>
        </div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={!loading ? { opacity: 1 } : {}}
           transition={{ delay: 1.5, duration: 1 }}
           className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 font-mono text-xs border-t border-black pt-6 relative z-10"
        >
           <div>
             <span className="text-gray-500 block mb-1">Location</span>
             Vietnam
           </div>
           <div>
             <span className="text-gray-500 block mb-1">Role</span>
             Multimedia Designer
           </div>
           <div>
             <span className="text-gray-500 block mb-1">Status</span>
             Available for hire
           </div>
           <div className="flex justify-end">
             <ArrowDown className="animate-bounce" />
           </div>
        </motion.div>
      </section>

      {/* --- MARQUEE 1: HERO -> PROFILE --- */}
      <Marquee text="Design • Strategy • Motion • UI/UX" />

      {/* --- PROFILE / THE CREATOR (WITH SCROLL ANIMATION: SLIDE LEFT) --- */}
      <motion.section 
        id="about" 
        className="py-24 px-6 md:px-12 bg-[#1a1a1a] text-[#F5F5F0] relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={SECTION_ANIMATIONS.profile}
      >
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5 select-none flex items-center justify-center">
          <span className="font-syne font-black text-[13vw] leading-none text-white whitespace-nowrap">
            THE CREATOR
          </span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
            
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start sticky top-24">
              <div className="relative w-full max-w-md aspect-[3/4] group">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-[#FF3333]/20 rounded-full animate-[spin_10s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-dashed border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                  
                  <div className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700 relative overflow-visible">
                    <img 
                      src="/avatar.png" 
                      alt="Tran Vu Anh Duy"
                      className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-12">
              <div className="border-l-4 border-[#FF3333] pl-6 md:pl-10 py-2">
                <motion.h2 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="font-syne text-5xl md:text-7xl font-bold uppercase leading-[0.9] mb-2"
                >
                  Trần Vũ <br/> <span className="text-transparent stroke-text-white">Anh Duy</span>
                </motion.h2>
                <p className="font-mono text-[#FF3333] text-sm tracking-[0.2em] uppercase mt-4">
                  Multimedia Executive & UX/UI Designer
                </p>
              </div>

              <p className="font-sans text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
                <span className="text-white font-bold">Design is not just about visuals, it's about solving problems.</span> I focus on creating seamless user journeys that blend UX logic with UI aesthetics to deliver tangible business value. My goal is to bridge the gap between functional interfaces and cinematic storytelling.
              </p>

              <div className="space-y-8">
                 <div>
                    <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">Software Arsenal</h4>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { name: "Photoshop", src: "/icons/ps.png" },
                        { name: "Illustrator", src: "/icons/ai.png" },
                        { name: "After Effects", src: "/icons/ae.png" },
                        { name: "Davinci Resolve", src: "/icons/pr.png" },
                        { name: "Figma", src: "/icons/figma.png" },
                      ].map((tool) => (
                        <div key={tool.name} className="group/icon relative w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 rounded-xl p-2 hover:border-[#FF3333] transition-colors cursor-pointer">
                          <img src={tool.src} alt={tool.name} className="w-full h-full object-contain opacity-70 group-hover/icon:opacity-100 transition-opacity" />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#FF3333] text-white text-[10px] font-mono px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {tool.name}
                          </div>
                        </div>
                      ))}
                      <div className="h-12 md:h-14 flex items-center px-4 border border-white/20 rounded-xl text-xs font-mono text-gray-400 hover:text-white hover:border-[#FF3333] transition-colors cursor-default">
                        + Generative AI Tools
                      </div>
                    </div>
                 </div>

                 <div>
                    <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">Core Competencies</h4>
                    <div className="flex flex-wrap gap-2">
                      {PORTFOLIO_DATA.skills.map((skill, idx) => (
                         <span key={idx} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-sans text-gray-300 hover:border-[#FF3333] hover:bg-[#FF3333]/10 transition-colors cursor-default">
                            {skill}
                         </span>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-white/10 w-full">
                <h4 className="font-mono text-xs text-[#FF3333] uppercase tracking-widest mb-6">Professional History</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PORTFOLIO_DATA.experience.map((exp, idx) => (
                    <div key={idx} className="bg-white/5 p-5 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/20 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-syne font-bold text-lg leading-tight">{exp.company}</h5>
                      </div>
                      <span className="font-mono text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400 w-fit mb-2">{exp.year}</span>
                      <p className="text-xs font-mono text-[#FF3333] mb-3 uppercase tracking-wide">{exp.role}</p>
                      <p className="text-xs text-gray-400 leading-relaxed opacity-80 mt-auto">{exp.details}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.section>

      {/* --- NEW EDUCATION SECTION (WITH SCROLL ANIMATION: ZOOM IN) --- */}
      <motion.section 
        id="education" 
        className="py-24 px-6 md:px-12 bg-[#F5F5F0] text-[#1a1a1a] border-t border-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={SECTION_ANIMATIONS.education}
      >
         <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="md:col-span-4">
               <h2 className="font-syne text-5xl md:text-7xl font-bold leading-none mb-6">
                 ACADEMIC <br/> <span className="text-transparent stroke-text">JOURNEY</span>
               </h2>
               <p className="font-sans text-lg text-gray-600 max-w-sm">
                 A solid foundation in design principles, visual storytelling, and technical proficiency.
               </p>
            </div>
            <div className="md:col-span-8">
               <div className="space-y-12">
                  {PORTFOLIO_DATA.education.map((edu, idx) => (
                     <div key={idx} className="border-l-2 border-black pl-8 relative">
                        <span className="absolute -left-[5px] top-0 w-2 h-2 bg-[#FF3333] rounded-full"></span>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline mb-2">
                           <h3 className="font-syne text-4xl font-bold">{edu.school}</h3>
                           <span className="font-mono text-sm text-gray-500">{edu.year}</span>
                        </div>
                        <h4 className="font-sans text-2xl font-bold mb-4">{edu.degree}</h4>
                        <p className="font-sans text-lg text-gray-600 leading-relaxed max-w-3xl">
                           {edu.details}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </motion.section>

      {/* --- MARQUEE 3 --- */}
      <Marquee text="Projects • Case Studies • Impact • Results" />

      {/* --- WORK SECTION (WITH SCROLL ANIMATION: SLIDE UP) --- */}
      <motion.section 
        id="work" 
        className="bg-[#1a1a1a] border-t border-white/20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={SECTION_ANIMATIONS.work}
      >
         <div className="px-6 md:px-12 py-24 flex flex-col md:flex-row items-center justify-center relative overflow-hidden">
            <motion.div 
               animate={{ rotateY: 360, rotateZ: 45 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="hidden md:block absolute left-10 md:left-32 text-white/10"
            >
               <div className="w-32 h-32 rounded-full border border-white/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 border border-white/20 rounded-full rotate-45"></div>
                  <div className="absolute inset-0 border border-white/20 rounded-full -rotate-45"></div>
                  <div className="w-20 h-20 border border-white/20 rounded-full"></div>
               </div>
            </motion.div>

            <div className="hidden md:block absolute right-10 md:right-32">
               <motion.div 
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#FF3333] rounded-full blur-xl"
               />
               <div className="relative text-[#FF3333]">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
               </div>
            </div>

            <h2 className="font-syne text-5xl md:text-[8vw] font-bold leading-none text-white text-center z-10 relative tracking-tighter px-4 md:px-20">
               SELECTED <span className="text-transparent stroke-text-white">WORKS</span>
            </h2>
         </div>
         
         {PORTFOLIO_DATA.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
         ))}
         
         <div className="w-full border-t border-white/20 py-24 text-center">
            <h3 className="font-syne text-4xl text-gray-600">Archive Loading...</h3>
         </div>
      </motion.section>

      {/* --- MARQUEE 4 --- */}
      <Marquee text="Let's Talk • Collaboration • Vision • Success" direction={-1} className="bg-[#F5F5F0] border-y border-black" />

      {/* --- FOOTER (WITH SCROLL ANIMATION: FADE IN) --- */}
      <motion.footer 
        id="contact" 
        className="py-24 px-6 md:px-12 bg-[#F5F5F0] border-t border-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={SECTION_ANIMATIONS.footer}
      >
         <div className="flex flex-col md:flex-row justify-between items-end">
            <div>
               <h2 className="font-syne font-extrabold text-[12vw] leading-none tracking-tighter text-black uppercase">
                  Let's <br/> <span className="text-[#FF3333]">Connect</span>
               </h2>
            </div>
            <div className="mt-12 md:mt-0 flex flex-col items-end gap-4">
               <a href={`mailto:${PORTFOLIO_DATA.profile.email}`} className="flex items-center gap-2 font-syne text-2xl font-bold hover:text-[#FF3333] transition-colors">
                  <Mail /> {PORTFOLIO_DATA.profile.email}
               </a>
               <a href={`tel:${PORTFOLIO_DATA.profile.phone}`} className="font-mono text-lg hover:text-[#FF3333] transition-colors">
                  {PORTFOLIO_DATA.profile.phone}
               </a>
               <div className="flex gap-4 mt-4">
                  <a href={PORTFOLIO_DATA.profile.facebook} className="p-3 border border-black rounded-full hover:bg-black hover:text-white transition-all"><Facebook size={20}/></a>
                  <a href="#" className="p-3 border border-black rounded-full hover:bg-black hover:text-white transition-all"><Linkedin size={20}/></a>
                  <a href="#" className="p-3 border border-black rounded-full hover:bg-black hover:text-white transition-all"><Globe size={20}/></a>
               </div>
            </div>
         </div>
         <div className="mt-24 flex justify-between items-center font-mono text-xs uppercase border-t border-black pt-6">
            <span>© 2026 Tran Vu Anh Duy</span>
            <span>Graphic / Multimedia / UXUI</span>
         </div>
      </motion.footer>
    </div>
  );
}
