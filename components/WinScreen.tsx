import React, { Dispatch, useState, useEffect } from 'react';
import { Player } from '../types';
import { Action } from '../state/gameReducer';
import PlayerStatusCard from './PlayerStatusCard';
import { playSound } from '../utils/soundManager';
import { generateMentorFeedback } from '../utils/geminiService';

interface WinScreenProps {
    winner: Player;
    allPlayers: Player[];
    dispatch: Dispatch<Action>;
}

const Firework: React.FC<{ left: string; top: string; delay?: string }> = ({ left, top, delay }) => (
    <div className="firework" style={{ left, top, animationDelay: delay }} />
);

const WinScreen: React.FC<WinScreenProps> = ({ winner, allPlayers, dispatch }) => {
    const [mentorFeedback, setMentorFeedback] = useState<string | null>(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const calculateSuccess = (p: Player): number => {
        const m = Math.min(Math.floor(p.actual.money / 1000), p.metas.d);
        const h = Math.min(p.actual.health, p.metas.s);
        const ha = Math.min(p.actual.happy, p.metas.h);
        return p.metas.t + m + h + ha;
    }

    const otherPlayers = allPlayers
        .filter(p => p.id !== winner.id)
        .sort((a, b) => calculateSuccess(b) - calculateSuccess(a));

    const midPoint = Math.ceil(otherPlayers.length / 2);
    const leftPlayers = otherPlayers.slice(0, midPoint);
    const rightPlayers = otherPlayers.slice(midPoint);

    const handleReset = () => {
        playSound('uiClick', 0.4);
        dispatch({ type: 'RESET_GAME' });
    }

    const handleGetFeedback = async () => {
        if (isLoadingFeedback) return;
        playSound('uiClick', 0.4);
        setIsLoadingFeedback(true);
        try {
            const feedback = await generateMentorFeedback(winner);
            setMentorFeedback(feedback);
        } catch (error) {
            console.error(error);
            setMentorFeedback("Los mentores están meditando en silencio. Intenta de nuevo.");
        } finally {
            setIsLoadingFeedback(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center p-6 overflow-y-auto custom-scroll modal-active">
            <div className="absolute inset-0 opacity-50 pointer-events-none">
                <Firework left="20%" top="30%" />
                <Firework left="80%" top="20%" delay="0.5s" />
                <Firework left="50%" top="50%" delay="0.2s" />
                <Firework left="30%" top="70%" delay="0.7s" />
                <Firework left="70%" top="60%" delay="0.4s" />
            </div>

            <div className="z-10 animate__animated animate__zoomInDown relative w-full pt-8 pb-12 max-w-6xl mx-auto">
                <div className="text-9xl mb-4">🏆</div>
                <h1 className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-[0_0_20px_rgba(241,196,15,0.8)]">¡VICTORIA!</h1>
                <h2 className="text-4xl text-white font-bold mb-6 uppercase italic">{winner.name}</h2>
                <p className="text-gray-300 uppercase tracking-widest text-sm mb-8 max-w-md mx-auto leading-relaxed">
                    Has alcanzado el equilibrio perfecto en tu Fórmula del Éxito.
                </p>

                {/* MENTOR FEEDBACK SECTION */}
                <div className="mb-10 max-w-2xl mx-auto min-h-[120px] flex items-center justify-center">
                    {!mentorFeedback ? (
                        <button
                            onClick={handleGetFeedback}
                            disabled={isLoadingFeedback}
                            className={`
                                relative overflow-hidden group bg-gradient-to-r from-purple-600 to-indigo-600 text-white 
                                px-8 py-4 rounded-xl font-bold text-lg shadow-lg 
                                transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50
                                ${isLoadingFeedback ? 'opacity-80 cursor-wait' : ''}
                            `}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoadingFeedback ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Invocando a los Mentores...
                                    </>
                                ) : (
                                    <>
                                        ✨ Invocar Consejo de los Mentores (IA)
                                    </>
                                )}
                            </span>
                        </button>
                    ) : (
                        <div className="bg-gray-900/80 backdrop-blur-md border border-purple-500/30 p-6 rounded-2xl animate__animated animate__fadeInUp w-full">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">🧙‍♂️</div>
                                <div className="text-left w-full">
                                    <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-2">Mensaje del Mentor</h3>
                                    <p className="text-white text-lg italic leading-relaxed whitespace-pre-line">
                                        {mentorFeedback}
                                    </p>
                                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-1 justify-end">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" clipRule="evenodd" />
                                        </svg>
                                        <span>Powered by Gemini 1.5 Flash</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full mb-10">
                    <h3 className="text-2xl font-bold uppercase tracking-widest text-gray-400 mb-6">Resultados Finales</h3>
                    <div className="flex flex-wrap items-center justify-center gap-4 px-4">
                        {leftPlayers.map(p => (
                            <PlayerStatusCard key={p.id} player={p} isCurrent={false} />
                        ))}

                        <div className="transform scale-110 my-4 md:my-0 z-10 order-first md:order-none shadow-2xl rounded-xl">
                            <PlayerStatusCard player={winner} isCurrent={true} />
                        </div>

                        {rightPlayers.map(p => (
                            <PlayerStatusCard key={p.id} player={p} isCurrent={false} />
                        ))}
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={handleReset} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl uppercase shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:scale-110 hover:shadow-[0_0_80px_rgba(255,255,255,0.8)] transition transform cursor-pointer">
                        Volver a Jugar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinScreen;