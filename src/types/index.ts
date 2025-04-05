// src/types.ts
export type Career = {
  id: string;
  name: string;
  avatar: string;
  obstacles: string[];
};

export type GameState = "selection" | "playing" | "gameOver";