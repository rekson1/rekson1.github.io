"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";

const appleEase = [0.16, 1, 0.3, 1] as const;

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

function DockItem({ icon, label, href, isActive }: DockItemProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector(href) as HTMLElement | null;
    if (target) {
      const lenis = (window as unknown as { lenis?: Lenis }).lenis;
      if (lenis) {
        lenis.scrollTo(target, {
          duration: 2,
          easing: (t: number) => {
            return t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;
          },
        });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [href]);

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={`
        group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl cursor-pointer
        transition-colors duration-200
        ${isActive ? "text-engineering-white" : "text-turbonite-base hover:text-engineering-white"}
      `}
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15, ease: appleEase }}
    >
      {icon}
      
      {isActive && (
        <motion.div
          className="absolute -bottom-1 sm:-bottom-1.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-turbonite-highlight"
          layoutId="activeIndicator"
          transition={{ duration: 0.3, ease: appleEase }}
        />
      )}

      {/* Tooltip - hidden on mobile */}
      <span className="absolute -top-10 px-3 py-1.5 text-[10px] tracking-wider uppercase bg-deep-black border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap font-mono hidden sm:block">
        {label}
      </span>
    </motion.a>
  );
}

// Icons
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" strokeLinecap="square" />
  </svg>
);

const AboutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="square" />
  </svg>
);

const WorksIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" strokeLinecap="square" />
    <rect x="14" y="3" width="7" height="7" strokeLinecap="square" />
    <rect x="3" y="14" width="7" height="7" strokeLinecap="square" />
    <rect x="14" y="14" width="7" height="7" strokeLinecap="square" />
  </svg>
);

const ContactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16v14H5.5L4 20V4z" strokeLinecap="square" />
    <path d="M8 9h8M8 13h5" strokeLinecap="square" />
  </svg>
);

export default function FloatingDock() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero");
      const aboutSection = document.getElementById("about");
      const worksSection = document.getElementById("works");
      const contactSection = document.getElementById("contact");
      
      if (!heroSection) return;

      const scrollY = window.scrollY;
      const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      
      setIsExpanded(scrollY > heroBottom * 0.3);

      const viewportMiddle = scrollY + window.innerHeight / 2;

      if (contactSection && viewportMiddle >= contactSection.offsetTop) {
        setActiveSection("contact");
      } else if (worksSection && viewportMiddle >= worksSection.offsetTop) {
        setActiveSection("works");
      } else if (aboutSection && viewportMiddle >= aboutSection.offsetTop) {
        setActiveSection("about");
      } else {
        setActiveSection("hero");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed bottom-6 sm:bottom-8 left-1/2 z-[60]"
      style={{ x: "-50%" }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.6, ease: appleEase }}
    >
      <motion.nav
        className="relative overflow-hidden backdrop-blur-sm backdrop-saturate-[2.5]"
        animate={{
          width: isExpanded ? (isMobile ? 200 : 280) : 10,
          height: isExpanded ? (isMobile ? 48 : 64) : 10,
          borderRadius: isExpanded ? 16 : 5,
        }}
        transition={{ duration: 0.4, ease: appleEase }}
        style={{
          // iOS-style liquid glass: minimal tint to let blur show through
          backgroundColor: "rgba(255, 255, 255, 0)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Inner highlight gradient for depth - very subtle */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            borderRadius: "inherit",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 50%, transparent 70%, rgba(0,0,0,0.05) 100%)",
          }}
        />

        {/* Collapsed state - glowing dot */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-turbonite-highlight animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded state - dock items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                <DockItem 
                  icon={<HomeIcon />} 
                  label="Home" 
                  href="#hero" 
                  isActive={activeSection === "hero"} 
                />
                <div className="w-px h-4 sm:h-5 bg-white/10 mx-1 sm:mx-1.5" />
                <DockItem 
                  icon={<AboutIcon />} 
                  label="About" 
                  href="#about" 
                  isActive={activeSection === "about"} 
                />
                <div className="w-px h-4 sm:h-5 bg-white/10 mx-1 sm:mx-1.5" />
                <DockItem 
                  icon={<WorksIcon />} 
                  label="Works" 
                  href="#works" 
                  isActive={activeSection === "works"} 
                />
                <div className="w-px h-4 sm:h-5 bg-white/10 mx-1 sm:mx-1.5" />
                <DockItem 
                  icon={<ContactIcon />} 
                  label="Contact" 
                  href="#contact" 
                  isActive={activeSection === "contact"} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.div>
  );
}
