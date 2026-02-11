import React from 'react';
import { playSound, initAudio } from '../utils/soundManager';
import monedaImg from '../assets/moneda.png';

interface StartScreenProps {
    onStart: (playerCount: number) => void;
    hasSavedGame?: boolean;
    onResume?: () => void;
    onOnline?: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, hasSavedGame, onResume, onOnline }) => {
    const handleStartClick = (num: number) => {
        initAudio(); // Unlock audio context on first user interaction
        playSound('uiClick', 0.3);
        onStart(num);
    };

    const handleResumeClick = () => {
        initAudio();
        if (onResume) onResume();
    };

    const handleOnlineClick = () => {
        initAudio();
        if (onOnline) onOnline();
    }

    return (
        <div id="screen-start" className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Fondo Dinámico */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-[#050b14]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 animate-pulse" style={{ animationDuration: '8s' }}></div>

            {/* Contenedor del Logo */}
            <div className="relative z-10 mb-10 flex flex-col items-center justify-center min-h-[160px]">
                <div className="mb-8 animate-[spin_4s_linear_infinite] drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]">
                    <img src={monedaImg} alt="Moneda" className="w-64 h-64 object-contain" />
                </div>
                <img
                    src="logo.png"
                    alt="Logo Camino al Éxito"
                    className="w-72 md:w-96 max-h-[30vh] object-contain drop-shadow-[0_0_35px_rgba(6,182,212,0.3)] animate__animated animate__zoomIn"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = document.getElementById('logo-fallback');
                        if (fallback) fallback.style.display = 'block';
                    }}
                />

                {/* Fallback de Texto (Visible solo si falla la imagen) */}
                <div id="logo-fallback" className="hidden text-center animate__animated animate__fadeIn">
                    <h1 className="text-6xl font-black text-cyan-400 italic drop-shadow-lg leading-tight">
                        CAMINO AL<br />ÉXITO
                    </h1>
                    <div className="mt-2 inline-block bg-cyan-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        PLUS ONLINE
                    </div>
                </div>
            </div>

            <div className="w-full max-w-xs mb-8 z-10">
                <button
                    onClick={handleOnlineClick}
                    className="w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-slate-950 border-2 border-cyan-500/50 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:scale-105 hover:border-cyan-400 active:scale-95"
                >
                    <span>🌐</span> Jugar Online
                </button>
            </div>

            {hasSavedGame && onResume && (
                <div className="w-full max-w-xs mb-8 animate__animated animate__fadeInUp">
                    <button
                        onClick={handleResumeClick}
                        className="btn-gold w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <span>▶</span> Continuar Partida
                    </button>

                    <div className="flex items-center gap-4 my-6 opacity-20">
                        <div className="h-px bg-white flex-grow"></div>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">O</span>
                        <div className="h-px bg-white flex-grow"></div>
                    </div>
                </div>
            )}

            <p className="mb-6 text-[10px] font-black uppercase text-white/40 tracking-[0.3em] relative z-10">Nueva Partida</p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs relative z-10">
                {[1, 2, 3, 4].map(num => (
                    <button
                        key={num}
                        onClick={() => handleStartClick(num)}
                        className={`glass p-6 rounded-2xl text-3xl font-black transition-all duration-300 hover:scale-105 hover:bg-yellow-500/20 active:scale-95 group relative overflow-hidden ${num === 1 ? 'border-yellow-500/40 text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'border-white/10 text-white'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative group-hover:drop-shadow-[0_0_10px_currentColor] transition-all">{num}</span>
                    </button>
                ))}
            </div>

            <div className="absolute bottom-6 flex flex-col items-center gap-1 z-10 opacity-30">
                <p className="text-[10px] text-white font-mono">OFFICIAL BOARD GAME</p>
                <div className="w-8 h-1 bg-yellow-500 rounded-full"></div>
            </div>
        </div>
    );
};

export default StartScreen;