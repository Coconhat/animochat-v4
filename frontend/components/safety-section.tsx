'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, EyeOff, Trash2, Shield } from 'lucide-react';

const safetyFeatures = [
  {
    icon: Lock,
    title: 'End-to-end encrypted',
    description: 'Your messages are secure.',
  },
  {
    icon: EyeOff,
    title: 'No data collection',
    description: 'We dont store personal info.',
  },
  {
    icon: Trash2,
    title: 'Auto-delete',
    description: 'Chats disappear when you leave.',
  },
];

export function SafetySection() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <span className="font-mono text-xs uppercase tracking-widest text-ani-muted mb-4 block">
              Your Safety
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ani-text mb-6">
              Youre in control
            </h2>
            <p className="text-ani-muted text-lg leading-relaxed mb-8">
              End any chat instantly. Report if something feels off. We never store your messages.
            </p>
            
            {/* Safety Features */}
            <div className="space-y-4">
              {safetyFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`flex items-start gap-4 p-4 bg-white rounded-2xl border border-ani-border shadow-card transition-all duration-700`}
                  style={{ transitionDelay: `${(index + 2) * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-ani-green/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-ani-green" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-ani-text mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-ani-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Visual */}
          <div className={`relative transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative bg-white rounded-3xl border border-ani-border shadow-card p-6 sm:p-8">
              {/* Chat Preview */}
              <div className="space-y-4">
                {/* Message 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ani-muted to-ani-text flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">S</span>
                  </div>
                  <div className="bg-ani-bg rounded-2xl rounded-tl-md px-4 py-3 max-w-[70%]">
                    <p className="text-sm text-ani-text">Hey! How&apos;s it going?</p>
                  </div>
                </div>
                
                {/* Message 2 */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-gradient-to-br from-ani-green to-ani-green-light rounded-2xl rounded-tr-md px-4 py-3 max-w-[70%]">
                    <p className="text-sm text-white">Pretty good! Just exploring this app.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ani-green to-ani-green-light flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">Y</span>
                  </div>
                </div>
                
                {/* Message 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ani-muted to-ani-text flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">S</span>
                  </div>
                  <div className="bg-ani-bg rounded-2xl rounded-tl-md px-4 py-3 max-w-[70%]">
                    <p className="text-sm text-ani-text">Same here! Love how anonymous it is.</p>
                  </div>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl border border-ani-border shadow-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-ani-green/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-ani-green" />
                </div>
                <div>
                  <p className="font-display font-semibold text-ani-text text-sm">Encrypted</p>
                  <p className="text-xs text-ani-muted">Your chat is secure</p>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl bg-ani-green/10 -z-10" />
            <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-xl bg-ani-green/15 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
