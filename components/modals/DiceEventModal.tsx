import React, { useState } from 'react';
import { Tile, Rewards } from '../../types';
import AnimatedDie from '../AnimatedDie';
import { playSound } from '../../utils/soundManager';

interface DiceEventModalProps {
    tile: Tile;
    onResolve: (rewards: Rewards) => void;
}

const DiceEventModal: React.FC<DiceEventModalProps> = ({ tile, onResolve }) => {
    const [dieValue, setDieValue] = useState<number | string>("🎲");
    const [resultText, setResultText] = useState("");
    const [rewards, setRewards] = useState<Rewards>({});
    const [isRolled, setIsRolled] = useState(false);
    const [isRolling, setIsRolling] = useState(false);

    const rollEventDie = () => {
        if (isRolling) return;
        playSound('diceRoll', 0.7);
        setIsRolling(true);
        setResultText("");

        setTimeout(() => {
            const d = Math.floor(Math.random() * 6) + 1;
            setDieValue(d);

            let r: Rewards = {};
            let text = "";
            const tileName = tile.n;

            if (tileName === "Restaurante" || tileName === "Demanda" || tileName === "Impuestos") {
                r = { money: -1000 * d };
                text = `Pagas $${(1000 * d).toLocaleString()}`;
            } else if (tileName === "Causa Social") {
                r = { money: 1000 * d };
                text = `Ganas $${(1000 * d).toLocaleString()} por tu buena causa.`;
            } else if (tileName === "Contaminación" || tileName === "Alerta Pandemia") {
                r = { health: -d };
                text = `Pierdes ${d} de Salud`;
            } else if (tileName === "Casino") {
                r = { money: -1000 * d, happy: -d };
                text = `Pagas $${(1000 * d).toLocaleString()} y pierdes ${d} de Felicidad`;
            } else if (tileName === "Familia") {
                r = { money: 1000 * d, health: d };
                text = `Ganas $${(1000 * d).toLocaleString()} y ${d} de Salud`;
            }

            setRewards(r);
            setResultText(text);
            setIsRolled(true);
            setIsRolling(false);

            if (r.money && r.money > 0) playSound('moneyGain', 0.5);
            else if (r.money && r.money < 0) playSound('moneyLoss', 0.5);
            else playSound('uiClick', 0.5);

        }, 1000);
    };

    const handleResolve = () => {
        playSound('uiClick', 0.3);
        onResolve(rewards);
    };

    // Determine Gradient based on Tile Type (Good/Bad/Neutral)
    // Determine Theme based on Tile Name
    let bgGradient = "from-purple-600/90 to-indigo-900/90";
    let icon = "🎲";
    let themeBadge = "EVENTO";

    switch (tile.n) {
        case "Restaurante":
            bgGradient = "from-orange-500/90 to-red-600/90";
            icon = "🍽️";
            themeBadge = "LA CUENTA";
            break;
        case "Alerta Pandemia":
            bgGradient = "from-black via-red-900 to-black";
            icon = "☣️";
            themeBadge = "☣️ PELIGRO MORTAL ☣️";
            break;
        case "Contaminación":
            bgGradient = "from-lime-600/90 to-emerald-800/90";
            icon = "😷";
            themeBadge = "ALERTA SANITARIA";
            break;
        case "Impuestos":
        case "Demanda":
            bgGradient = "from-slate-700/90 to-slate-900/90";
            icon = "💸";
            themeBadge = "COBRO";
            break;
        case "Causa Social":
        case "Familia":
            bgGradient = "from-pink-500/90 to-rose-600/90";
            icon = "❤️";
            themeBadge = "BUENA VIBRA";
            break;
        case "Casino":
            bgGradient = "from-fuchsia-600/90 to-purple-800/90";
            icon = "🎰";
            themeBadge = "JUEGO";
            break;
        default:
            bgGradient = "from-indigo-600/90 to-blue-800/90";
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-active animate__animated animate__fadeIn">
            <div className={`
                relative w-full max-w-sm rounded-[2rem] p-1 
                bg-gradient-to-br from-white/20 to-white/5 
                shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                animate__animated animate__zoomIn
            `}>
                <div className={`
                    relative rounded-[1.8rem] px-6 py-8 
                    bg-gradient-to-br ${bgGradient} 
                    backdrop-blur-md border border-white/10
                    flex flex-col items-center text-center
                `}>
                    {/* Header Badge */}
                    <div className={`absolute top-0 transform -translate-y-1/2 bg-black/60 backdrop-blur-md border border-red-500/50 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.5)] ${tile.n === "Alerta Pandemia" ? 'animate-horror' : ''}`}>
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${tile.n === "Alerta Pandemia" ? 'text-red-500' : 'text-white/90'}`}>
                            {themeBadge}
                        </span>
                    </div>

                    <div className={`text-6xl mb-2 mt-4 filter drop-shadow-[0_0_20px_rgba(255,0,0,1)] ${tile.n === "Alerta Pandemia" ? 'animate-horror-shake' : 'animate-bounce'}`}>
                        {tile.n === "Alerta Pandemia" ? "☣️" : icon}
                    </div>

                    <h2 className={`text-3xl font-black text-white uppercase italic mb-2 text-shadow-lg ${tile.n === "Alerta Pandemia" ? 'animate-horror text-red-600' : ''}`}>
                        {tile.n.toUpperCase()}
                    </h2>
                    <p className="text-white/80 text-xs mb-8 font-bold max-w-[80%] leading-relaxed">{tile.d}</p>

                    {/* Dice Container */}
                    <div className="bg-black/20 backdrop-blur-sm border border-white/10 p-6 rounded-3xl mb-8 w-full flex flex-col items-center justify-center min-h-[140px] shadow-inner">
                        <AnimatedDie value={dieValue} isRolling={isRolling} />
                        <div className={`mt-4 text-sm font-black uppercase tracking-wider transition-all duration-200 ${isRolled ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
                            {resultText || "..."}
                        </div>
                    </div>

                    {!isRolled ? (
                        <button onClick={rollEventDie} disabled={isRolling}
                            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100 border-b-4 border-slate-300">
                            {isRolling ? 'Lanzando...' : '🎲 Lanzar Dado'}
                        </button>
                    ) : (
                        <button onClick={handleResolve}
                            className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-sm uppercase shadow-[0_10px_20px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform active:scale-95 border-b-4 border-yellow-600 animate__animated animate__pulse animate__infinite">
                            Continuar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiceEventModal;