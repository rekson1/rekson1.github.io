"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const appleEase = [0.16, 1, 0.3, 1] as const;

// changed it to coursework
const skills = [
  { category: "CAD", items: ["Kinematics & Dynamics", "Thermodynamics", "Fluid Mechanics"] },
  { category: "Analysis", items: ["CAD", "Design of Mechanical Systems", "Probability Theory"] },
  { category: "Programming", items: ["C Programming", "Organic Chemistry", "Multivariable Calculus"] },
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Parallax for various elements - reduced range so headers settle faster
  const headerY = useTransform(scrollYProgress, [0, 0.4], [30, 0]);
  const photoY = useTransform(scrollYProgress, [0, 1], [40, -30]);
  const contentY = useTransform(scrollYProgress, [0, 1], [25, -15]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: appleEase },
    },
  };

  return (
    <section 
      ref={sectionRef}
      id="about" 
      className="relative min-h-screen py-20 sm:py-32 md:py-48"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-12 max-w-7xl">
        {/* Asymmetrical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
          
          {/* Left Column - Photo */}
          <motion.div 
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: appleEase }}
            style={{ y: photoY }}
          >
            {/* Photo container with glass overlay */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
              {/* Placeholder image */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-turbonite-base/30 to-deep-black"
                style={{
                  backgroundImage: "url('/me.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              
              {/* Glass overlay tint */}
              <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 via-turbonite-base/10 to-transparent" />
              
              {/* Decorative frame corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-turbonite-highlight/40" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-turbonite-highlight/40" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-turbonite-highlight/40" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-turbonite-highlight/40" />

              {/* Technical overlay text */}
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-mono text-[10px] tracking-[0.2em] text-engineering-white/50 uppercase">
                  
                </p>
                <p className="font-mono text-[10px] tracking-[0.2em] text-turbonite-highlight/40 uppercase mt-1">
                  Frame: 001 // ISO 400
                </p>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div 
              className="absolute -bottom-6 -right-6 md:right-6 bg-deep-black/90 backdrop-blur-sm border border-white/10 rounded-lg px-6 py-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6, ease: appleEase }}
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-turbonite-highlight uppercase">Minor:</p>
              <p className="text-sm text-engineering-white mt-1">Nanoscience </p>
              <p className="text-sm text-engineering-white">& Technology</p>
            </motion.div>
          </motion.div>

          {/* Right Column - Content */}
          <motion.div 
            className="lg:col-span-7"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ y: contentY }}
          >
            {/* Section label - with extra bottom margin */}
            <motion.p 
              className="text-[10px] sm:text-xs font-mono tracking-[0.2em] sm:tracking-[0.3em] text-turbonite-highlight uppercase mb-6 sm:mb-8 text-center lg:text-left"
              variants={itemVariants}
              style={{ y: headerY }}
            >
              01 — About
            </motion.p>

            {/* Name & Title */}
            <motion.div variants={itemVariants} className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-engineering-white mb-3">
                Evan Sie
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-turbonite-base tracking-wide">
                Mechanical Engineering at University of Texas at Dallas
              </p>
              <p className="text-xs sm:text-sm font-mono text-turbonite-highlight/60 tracking-wider mt-2">
                Class of 2027
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div 
              className="w-24 h-px bg-gradient-to-r from-turbonite-highlight to-transparent my-8 sm:my-10 mx-auto lg:mx-0"
              variants={itemVariants}
            />

            {/* Narrative */}
            <motion.div variants={itemVariants} className="text-center lg:text-left">
              <p className="text-lg sm:text-xl md:text-2xl font-light text-engineering-white/90 leading-relaxed mb-6">
               
              </p>
              <p className="text-sm sm:text-base text-turbonite-base/80 leading-relaxed mb-4">
              Hi! I&apos;m Evan, I&apos;m a Mechanical Engineering student at University of Texas at Dallas. I started my journey in Indonesia where I moved
              to the US at the age of 7. Here I learned to speak English and gained a passion for aviation and engineering. Both of my parents were engineers so I was always grounded in the field.
              This culminated in a long time hobby of building RC aircraft and drones, the first of which I built when I was 10. Ever since then I have been doing personal projects that involve engineering and technical skills over the years.
              </p>
              <p className="text-sm sm:text-base text-turbonite-base/80 leading-relaxed">
                
              </p>
            </motion.div>

            {/* Skills */}
            <motion.div 
              className="mt-10 sm:mt-14"
              variants={itemVariants}
            >
              <p className="font-mono text-[10px] tracking-[0.2em] text-turbonite-highlight uppercase mb-4 sm:mb-6 text-center lg:text-left">
                Relevant Coursework
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {skills.flatMap(cat => cat.items).map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="px-3 py-1.5 text-xs font-mono tracking-wider text-turbonite-base/70 bg-white/[0.02] border border-white/5 rounded hover:border-turbonite-highlight/30 hover:text-engineering-white transition-all duration-200"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03, duration: 0.3, ease: appleEase }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
