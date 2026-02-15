'use client';

import { useState, useEffect } from 'react';
import { ChatProvider, useChat } from '@/components/chat-context';
import { ChatInterface } from '@/components/chat-interface';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { HowItWorksSection } from '@/components/how-it-works-section';
import { SafetySection } from '@/components/safety-section';
import { StatsSection } from '@/components/stats-section';
import { FaqSection } from '@/components/faq-section';
import { CtaSection } from '@/components/cta-section';
import { MessageCircle, X } from 'lucide-react';

// Floating Chat Button Component
function FloatingChatButton({ onClick }: { onClick: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-ani-green to-ani-green-light text-white shadow-card-lg hover:shadow-card-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}

// Main App Content
function AppContent() {
  const [showChat, setShowChat] = useState(false);
  const { connect, findMatch } = useChat();
  
  const handleStartChat = () => {
    connect();
    setShowChat(true);
    // Auto-find match when opening chat
    setTimeout(() => {
      findMatch();
    }, 500);
  };
  
  const handleCloseChat = () => {
    setShowChat(false);
  };
  
  return (
    <div className="relative">
      {/* Landing Page */}
      <main className={`${showChat ? 'hidden' : 'block'}`}>
        <HeroSection onStartChat={handleStartChat} />
        <FeaturesSection />
        <HowItWorksSection />
        <SafetySection />
        <StatsSection />
        <FaqSection />
        <CtaSection onStartChat={handleStartChat} />
      </main>
      
      {/* Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-ani-bg animate-fade-in">
          {/* Close Button */}
          <button
            onClick={handleCloseChat}
            className="fixed top-4 right-4 z-[60] w-10 h-10 rounded-xl bg-white border border-ani-border shadow-card flex items-center justify-center text-ani-muted hover:text-ani-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <ChatInterface />
        </div>
      )}
      
      {/* Floating Chat Button */}
      {!showChat && <FloatingChatButton onClick={handleStartChat} />}
    </div>
  );
}

// Root App Component
export default function Home() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
