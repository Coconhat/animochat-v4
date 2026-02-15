'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Is it really anonymous?',
    answer: 'Yes! We dont ask for your name, email, phone number, or any personal information. Your chats are completely anonymous and disappear when you leave.',
  },
  {
    question: 'Can I use it without an account?',
    answer: 'Absolutely. No signup, no login, no passwords. Just open the app and start chatting instantly.',
  },
  {
    question: 'What if someone behaves badly?',
    answer: 'You can end any chat instantly with one tap. We also have a report feature to help keep the community safe.',
  },
  {
    question: 'Are messages saved?',
    answer: 'No. All messages are automatically deleted when the chat ends. We dont store your conversation history on our servers.',
  },
];

export function FaqSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-14 h-14 rounded-2xl bg-ani-green/10 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-7 h-7 text-ani-green" />
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ani-text">
            Questions?
          </h2>
        </div>
        
        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl border border-ani-border shadow-card overflow-hidden transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-ani-bg/50 transition-colors"
              >
                <span className="font-display font-semibold text-ani-text pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-ani-muted flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                }`}
              >
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <p className="text-ani-muted leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
