import React from 'react';
import { playSound } from '../utils/soundManager';
import AnimatedDie from './AnimatedDie';
import { Motion } from '@capacitor/motion';

interface ControlsProps {
    dice: [number, number];
    isRolling: boolean;
    disabled: boolean;
    inRoute: boolean;
    onRoll: () => void;
}

const Controls: React.FC<ControlsProps> = ({ dice, isRolling, disabled, inRoute, onRoll }) => {
    const lastScrollTime = React.useRef(0);

    const handleRollClick = () => {
        if (!disabled && !isRolling) {
            playSound('diceRoll', 0.7);
            onRoll();
        }
    };

    React.useEffect(() => {
        let lastX: number | null = null;
        let lastY: number | null = null;
        let lastZ: number | null = null;
        let lastUpdate = 0;
        const SHAKE_THRESHOLD = 15; // Sensibilidad de la agitación

        const handleAccel = (event: any) => {
            const acceleration = event.acceleration;
            if (!acceleration) return;

            const curTime = Date.now();
            if ((curTime - lastUpdate) > 100) {
                const diffTime = (curTime - lastUpdate);
                lastUpdate = curTime;

                const x = acceleration.x || 0;
                const y = acceleration.y || 0;
                const z = acceleration.z || 0;

                if (lastX !== null && lastY !== null && lastZ !== null) {
                    const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

                    if (speed > 800) { // Se detectó agitación
                        const now = Date.now();
                        // Cooldown de 2 segundos para evitar múltiples triggers
                        if (now - lastScrollTime.current > 2000) {
                            lastScrollTime.current = now;
                            if (!disabled && !isRolling) {
                                handleRollClick();
                            }
                        }
                    }
                }

                lastX = x;
                lastY = y;
                lastZ = z;
            }
        };

        let listener: any = null;

        const startListening = async () => {
            try {
                // En iOS es necesario pedir permisos para los sensores de movimiento
                const permission = await (Motion as any).requestPermissions();
                if (permission.accel === 'granted') {
                    listener = await Motion.addListener('accel', handleAccel);
                }
            } catch (err) {
                console.error("Error al iniciar sensores:", err);
            }
        };

        startListening();

        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, [disabled, isRolling]);

    return (
        <div className="p-6 bg-slate-800 rounded-t-[3rem] border-t border-white/10 flex flex-col items-center shadow-[0_-10px_50px_rgba(0,0,0,0.6)] z-20 shrink-0">
            <div className="flex gap-6 mb-4 h-16 items-center">
                <AnimatedDie value={dice[0]} isRolling={isRolling} size="lg" />
                {inRoute ? (
                    <div className="w-16 h-16 bg-black/20 border border-white/10 text-white/40 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner opacity-80">-</div>
                ) : (
                    <AnimatedDie value={dice[1]} isRolling={isRolling} size="lg" />
                )}
            </div>
            <button
                onClick={handleRollClick}
                disabled={disabled}
                className="btn-gold w-full max-w-xs py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-105 transition active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isRolling ? 'Lanzando...' : 'Lanzar Dados o Sacudir'}
            </button>
        </div>
    );
};

export default Controls;