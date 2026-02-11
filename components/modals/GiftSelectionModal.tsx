import React, { useState } from 'react';
import { Player, Rewards } from '../../types';
import { playSound } from '../../utils/soundManager';

interface GiftSelectionModalProps {
    giver: Player;
    receiver: Player;
    onGiftSelect: (gift: Rewards) => void;
}

const GiftSelectionModal: React.FC<GiftSelectionModalProps> = ({ giver, receiver, onGiftSelect }) => {
    const [moneyGift, setMoneyGift] = useState(0);
    const [healthGift, setHealthGift] = useState(0);
    const [happyGift, setHappyGift] = useState(0);

    const totalGifted = moneyGift + healthGift + happyGift;

    const handleConfirm = () => {
        if (totalGifted > 0) {
            onGiftSelect({
                money: moneyGift,
                health: healthGift,
                happy: happyGift
            });
            playSound('uiClick', 0.5);
        }
    };

    const GiftCounter = ({
        label,
        value,
        setValue,
        icon,
        max,
        step = 1,
        colorClass
    }: {
        label: string,
        value: number,
        setValue: (v: number) => void,
        icon: string,
        max: number,
        step?: number,
        colorClass: string
    }) => (
        <div className="bg-black/30 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</span>
                <span className={`text-xs font-bold ${colorClass}`}>Máx: {max.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-3xl">{icon}</span>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setValue(Math.max(0, value - step))}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-2xl font-black hover:bg-white/10 active:scale-90 transition-all"
                    >-</button>
                    <span className="text-xl font-black text-white min-w-[3rem] text-center">
                        {label === 'Dinero' ? `$${value.toLocaleString()}` : value}
                    </span>
                    <button
                        onClick={() => setValue(Math.min(max, value + step))}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-2xl font-black hover:bg-white/10 active:scale-90 transition-all"
                    >+</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md modal-active animate__animated animate__fadeIn">
            <div className="relative w-full max-w-sm rounded-[2.5rem] p-1 bg-gradient-to-br from-white/20 to-white/5 shadow-2xl animate__animated animate__zoomIn">
                <div className="relative rounded-[2.3rem] px-6 py-8 bg-slate-900 border border-white/10 flex flex-col items-center">

                    {/* Header */}
                    <div className="absolute top-0 transform -translate-y-1/2 bg-fuchsia-600 px-6 py-2 rounded-full shadow-lg">
                        <span className="text-xs font-black uppercase tracking-widest text-white">🎁 TU REGALO</span>
                    </div>

                    <div className="text-5xl mb-4 mt-2">🎂</div>

                    <h2 className="text-xl font-black text-white uppercase italic text-center mb-1">
                        Turno de <span className="text-fuchsia-400">{giver.name}</span>
                    </h2>
                    <p className="text-white/50 text-xs font-bold uppercase mb-6">
                        ¿Qué le regalarás a <span className="text-yellow-400">{receiver.name}</span>?
                    </p>

                    <div className="w-full space-y-3 mb-8">
                        <GiftCounter
                            label="Dinero"
                            value={moneyGift}
                            setValue={setMoneyGift}
                            icon="💰"
                            max={giver.actual.money}
                            step={1000}
                            colorClass="text-emerald-400"
                        />
                        <GiftCounter
                            label="Salud"
                            value={healthGift}
                            setValue={setHealthGift}
                            icon="❤️"
                            max={giver.actual.health}
                            colorClass="text-rose-400"
                        />
                        <GiftCounter
                            label="Felicidad"
                            value={happyGift}
                            setValue={setHappyGift}
                            icon="😊"
                            max={giver.actual.happy}
                            colorClass="text-orange-400"
                        />
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={totalGifted <= 0}
                        className={`
                            w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
                            ${totalGifted > 0
                                ? 'bg-fuchsia-600 shadow-[0_4px_20px_rgba(192,38,211,0.4)] text-white hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'}
                        `}
                    >
                        {totalGifted > 0 ? 'Confirmar Regalos' : 'Debes regalar algo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GiftSelectionModal;
