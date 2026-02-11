import React, { useState } from 'react';
import { Tile } from '../../types';
import { playSound } from '../../utils/soundManager';
import AnimatedDie from '../AnimatedDie';

interface HospitalModalProps {
    tile: Tile;
    onResolve: (result: { cost: number, health: number, happy: number }) => void;
    canInteract?: boolean;
}

const HospitalModal: React.FC<HospitalModalProps> = ({ tile, onResolve, canInteract = true }) => {
    const [dieValue, setDieValue] = useState<number | string>("🎲");
    const [isRolled, setIsRolled] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [result, setResult] = useState<{ cost: number, health: number, happy: number } | null>(null);

    const isVacation = tile.n === "VACACIONES";
    const bgGradient = isVacation ? "from-cyan-500/90 to-blue-600/90" : "from-rose-500/90 to-red-700/90";
    const icon = isVacation ? "🏖️" : "🏥";
    const title = isVacation ? "¡Vacaciones!" : "Hospital";

    // Initial cost/desc before rolling
    const desc = isVacation
        ? "Tira el dado. Por cada punto, pagas $1,000 pero ganas 1 de Felicidad."
        : "Tira el dado. Por cada punto, pagas $1,000 pero recuperas 1 de Salud.";

    const rollDie = () => {
        if (isRolling || !canInteract) return;
        playSound('diceRoll', 0.7);
        setIsRolling(true);

        setTimeout(() => {
            const d = Math.floor(Math.random() * 6) + 1;
            setDieValue(d);

            const cost = d * 1000;
            const health = isVacation ? 0 : d;
            const happy = isVacation ? d : 0;

            setResult({ cost, health, happy });
            setIsRolled(true);
            setIsRolling(false);

            playSound('uiClick', 0.5);
        }, 1000);
    };

    const handleResolve = () => {
        if (!result || !canInteract) return;
        playSound('uiClick', 0.3);
        onResolve(result);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm z-[100] modal-active animate__animated animate__fadeIn">
            <div className={`
                relative w-full max-w-sm rounded-[2rem] p-1 
                bg-gradient-to-br from-white/20 to-white/5 
                shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                animate__animated animate__zoomIn
            `}>
                <div className={`
                    relative rounded-[1.8rem] px-8 py-8
                    bg-gradient-to-br ${bgGradient} 
                    backdrop-blur-md border border-white/10
                    flex flex-col items-center text-center
                `}>
                    <div className="text-6xl mb-4 filter drop-shadow-xl animate-bounce">
                        {icon}
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase italic mb-2 text-shadow-md">
                        {title}
                    </h2>

                    <p className="text-white/90 text-xs font-bold mb-6 leading-relaxed max-w-[80%]">
                        {desc}
                    </p>

                    {/* Dice Container */}
                    <div className="bg-black/20 backdrop-blur-sm border border-white/10 p-6 rounded-3xl mb-6 w-full flex flex-col items-center justify-center min-h-[120px] shadow-inner">
                        <AnimatedDie value={dieValue} isRolling={isRolling} />
                        <div className={`mt-4 text-xs font-black uppercase tracking-wider transition-all duration-300 ${isRolled ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
                            {result ? `Pagas $${result.cost.toLocaleString()} | +${isVacation ? result.happy + ' 😄' : result.health + ' ❤️'}` : "..."}
                        </div>
                    </div>

                    {!isRolled ? (
                        <button onClick={rollDie} disabled={isRolling || !canInteract}
                            className={`w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95 border-b-4 border-slate-300 disabled:opacity-50 ${!canInteract ? 'cursor-not-allowed is-wait' : ''}`}>
                            {isRolling ? 'Lanzando...' : (canInteract ? '🎲 Lanzar Dado' : 'Esperando...')}
                        </button>
                    ) : (
                        <button onClick={handleResolve} disabled={!canInteract}
                            className={`w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform active:scale-95 border-b-4 border-yellow-600 animate__animated animate__pulse animate__infinite ${!canInteract ? 'opacity-50 cursor-not-allowed animate-none' : ''}`}>
                            {canInteract ? 'ACEPTAR' : 'Esperando...'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HospitalModal;