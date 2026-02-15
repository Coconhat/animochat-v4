"use client";

import { useEffect, useRef, useState } from "react";
import { Users, MessageCircle, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "",
    label: "Online now",
  },
  {
    icon: MessageCircle,
    value: "",
    label: "Matches this week",
  },
  {
    icon: Zap,
    value: "",
    label: "Avg. wait time",
  },
];

export function StatsSection() {
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
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-32 px-4 sm:px-6 bg-ani-dark relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Visual */}
          <div
            className={`relative order-2 lg:order-1 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}
          >
            <div className="relative">
              {/* Main Circle */}
              <div className="w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-full bg-gradient-to-br from-ani-green/20 to-ani-green/5 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-ani-green/30 to-ani-green/10 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-ani-green to-ani-green-light flex items-center justify-center shadow-card-lg">
                    <Users className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Avatars */}
              <div className="absolute top-0 left-1/4 w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center animate-bounce-subtle">
                <span className="text-sm font-medium text-ani-text">A</span>
              </div>
              <div
                className="absolute top-1/4 right-0 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center animate-bounce-subtle"
                style={{ animationDelay: "0.5s" }}
              >
                <span className="text-sm font-medium text-ani-text">B</span>
              </div>
              <div
                className="absolute bottom-1/4 left-0 w-14 h-14 rounded-full bg-white shadow-card flex items-center justify-center animate-bounce-subtle"
                style={{ animationDelay: "1s" }}
              >
                <span className="text-sm font-medium text-ani-text">C</span>
              </div>
              <div
                className="absolute bottom-0 right-1/4 w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center animate-bounce-subtle"
                style={{ animationDelay: "1.5s" }}
              >
                <span className="text-sm font-medium text-ani-text">D</span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div
            className={`order-1 lg:order-2 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
          >
            <span className="font-mono text-xs uppercase tracking-widest text-white/50 mb-4 block">
              Live Community
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white mb-6">
              Thousands online now
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              From late-night thoughts to random jokes—someones always here.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`text-center transition-all duration-700`}
                  style={{ transitionDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-ani-green/20 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-ani-green" />
                  </div>
                  <p className="font-display font-bold text-2xl sm:text-3xl text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
