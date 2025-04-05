import { createSignal, onMount, onCleanup } from 'solid-js';

// Import as a headless component to inject the preload link at build time
import FontPreloader from "~/components/FontPreloader";

export default function LoadingAnimation() {
  const [dots, setDots] = createSignal(1);
  let intervalId: ReturnType<typeof setInterval>;
  
  onMount(() => {
    // Animate the dots
    intervalId = setInterval(() => {
      setDots(prev => (prev % 3) + 1);
    }, 500);
    
    // Force the browser to load the font early
    document.fonts.load('1em "Bungee Spice"').catch(err => {
      console.warn("Font preloading error:", err);
    });
  });
  
  onCleanup(() => {
    clearInterval(intervalId);
  });
  
  return (
    <div class="loading-animation flex flex-col items-center justify-center h-screen w-full">
      {/* Hidden component that inserts preload links */}
      <FontPreloader />
      
      <div class="space-y-8">
        {/* Animated planet */}
        <div class="relative mx-auto w-24 h-24">
          <div class="absolute inset-0 rounded-full bg-purple-600 opacity-20 animate-pulse"></div>
          <div class="absolute inset-2 rounded-full bg-indigo-500 animate-spin-slow"></div>
          <div class="absolute inset-5 rounded-full bg-violet-800"></div>
          <div class="absolute w-2 h-2 rounded-full bg-white animate-orbit" 
               style={{ transform: 'translateX(50px)' }}></div>
        </div>
        
        {/* Loading text with animated dots */}
        <div class="text-white text-center text-2xl">
          Loading{'.'.repeat(dots())}
        </div>
      </div>
    </div>
  );
} 