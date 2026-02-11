import React, { useEffect } from 'react';
import { playSound } from '../utils/soundManager';
import { AnimationType } from '../types';

interface GameAnimationsProps {
    type: AnimationType;
    onComplete: () => void;
    data?: any;
}

const GameAnimations: React.FC<GameAnimationsProps> = ({ type, onComplete, data }) => {
    useEffect(() => {
        if (!type) return;

        let soundName = 'uiClick';
        let duration = 1500;

        if (type === 'GRADUATION') {
            soundName = 'winGame';
            duration = 4000;
        } else if (type === 'RETO') {
            soundName = 'turnStart';
            duration = 2000;
        } else if (type === 'EXPERTISE') {
            soundName = 'uiClick';
            duration = 2000;
        }

        playSound(soundName as any, 0.7);

        const timer = setTimeout(() => {
            onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [type, onComplete]);

    if (!type) return null;
    if (type === 'GRADUATION') {
        const bonus = data?.bonus || 0;
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden animate__animated animate__fadeIn">
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full ${i % 2 === 0 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{
                                top: '-20px',
                                left: `${Math.random() * 100}%`,
                                animation: `fall ${2 + Math.random() * 2}s linear infinite`,
                                animationDelay: `${Math.random()}s`
                            }}
                        ></div>
                    ))}
                </div>

                <div className="relative z-10 flex flex-col items-center animate__animated animate__zoomInDown text-center p-6 max-w-2xl">
                    <div className="text-9xl mb-6 filter drop-shadow-[0_0_30px_rgba(255,215,0,0.6)] animate-pulse">
                        🌟
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-white to-amber-500 uppercase italic tracking-wider drop-shadow-lg mb-2">
                        ¡Has Trascendido!
                    </h2>

                    <p className="text-xl md:text-2xl text-white font-bold mb-8 animate__animated animate__fadeIn animate__delay-1s px-4">
                        {data?.message || "¡Felicidades por tu evolución!"}
                    </p>

                    {data?.bonus > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-3xl border border-white/20 animate__animated animate__pulse animate__infinite shadow-2xl mb-8">
                            <p className="text-sm md:text-base text-blue-200 font-black uppercase tracking-[0.3em] mb-1">
                                💰 NUEVO INGRESO PASIVO 💰
                            </p>
                            <p className="text-5xl md:text-7xl text-yellow-400 font-black drop-shadow-md">
                                +${data.bonus.toLocaleString()}
                            </p>
                        </div>
                    )}

                    <div className="animate__animated animate__fadeInUp animate__delay-2s flex items-center gap-3 text-white/60 bg-black/40 px-6 py-2 rounded-full border border-white/10">
                        <span className="text-xl">🏃‍♂️</span>
                        <span className="text-sm font-black uppercase tracking-widest">Vuelves al camino principal</span>
                    </div>
                </div>

                {/* ... styles ... */}

                <style>
                    {`
                    @keyframes fall {
                        to { transform: translateY(100vh) rotate(360deg); }
                    }
                    `}
                </style>
            </div>
        );
    }

    if (type === 'RETO') {
        return (
            <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-sm animate__animated animate__fadeIn animate__faster"></div>
                <div className="relative animate__animated animate__jackInTheBox">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-3xl opacity-60 animate-pulse"></div>
                    <div className="text-center transform rotate-6">
                        <div className="text-8xl mb-2 filter drop-shadow-xl animate-bounce">⚡</div>
                        <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase italic tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                            ¡RETO!
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'EXPERTISE') {
        return (
            <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm animate__animated animate__fadeIn animate__faster"></div>
                <div className="relative animate__animated animate__fadeInUp">
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                    <div className="text-center">
                        <div className="text-8xl mb-2 filter drop-shadow-xl animate-pulse">🧠</div>
                        <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                            EXPERTISE
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback or Generic Card Explosion
    if (type === 'CARD_EXPLOSION') {
        return (
            <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
                <div className="absolute inset-0 bg-white/20 animate__animated animate__fadeOut animate__fast"></div>
                <div className="relative animate__animated animate__zoomIn animate__faster">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="text-4xl md:text-6xl font-black text-white italic uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] transform -rotate-12">
                        ¡Sorpresa!
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default GameAnimations;
