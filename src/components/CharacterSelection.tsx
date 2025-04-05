// src/components/CharacterSelection.tsx
import { For } from "solid-js";
import type { Career } from "../types"; // Assuming path

interface CharacterSelectionProps {
  careers: Career[];
  onSelect: (career: Career) => void;
}

export default function CharacterSelection(props: CharacterSelectionProps) {
  return (
    <div class="flex flex-col items-center">
      <h2 class="text-2xl font-bold mb-6 text-secondary-foreground text-center">
        Choose Your Struggle Wisely
      </h2>{" "}
      {/* Adjusted text color */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
        <For each={props.careers}>
          {(career) => (
            <button
              onClick={() => props.onSelect(career)}
              class="flex items-center justify-center p-4 text-white border border-border rounded-full hover:bg-gray-700 transition-colors "
              style={{
                background: `radial-gradient(circle, #2D2D2D 0%, #1A1A1A 100%)`,
              }}
            >
              <span class="text-4xl mb-2">{career.avatar}</span>
              <span class="text-xl font-medium">{career.name}</span>
            </button>
          )}
        </For>
      </div>
      <p class="mt-8 text-center text-gray-400">
        Navigate through life challenges and survive as long as possible!
      </p>
    </div>
  );
}
