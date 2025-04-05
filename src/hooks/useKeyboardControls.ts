// src/hooks/useKeyboardControls.solid.ts
import { createSignal, onMount, onCleanup } from 'solid-js';

export function useKeyboardControls() {
  const [leftPressed, setLeftPressed] = createSignal(false);
  const [rightPressed, setRightPressed] = createSignal(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setLeftPressed(true);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      setRightPressed(true);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      setLeftPressed(false);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      setRightPressed(false);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
  });

  return { leftPressed, rightPressed, setLeftPressed, setRightPressed };
}