import DinoGame from './components/DinoGame';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-blue-900">
      <h1 className="text-4xl font-black text-center mb-8 text-white font-mono">Botnik Game</h1>
      <DinoGame />
      <div className="text-center mt-8 text-gray-200">
        <p>Press spacebar or click to jump</p>
        <p>Avoid the bots and score points!</p>
        <p className="mt-2 text-gray-300">Press F to toggle fullscreen, ESC to exit</p>
      </div>
    </main>
  );
}
