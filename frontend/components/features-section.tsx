'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Shuffle, LogOut } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Truly anonymous',
    description: 'No phone number. No email. No names. Just a conversation.',
    size: 'large',
  },
  {
    icon: Shuffle,
    title: 'Random match',
    description: 'Meet someone new in one tap.',
    size: 'small',
  },
  {
    icon: LogOut,
    title: 'Leave anytime',
    description: 'End or skip without drama.',
    size: 'small',
  },
];

export function FeaturesSection() {
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
    <section ref={sectionRef} className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="font-mono text-xs uppercase tracking-widest text-ani-muted mb-4 block">
            Why AniMoChat
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ani-text">
            Chat without boundaries
          </h2>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Large Card */}
          <div
            className={`md:row-span-2 bg-white rounded-3xl border border-ani-border shadow-card p-6 sm:p-8 transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-ani-green/10 flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-ani-green" />
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-ani-text mb-4">
              {features[0].title}
            </h3>
            <p className="text-ani-muted text-base sm:text-lg leading-relaxed">
              {features[0].description}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-ani-green to-ani-green-light border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-white">{i}</span>
                  </div>
                ))}
              </div>
              <span className="text-sm text-ani-muted">+2.5M anonymous chats</span>
            </div>
          </div>
          
          {/* Small Cards */}
          {features.slice(1).map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-white rounded-3xl border border-ani-border shadow-card p-6 sm:p-8 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
              }`}
              style={{ transitionDelay: `${(index + 2) * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-ani-green/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-ani-green" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-ani-text mb-3">
                {feature.title}
              </h3>
              <p className="text-ani-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
