import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: '*', title: 'Global shortcut', desc: 'Hit Ctrl+Shift+Space from anywhere. Roki captures all your monitors in one shot.' },
  { icon: '~', title: 'Streaming responses', desc: 'See the AI response appear in real-time as it streams. No waiting for the whole thing to finish.' },
  { icon: '#', title: 'Multi-display aware', desc: 'Got two monitors? Roki captures both, labels them, and tells the AI which one has your cursor.' },
  { icon: '+', title: 'Pick your model', desc: 'Claude, GPT-4o, Gemini, OpenRouter, or local Ollama. Swap with a single line of code.' },
  { icon: '@', title: 'Light and fast', desc: 'Tauri v2 under the hood. No Electron bloat. Tiny footprint, native performance.' },
  { icon: '^', title: 'Open source', desc: 'MIT licensed. Fork it, modify it, build a startup on it. I don\'t mind.' },
];

const providers = [
  { name: 'Anthropic Claude', gold: true },
  { name: 'OpenAI GPT-4o', gold: true },
  { name: 'Google Gemini', gold: true },
  { name: 'OpenRouter', gold: false },
  { name: 'Ollama', gold: false },
];

export default function App() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            setVisibleCards((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.1 },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-space">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-[1200px] mx-auto px-10 py-5">
        <div className="text-[22px] font-bold tracking-tight">
          rok<span className="text-gold">i</span>
        </div>
        <ul className="flex items-center gap-8 list-none">
          {['Features', 'Providers', 'Get Started'].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm font-medium text-slate-custom no-underline hover:text-space transition-colors"
              >
                {item}
              </a>
            </li>
          ))}
          <li>
            <a
              href="https://github.com/anomalyco/roki"
              target="_blank"
              className="text-sm font-medium text-slate-custom no-underline hover:text-space transition-colors"
            >
              GitHub
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-10 pt-24 pb-20 max-w-[800px] mx-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-warm-white rounded-full text-xs text-slate-custom mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          Now available for Windows
        </div>
        <h1 className="text-[60px] font-bold tracking-tight leading-[1.1] mb-5 text-space max-md:text-4xl">
          An AI companion that <em className="not-italic text-gold">sees</em> your screen
        </h1>
        <p className="text-xl text-slate-custom max-w-[600px] leading-relaxed mb-10 max-md:text-lg">
          Press a shortcut, ask a question. Roki captures your screen, sends it to an AI model, and streams the answer back. Like having a copilot that actually knows what you're looking at.
        </p>
        <div className="flex gap-3 mb-16 max-md:flex-col max-md:w-full">
          <a
            href="#get-started"
            className="inline-block px-7 py-3 rounded-full text-sm font-semibold no-underline bg-space text-white hover:bg-space-light hover:-translate-y-0.5 transition-all max-md:text-center"
          >
            Get Started
          </a>
          <a
            href="https://github.com/anomalyco/roki"
            target="_blank"
            className="inline-block px-7 py-3 rounded-full text-sm font-semibold no-underline border border-space text-space hover:bg-space hover:text-white transition-all max-md:text-center"
          >
            View on GitHub
          </a>
        </div>
        <div className="w-full max-w-[640px] rounded-[16px] overflow-hidden shadow-[0_8px_40px_rgba(15,23,34,0.08)] animate-float">
          <img src="../../../media/rocky.gif" alt="Roki demo" className="w-full block" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-10 py-24 max-w-[1100px] mx-auto">
        <p className="text-xs font-semibold tracking-widest text-gold mb-3 uppercase">Features</p>
        <h2 className="text-4xl font-bold tracking-tight text-space mb-4">Screen-aware AI, right in your tray</h2>
        <p className="text-lg text-slate-custom max-w-[560px] leading-relaxed">
          Works with any model you want. Claude, GPT-4o, Gemini, or run it locally with Ollama.
        </p>

        <div className="grid grid-cols-3 gap-6 mt-16 max-md:grid-cols-1">
          {features.map((f, i) => (
            <div
              key={i}
              ref={(el) => { cardRefs.current[i] = el; }}
              data-index={i}
              className={`p-8 bg-warm-white rounded-[16px] transition-all duration-300 hover:bg-white hover:shadow-[0_4px_24px_rgba(15,23,34,0.06)] hover:-translate-y-0.5 ${
                visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              style={{ transitionTimingFunction: 'ease-out' }}
            >
              <div className="w-11 h-11 rounded-xl bg-space flex items-center justify-center text-xl text-gold mb-5">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-space">{f.title}</h3>
              <p className="text-sm text-slate-custom leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="providers" className="flex flex-wrap gap-3 mt-8">
          {providers.map((p) => (
            <span
              key={p.name}
              className={`px-5 py-2 rounded-full text-sm font-medium ${
                p.gold ? 'bg-[rgba(232,141,42,0.1)] text-gold' : 'bg-warm-white text-slate-custom'
              }`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="px-10 py-24 max-w-[1100px] mx-auto">
        <div className="bg-space rounded-[16px] py-20 px-24 text-center max-md:px-6 max-md:py-10 max-md:rounded-xl">
          <p className="text-xs font-semibold tracking-widest text-gold mb-3 uppercase">Get Started</p>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Ready to meet Roki?</h2>
          <p className="text-lg text-white/60 max-w-[560px] mx-auto leading-relaxed">
            Clone the repo, drop in your API key, and you're off. Takes about 2 minutes.
          </p>
          <a
            href="https://github.com/anomalyco/roki"
            target="_blank"
            className="inline-block mt-9 px-10 py-4 rounded-full text-base font-semibold no-underline bg-gold text-white hover:bg-gold-light hover:-translate-y-0.5 transition-all"
          >
            Clone on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-10 py-10 text-xs text-slate-light">
        MIT licensed. Originally inspired by{' '}
        <a href="https://github.com/farzaa/clicky" className="text-slate-custom no-underline hover:text-space">Clicky</a>{' '}
        by <a href="https://x.com/farzatv" className="text-slate-custom no-underline hover:text-space">Farza</a>.
      </footer>
    </div>
  );
}
