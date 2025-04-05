import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, createEffect, Show } from "solid-js";
import { createMediaQuery } from "@solid-primitives/media";
import GameContainer from "~/components/GameContainer";
import SpaceCanvas from "~/components/SpaceCanvas";
import LoadingAnimation from "~/components/LoadingAnimation";
import clsx from "clsx";

// Create a global signal to track game state that can be accessed across components
export const [globalGameState, setGlobalGameState] = createSignal("selection");

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => {
    return {
      globalGameState: globalGameState(),
    };
  },
});

function RouteComponent() {
  const isMobile = createMediaQuery("(max-width: 768px)");
  const [isCanvasLoaded, setIsCanvasLoaded] = createSignal(false);

  // Handle when SpaceCanvas is fully loaded
  const handleCanvasLoaded = () => {
    setIsCanvasLoaded(true);
  };

  return (
    <main class="min-h-screen text-primary p-4 relative flex justify-center items-center">
      {/* Background space canvas (always render, but hidden until loaded) */}
      <div
        class="absolute inset-0 -z-10"
        style={{ opacity: isCanvasLoaded() ? 1 : 0 }}
      >
        <SpaceCanvas onLoaded={handleCanvasLoaded} />
      </div>

      {/* Show loading animation or content based on load state */}
      <Show when={isCanvasLoaded()} fallback={<LoadingAnimation />}>
        <div class={`relative z-10 fade-in w-full`}>
          <h1
            class={clsx(
              "text-4xl font-bold text-center mb-8 bungee-spice-regular animate-blink",
              isMobile() && globalGameState() === "playing" && "text-xl mb-2"
            )}
          >
            Life Is A Struggle!
          </h1>
          <div class="flex items-center justify-center">
            <GameContainer />
          </div>
        </div>
      </Show>
    </main>
  );
}
