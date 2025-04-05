// src/components/GameScreen.tsx
import { createSignal, createEffect, onMount, onCleanup, on } from "solid-js";
import { createMediaQuery } from "@solid-primitives/media";
import type { Career } from "../types";
import { useKeyboardControls } from "../hooks/useKeyBoardControls"; // Path to Solid hook

interface GameScreenProps {
  career: Career;
  onGameOver: (score: number) => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  speed: number;
}

const AVATAR_SIZE = 50;
const OBSTACLE_HEIGHT = 30;
const OBSTACLE_MIN_WIDTH = 80;
const OBSTACLE_MAX_WIDTH = 400; // Increased max width to accommodate longer text
const OBSTACLE_PADDING = 20; // Padding for obstacle text
const INITIAL_SPEED = 2;
const SPEED_INCREMENT = 0.0001; // Keep low for Solid's reactivity
const OBSTACLE_FREQUENCY = 1500; // ms
const DESKTOP_GAME_WIDTH = 500; // Fixed width for desktop
const MOBILE_CONTROL_HEIGHT = 60; // Height of the mobile controls area
const MOBILE_TITLE_HEIGHT = 40; // Approximate height of the small title on mobile
const MOBILE_SCORE_HEIGHT = 40; // Height of the score area on mobile

export default function GameScreen(props: GameScreenProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  const [ctx, setCtx] = createSignal<CanvasRenderingContext2D | null>(null);
  const [score, setScore] = createSignal(0);
  const [gameSpeed, setGameSpeed] = createSignal(INITIAL_SPEED);
  const [avatarX, setAvatarX] = createSignal(0);
  const [obstacles, setObstacles] = createSignal<Obstacle[]>([]);
  const [canvasSize, setCanvasSize] = createSignal({ width: 0, height: 400 }); // Default height
  const [isGameActive, setIsGameActive] = createSignal(true);
  
  // Media query for responsive design
  const isMobile = createMediaQuery("(max-width: 768px)");

  // Refs for values that don't trigger re-renders directly
  let animationFrameId: number | null = null;
  let lastObstacleTime = 0;
  let touchStartX: number | null = null; // For touch handling logic if needed

  // Keyboard controls hook (needs translation)
  const { leftPressed, rightPressed, setLeftPressed, setRightPressed } = useKeyboardControls();

  // Helper function to measure text width
  function measureTextWidth(context: CanvasRenderingContext2D, text: string, font: string): number {
    context.save();
    context.font = font;
    const metrics = context.measureText(text);
    context.restore();
    return metrics.width;
  }

  // --- Setup Canvas and Resize ---
  onMount(() => {
    if (canvasRef) {
      setCtx(canvasRef.getContext("2d"));

      const updateCanvasSize = () => {
        if (canvasRef) {
            let width;
            let height;
            
            // For desktop, use fixed width
            if (!isMobile()) {
              width = DESKTOP_GAME_WIDTH;
              height = 400; // Fixed height on desktop
            } else {
              // For mobile, use full viewport width and calculate appropriate height
              width = window.innerWidth;
              
              // Calculate available height by subtracting header, score, and controls areas
              // This ensures we stay within the viewport
              const totalHeight = window.innerHeight;
              const reservedHeight = MOBILE_TITLE_HEIGHT + MOBILE_SCORE_HEIGHT + MOBILE_CONTROL_HEIGHT;
              const paddingSpace = 24; // Account for padding (approx 6px * 4)
              
              height = totalHeight - reservedHeight - paddingSpace;
            }
            
            canvasRef.width = width;
            canvasRef.height = height;
            setCanvasSize({ width, height });
            
            // Re-initialize avatar position
            if (canvasSize().width === 0) {
                setAvatarX(width / 2 - AVATAR_SIZE / 2);
            }
        }
      };

      updateCanvasSize(); // Initial size
      window.addEventListener("resize", updateCanvasSize);

      onCleanup(() => {
        window.removeEventListener("resize", updateCanvasSize);
      });
    }
  });

  // --- Touch Controls ---
  createEffect(() => {
    const canvas = canvasRef;
    if (!canvas || canvasSize().width === 0) return; // Ensure canvas exists and has size

    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvasRect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
        touchStartX = touchX; // Store initial touch X relative to canvas

        // Determine initial direction based on touch side
        if (touchX < canvasSize().width / 2) {
            setLeftPressed(true);
            setRightPressed(false);
        } else {
            setLeftPressed(false);
            setRightPressed(true);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvasRect = canvas.getBoundingClientRect();
        const currentTouchX = touch.clientX - canvasRect.left;

        // Keep pressing the side the touch *moved* to
         if (currentTouchX < canvasSize().width / 2) {
            setLeftPressed(true);
            setRightPressed(false);
        } else {
            setLeftPressed(false);
            setRightPressed(true);
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        touchStartX = null;
        setLeftPressed(false);
        setRightPressed(false);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false }); // Handle cancel too

    onCleanup(() => {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
        canvas.removeEventListener("touchcancel", handleTouchEnd);
    });
  }); // Rerun if canvasSize changes


  // --- Game Loop ---
  createEffect(on([isGameActive, ctx, canvasSize], ([active, context, size]) => {
      if (!active || !context || size.width === 0) {
          // Cleanup potentially running animation frame if game becomes inactive
          if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
          }
          return;
      }

      // Reset obstacle time only when game loop *starts*
      if (animationFrameId === null) {
          lastObstacleTime = performance.now();
      }

      const gameLoop = (timestamp: number) => {
          if (!isGameActive()) { // Check signal directly
              animationFrameId = null;
              return;
          }

          // --- Game Logic ---
          const currentCtx = ctx(); // Get context again (might have changed)
          if (!currentCtx) return;
          const { width: canvasW, height: canvasH } = canvasSize();

          // Clear canvas with a transparent background
          currentCtx.clearRect(0, 0, canvasW, canvasH);

          // Update score
          setScore(prev => prev + 1); // Simple increment per frame

          // Increase game speed
          // Note: Updating speed signal constantly can be expensive. Consider updating less often or calculating speed inside loop.
          const currentSpeed = gameSpeed() + SPEED_INCREMENT;
          setGameSpeed(currentSpeed);


          // Move avatar (using signals)
          setAvatarX(prev => {
              let nextX = prev;
              if (leftPressed()) nextX = Math.max(0, prev - 5);
              if (rightPressed()) nextX = Math.min(canvasW - AVATAR_SIZE, prev + 5);
              return nextX;
          });

          // Draw avatar (using signal value)
          const currentAvatarX = avatarX(); // Read signal value
          currentCtx.fillStyle = "#FFFFFF";
          currentCtx.font = "30px Arial";
          currentCtx.textAlign = "center";
          currentCtx.textBaseline = "middle";
          currentCtx.fillText(props.career.avatar, currentAvatarX + AVATAR_SIZE / 2, canvasH - AVATAR_SIZE / 2);


          // Generate new obstacles
          if (timestamp - lastObstacleTime > OBSTACLE_FREQUENCY) {
              // Select a random obstacle text
              const obstacleText = props.career.obstacles[Math.floor(Math.random() * props.career.obstacles.length)];
              
              // Measure text width to determine obstacle width
              const textFont = "12px Arial";
              const measuredWidth = measureTextWidth(currentCtx, obstacleText, textFont);
              
              // Add padding and ensure width stays within bounds
              const width = Math.min(
                Math.max(measuredWidth + OBSTACLE_PADDING * 2, OBSTACLE_MIN_WIDTH),
                Math.min(OBSTACLE_MAX_WIDTH, canvasW * 0.8) // Don't let obstacles be wider than 80% of canvas
              );
              
              // Position the obstacle
              const x = Math.random() * (canvasW - width);

              const newObstacle: Obstacle = {
                  x,
                  y: -OBSTACLE_HEIGHT,
                  width,
                  height: OBSTACLE_HEIGHT,
                  text: obstacleText,
                  speed: currentSpeed, // Use calculated speed for this obstacle
              };

              setObstacles(prev => [...prev, newObstacle]);
              lastObstacleTime = timestamp;
          }

          // Draw & Update Obstacles
          const nextObstacles: Obstacle[] = [];
          let collisionDetected = false;
          const avatarY = canvasH - AVATAR_SIZE;

          for (const obstacle of obstacles()) { // Read obstacles signal
              const nextY = obstacle.y + obstacle.speed;

              // Draw obstacle rectangle
              currentCtx.fillStyle = "#FF4444";
              currentCtx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
              
              // Draw obstacle text
              currentCtx.fillStyle = "#FFFFFF";
              currentCtx.font = "12px Arial";
              currentCtx.textAlign = "center";
              currentCtx.textBaseline = "middle";
              currentCtx.fillText(
                obstacle.text, 
                obstacle.x + obstacle.width / 2, 
                obstacle.y + obstacle.height / 2, 
                obstacle.width - OBSTACLE_PADDING // Set max width to prevent overflow
              );

              // Check Collision
              if (
                  currentAvatarX < obstacle.x + obstacle.width &&
                  currentAvatarX + AVATAR_SIZE > obstacle.x &&
                  avatarY < nextY + obstacle.height && // Check against next position
                  avatarY + AVATAR_SIZE > nextY
              ) {
                  collisionDetected = true;
              }

              // Keep obstacle if it's still on screen
              if (nextY < canvasH) {
                  nextObstacles.push({ ...obstacle, y: nextY });
              }
          }
          setObstacles(nextObstacles); // Update the obstacles signal


          // --- Check Game Over ---
          if (collisionDetected) {
              setIsGameActive(false); // Stop the loop by changing signal
              props.onGameOver(score()); // Pass final score
              animationFrameId = null; // Clear ID
              return;
          }

          // Request next frame
          animationFrameId = requestAnimationFrame(gameLoop);
      };

      // Start the loop if it's not already running
       if (animationFrameId === null) {
           animationFrameId = requestAnimationFrame(gameLoop);
       }


      // Cleanup function for this effect instance
      onCleanup(() => {
          if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
          }
      });
  })); // Dependency array for the effect


  return (
    <div class="flex flex-col items-center w-full">
      {/* Different layouts for mobile and desktop */}
      {isMobile() ? (
        // Mobile layout - Compact and fits within viewport
        <div class="w-full flex flex-col" style={{ "max-height": "calc(100vh - 40px)" }}>
          {/* Score in top left with minimal padding */}
          <div class="text-xl text-white self-start p-2" style={{ height: `${MOBILE_SCORE_HEIGHT}px` }}>
            Score: {score()}
          </div>
          
          {/* Game canvas with calculated height */}
          <div class="relative w-full overflow-hidden">
            <canvas 
              ref={canvasRef} 
              class="w-full block" 
              style={{ "touch-action": "none" }} 
            />
          </div>
          
          {/* Divider */}
          <div class="w-full h-px bg-white bg-opacity-20"></div>
          
          {/* Controls area at bottom - smaller and compact */}
          <div class="p-2 bg-black bg-opacity-50 text-white text-center text-sm" 
               style={{ height: `${MOBILE_CONTROL_HEIGHT}px` }}>
            <p>Tap left or right side of the screen to move</p>
          </div>
        </div>
      ) : (
        // Desktop layout - Fixed width with border
        <div class="flex flex-col items-center">
          {/* Score above game area */}
          <div class="mb-4 text-xl text-white">Score: {score()}</div>
          
          {/* Game canvas with fixed width and fancy border */}
          <div 
            class="relative overflow-hidden rounded-lg" 
            style={{ 
              width: `${DESKTOP_GAME_WIDTH}px`,
              "box-shadow": "0 0 0 2px rgba(255,255,255,0.2), 0 0 10px rgba(255,255,255,0.1)"
            }}
          >
            <canvas 
              ref={canvasRef} 
              class="block" 
              style={{ height: "400px", "touch-action": "none" }} 
            />
          </div>
          
          {/* Controls text */}
          <div class="mt-4 text-gray-400 text-center">
            <p>Use left and right arrow keys to move</p>
          </div>
        </div>
      )}
    </div>
  );
}