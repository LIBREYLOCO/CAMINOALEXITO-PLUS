import React from 'react';
import { Card } from '../../types';
import { playSound } from '../../utils/soundManager';

interface CardModalProps {
    card: Card;
    category: string;
    onResolve: (success: boolean) => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, category, onResolve }) => {
    // Reto specifically requires peer judgment (Logrado/Fallado)
    const isReto = category.includes("RETO") || !!card.requiresJudgment;
    // Show 2 buttons ONLY for Reto or tagged cards
    const showJudgmentButtons = isReto;

    const handleResolve = (success: boolean) => {
        playSound('uiClick', 0.3);
        onResolve(success);
    };

    // Determine visual style based on category
    let bgGradient = "from-slate-800 to-slate-900";
    let accentColor = "text-white";
    let iconAnimation = "animate-pulse";

    if (category.includes("RETO")) {
        bgGradient = "from-orange-600/90 to-red-800/90";
        accentColor = "text-yellow-300";
        iconAnimation = "animate-bounce";
    } else if (category.includes("EXPERTIS")) {
        bgGradient = "from-blue-600/90 to-cyan-800/90";
        accentColor = "text-cyan-300";
        iconAnimation = "animate-pulse";
    } else if (category.includes("GANASTE") || category.includes("SUERTE")) {
        bgGradient = "from-yellow-500/90 to-amber-700/90";
        accentColor = "text-white";
        iconAnimation = "animate-bounce";
    } else if (category.includes("RUTA")) {
        bgGradient = "from-emerald-600/90 to-teal-800/90";
        accentColor = "text-white";
        iconAnimation = "animate-pulse";
    } else if (category.includes("IMPUESTOS")) {
        bgGradient = "from-slate-700/90 to-red-900/90";
        accentColor = "text-red-200";
        iconAnimation = "animate-shake"; // Custom animation class if exists, or pulse
    } else if (category.includes("COMUNIDAD") || category.includes("POEMA")) {
        bgGradient = "from-pink-500/90 to-rose-700/90";
        accentColor = "text-white";
        iconAnimation = "animate-bounce";
    } else if (category.includes("FELIZ CUMPLEAÑOS")) {
        bgGradient = "from-fuchsia-500/90 to-purple-600/90";
        accentColor = "text-yellow-300";
        iconAnimation = "animate-tada"; // animate.css tada
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[100] modal-active animate__animated animate__fadeIn">
            <div className={`
                relative w-full max-w-md rounded-[2rem] p-1 
                bg-gradient-to-br from-white/20 to-white/5 
                shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                animate__animated animate__zoomInUp
            `}>
                {/* Glass Inner Container */}
                <div className={`
                    relative rounded-[1.8rem] px-8 py-10 
                    bg-gradient-to-br ${bgGradient} 
                    backdrop-blur-md border border-white/10
                    flex flex-col items-center text-center
                `}>
                    {/* Header Badge */}
                    <div className="absolute top-0 transform -translate-y-1/2 bg-black/40 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full shadow-lg">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/90">
                            {category}
                        </span>
                    </div>

                    {/* Icon */}
                    <div className={`text-8xl md:text-9xl mb-6 filter drop-shadow-2xl ${iconAnimation}`}>
                        {card.i || "⭐"}
                    </div>

                    {/* Content */}
                    <div className="mb-8 w-full">
                        <h3 className="text-xl md:text-2xl font-bold leading-normal text-white text-shadow-sm font-sans mb-4 whitespace-pre-line">
                            {card.t}
                        </h3>

                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {typeof card.r?.money === 'number' && card.r.money !== 0 && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm ${card.r.money > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {card.r.money > 0 ? '+' : ''}${card.r.money.toLocaleString()}
                                </span>
                            )}
                            {typeof card.r?.health === 'number' && card.r.health !== 0 && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm ${card.r.health > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {card.r.health > 0 ? '+' : ''}{card.r.health} Salud
                                </span>
                            )}
                            {typeof card.r?.happy === 'number' && card.r.happy !== 0 && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm ${card.r.happy > 0 ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'}`}>
                                    {card.r.happy > 0 ? '+' : ''}{card.r.happy} Felicidad
                                </span>
                            )}
                            {!!card.r?.passive && (
                                <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-500 text-white shadow-sm">
                                    +${card.r.passive.toLocaleString()} Pasivo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full">
                        {showJudgmentButtons ? (
                            <>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">
                                    Los otros jugadores dicen: ¿Logrado o Fallado?
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleResolve(true)}
                                        className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase shadow-[0_4px_0_rgb(6,95,70)] text-sm hover:scale-105 transition-transform active:scale-95 active:shadow-none active:translate-y-1">
                                        ✅ Logrado
                                    </button>
                                    <button onClick={() => handleResolve(false)}
                                        className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase shadow-[0_4px_0_rgb(153,27,27)] text-sm hover:scale-105 transition-transform active:scale-95 active:shadow-none active:translate-y-1">
                                        ❌ Fallado
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button onClick={() => handleResolve(true)}
                                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_rgb(203,213,225)] hover:scale-[1.02] transition-transform active:scale-95 active:shadow-none active:translate-y-1">
                                {category.includes("EXPERTIS") ? "¡Genial!" : "Aceptar"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardModal;