'use client';

import { useEffect, useRef, useState } from 'react';
import { Touchpad, MessageSquare, SkipForward } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Touchpad,
    title: 'Tap Find a match',
    description: "We'll pair you with someone online now.",
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Say hello',
    description: 'Text, react, or send a voice note.',
  },
  {
    number: '03',
    icon: SkipForward,
    title: 'Keep or skip',
    description: 'Stay as long as you want. Next match anytime.',
  },
];

export function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6 bg-ani-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Section Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="font-mono text-xs uppercase tracking-widest text-white/50 mb-4 block">
            How It Works
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white">
            Three steps to connect
          </h2>
        </div>
        
        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              {/* Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-8 h-full hover:bg-white/10 transition-colors duration-300">
                {/* Step Number */}
                <span className="font-mono text-sm text-ani-green mb-6 block">
                  Step {step.number}
                </span>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-ani-green/20 flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-ani-green" />
                </div>
                
                {/* Content */}
                <h3 className="font-display font-bold text-xl sm:text-2xl text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {/* Connector Line (not on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/20 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
