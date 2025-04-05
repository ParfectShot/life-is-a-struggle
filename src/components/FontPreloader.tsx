import { onMount } from 'solid-js';
import { Link } from '@solidjs/meta';

// Component to preload fonts in the document head
export default function FontPreloader() {
  onMount(() => {
    // Try to force font loading on mount
    try {
      if ('fonts' in document) {
        document.fonts.load('1em "Bungee Spice"');
      }
    } catch (err) {
      console.warn("Font loading error:", err);
    }
  });

  return (
    <>
      {/* These elements will be injected into the document head */}
      <Link 
        rel="preload" 
        href="https://fonts.googleapis.com/css2?family=Bungee+Spice&display=swap" 
        as="font" 
        crossOrigin="anonymous" 
      />
      <Link 
        rel="preconnect" 
        href="https://fonts.gstatic.com" 
        crossOrigin="anonymous" 
      />
    </>
  );
} 