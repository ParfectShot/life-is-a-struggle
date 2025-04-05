// src/components/GameOver.tsx

interface GameOverProps {
  score: number; // Score is passed as a plain number here
  onRestart: () => void;
}

export default function GameOver(props: GameOverProps) {
  return (
    <div class="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg text-white"> {/* Added text color */}
      <h2 class="text-2xl font-bold mb-4">Game Over</h2>
      {/* Access score directly as it's passed after game over */}
      <p class="text-xl mb-6">Your score: {props.score}</p>
      <p class="text-gray-400 mb-8 text-center">Life is full of challenges, but you survived for a while!</p>
      <button
        onClick={props.onRestart}
        class="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}