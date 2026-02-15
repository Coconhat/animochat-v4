'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CtaSectionProps {
  onStartChat: () => void;
}

export function CtaSection({ onStartChat }: CtaSectionProps) {
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
      { threshold: 0.3 }
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
      
      {/* Decorative Circles */}
      <div className="absolute top-1/4 left-10 w-32 h-32 rounded-full bg-ani-green/5 hidden lg:block" />
      <div className="absolute bottom-1/4 right-10 w-48 h-48 rounded-full bg-ani-green/5 hidden lg:block" />
      
      <div className="max-w-3xl mx-auto text-center relative">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Ready to meet someone new?
          </h2>
          <p className="text-white/60 text-lg sm:text-xl mb-10 max-w-lg mx-auto">
            Tap match. Say hi. See where it goes.
          </p>
          
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
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ani-green to-ani-green-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-display font-bold text-white">AniMoChat</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-ani-green fill-ani-green" />
            <span>for anonymous chats</span>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-6 text-center">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} AniMoChat. All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
}
