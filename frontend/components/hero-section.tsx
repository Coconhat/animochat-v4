'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onStartChat: () => void;
}

export function HeroSection({ onStartChat }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-4 sm:px-6 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0D1A0D 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-16 h-16 rounded-2xl bg-ani-green/10 animate-bounce-subtle hidden lg:block" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/3 right-16 w-12 h-12 rounded-xl bg-ani-green/15 animate-bounce-subtle hidden lg:block" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-8 h-8 rounded-lg bg-ani-green/20 animate-bounce-subtle hidden lg:block" style={{ animationDelay: '1.5s' }} />
      
      {/* Content */}
      <div className={`text-center max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Micro Label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-ani-border mb-8">
          <Sparkles className="w-4 h-4 text-ani-green" />
          <span className="font-mono text-xs uppercase tracking-widest text-ani-muted">
            Anonymous Messaging
          </span>
        </div>
        
        {/* Main Headline */}
        <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-ani-text mb-6 leading-[0.95]">
          Start a
          <span className="relative inline-block mx-3">
            <span className="relative z-10 text-ani-green">chat</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
              <path d="M2 10C50 2 150 2 198 10" stroke="#2DC653" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3"/>
            </svg>
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-ani-muted mb-10 max-w-lg mx-auto">
          Anonymous. Random. No accounts needed.
        </p>
        
        {/* CTA Button */}
        <Button
          onClick={onStartChat}
          size="lg"
          className="bg-gradient-to-br from-ani-green to-ani-green-light text-white font-display font-semibold text-lg px-8 py-6 rounded-2xl shadow-card hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 group"
        >
          <span>Find a Match</span>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-3 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Button>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-ani-muted">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ani-green" />
            <span>No signup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ani-green" />
            <span>End-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ani-green" />
            <span>Auto-delete messages</span>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-6 h-10 rounded-full border-2 border-ani-muted/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-ani-muted/50 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
