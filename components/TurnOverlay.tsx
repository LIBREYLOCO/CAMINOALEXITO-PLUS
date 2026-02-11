import React, { Dispatch, useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { Action } from '../state/gameReducer';
import { motivationalQuotes } from '../constants';
import { playSound, playInspirationalTheme } from '../utils/soundManager';

interface TurnOverlayProps {
    player: Player;
    onStartTurn: () => void;
    dispatch: Dispatch<Action>;
    canInteract?: boolean;
}

const TurnOverlay: React.FC<TurnOverlayProps> = ({ player, onStartTurn, dispatch, canInteract = true }) => {
    const [quote, setQuote] = useState<{ text: string; author: string; book: string; } | null>(null);
    const [showQuote, setShowQuote] = useState(false);
    const [showAttribution, setShowAttribution] = useState(false);
    const quoteWords = useRef<string[]>([]);

    useEffect(() => {
        // Approximately 30% chance to show a quote (roughly 1 in 3-4 turns)
        if (Math.random() < 0.3) {
            setShowQuote(true);
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            setQuote(randomQuote);
            quoteWords.current = randomQuote.text.split(" ");

            // Play magical theme
            playInspirationalTheme();

            // Approximately 50% chance to show attribution for the quote
            setShowAttribution(Math.random() < 0.5);
        } else {
            setShowQuote(false);
        }
    }, []);

    // Effect for typewriter sound during animation
    useEffect(() => {
        if (showQuote && quoteWords.current.length > 0) {
            let wordIndex = 0;
            const interval = setInterval(() => {
                if (wordIndex < quoteWords.current.length) {
                    // Play subtle tick for every word appearance
                    playSound('typewriter', 0.2);
                    wordIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 80); // Corresponds to animation delay in JSX (0.08s)

            return () => clearInterval(interval);
        }
    }, [showQuote]);

    const handleStart = () => {
        if (!canInteract) return;
        playSound('uiClick', 0.4);
        onStartTurn();
    }

    const handleEndGame = () => {
        playSound('uiClick', 0.3);
        dispatch({ type: 'END_GAME_EARLY' });
    }

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300">
            <div className="text-center p-8">
                <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl border-4 bg-black overflow-hidden border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {(player.icon.startsWith('/') || player.icon.includes('.png') || player.icon.includes('data:')) ? (
                        <img src={player.icon} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        player.icon
                    )}
                </div>
                <h2 className="text-white/60 font-bold text-xs uppercase tracking-[0.3em] mb-2">TURNO DE</h2>
                <h1 className="text-5xl font-black text-white mb-4 uppercase italic drop-shadow-lg">{player.name}</h1>

                {showQuote && quote ? (
                    <div className="max-w-md mx-auto my-8 min-h-[8rem] flex flex-col items-center justify-center">
                        <p className="text-2xl italic text-white/90 font-light leading-tight">
                            "{quoteWords.current.map((word, i) => (
                                <span key={i} className="inline-block animate__animated animate__fadeInUp" style={{ animationDelay: `${i * 0.08}s` }}>
                                    {word}&nbsp;
                                </span>
                            ))}"
                        </p>
                        {showAttribution && (
                            <p
                                className="text-base text-white/75 mt-4 text-center w-full animate__animated animate__fadeIn"
                                style={{ animationDelay: `${quoteWords.current.length * 0.08 + 0.5}s` }}
                            >
                                — {quote.author}, <em>{quote.book}</em>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="my-8 min-h-[8rem]"></div>
                )}

                {canInteract ? (
                    <button onClick={handleStart} className="bg-white text-slate-900 px-12 py-4 rounded-full font-black text-lg uppercase shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition animate-pulse">¡JUGAR!</button>
                ) : (
                    <div className="bg-slate-800/80 text-white/50 px-12 py-4 rounded-full font-bold text-sm uppercase shadow-inner border border-white/10 flex items-center gap-3">
                        <span className="animate-spin">⏳</span> Esperando a {player.name}...
                    </div>
                )}
            </div>
            <button
                onClick={handleEndGame}
                className="absolute bottom-4 right-4 bg-red-900/50 border border-red-500/50 text-white/80 font-bold text-[10px] uppercase transition-all px-4 py-2 rounded-full shadow hover:bg-red-800/80 hover:text-white"
            >
                Finalizar Partida
            </button>
        </div>
    );
};

export default TurnOverlay;