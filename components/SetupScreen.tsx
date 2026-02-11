import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '../types';
import { pColors, pIcons } from '../constants';
import { playSound } from '../utils/soundManager';

interface SetupScreenProps {
    playerIndex: number;
    totalPlayers: number;
    onSave: (player: Omit<Player, 'id'>) => void;
    existingNames: string[];
    usedColors: string[];
    usedIcons: string[];
    roomCode?: string | null;
}

function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const avatarPhrasesMap: { [key: number]: string[] } = {
    0: [ // General / Leadership
        "¡Excelente elección!", "¡Liderazgo puro!", "¡Naciste para esto!", "¡Vamos por todo!",
        "¡Tu momento es hoy!", "¡Haz historia!", "¡Confianza total!", "¡A ganar!",
        "¡El éxito te espera!", "¡Actitud ganadora!"
    ],
    1: [ // Foco / Innovation
        "¡Idea brillante!", "¡Genio creativo!", "¡Iluminas el camino!", "¡Pensamiento original!",
        "¡Chispa de talento!", "¡Innovación total!", "¡Mente abierta!", "¡Visión clara!",
        "¡Luces encendidas!", "¡Creatividad pura!"
    ],
    2: [ // Moneda / Wealth
        "¡Inversión segura!", "¡Mente millonaria!", "¡El dinero fluye!", "¡Prosperidad!",
        "¡Riqueza en camino!", "¡Capital semilla!", "¡Valor en alza!", "¡Finanzas sanas!",
        "¡Abundancia!", "¡Éxito financiero!"
    ],
    3: [ // Target / Goals
        "¡En el blanco!", "¡Objetivo claro!", "¡Puntería exacta!", "¡Meta cumplida!",
        "¡Foco total!", "¡Sin distracciones!", "¡Directo al éxito!", "¡Precisión!",
        "¡Ojo de águila!", "¡Misión posible!"
    ],
    4: [ // Rocket / Speed
        "¡Despegue inminente!", "¡Hacia las estrellas!", "¡Velocidad luz!", "¡Sin límites!",
        "¡Rumbo a la cima!", "¡Propulsión total!", "¡Alto vuelo!", "¡Explorador!",
        "¡Aventura espacial!", "¡Más allá del cielo!"
    ],
    5: [ // Book / Wisdom
        "¡Sabiduría pura!", "¡Conocimiento es poder!", "¡Mente maestra!", "¡Aprendizaje continuo!",
        "¡Experto en todo!", "¡Estratega!", "¡Cultura genial!", "¡Intelecto superior!",
        "¡Lección aprendida!", "¡Maestro de vida!"
    ],
    6: [ // Handshake / Connection
        "¡Gran socio!", "¡Conexión total!", "¡Equipo ganador!", "¡Carisma puro!",
        "¡Red de contactos!", "¡Amigable!", "¡Diplomacia!", "¡Juntos es mejor!",
        "¡Alianza fuerte!", "¡Sinastría!"
    ],
    7: [ // Trophy / Victory
        "¡Campeón nato!", "¡Victoria asegurada!", "¡Medalla de oro!", "¡Número uno!",
        "¡Triunfo total!", "¡Gloria eterna!", "¡Invencible!", "¡Cima del podio!",
        "¡Ganador indiscutible!", "¡Récord mundial!"
    ],
    8: [ // Mountain / Achievement
        "¡Cima alcanzada!", "¡Escalando alto!", "¡Persistencia!", "¡Vista desde arriba!",
        "¡Reto superado!", "¡Sin vértigo!", "¡Paso firme!", "¡Cumbre lograda!",
        "¡Aire puro!", "¡Montaña conquistada!"
    ],
    9: [ // Star / Excellence
        "¡Brillas con fuerza!", "¡Estrella fugaz!", "¡Luz estelar!", "¡Destino brillante!",
        "¡Fama y fortuna!", "¡Talento estelar!", "¡Aura mágica!", "¡Celebridad!",
        "¡Polvo de estrellas!", "¡Universo a favor!"
    ]
};

const SetupScreen: React.FC<SetupScreenProps> = ({ playerIndex, totalPlayers, onSave, existingNames, usedColors, usedIcons, roomCode }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [money, setMoney] = useState(0);
    const [health, setHealth] = useState(0);
    const [happy, setHappy] = useState(0);
    const [color, setColor] = useState(pColors[0]);
    const [icon, setIcon] = useState(pIcons[0]);
    const [animatingIcon, setAnimatingIcon] = useState<string | null>(null);
    const [animatingMessage, setAnimatingMessage] = useState<string>("");
    const [timePoints, setTimePoints] = useState(0);
    const [total, setTotal] = useState(0);
    const [isValid, setIsValid] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [ageAlert, setAgeAlert] = useState<{ message: string, title: string, type: 'too-young' | 'inspiration' | 'too-old' } | null>(null);

    const prevNameError = usePrevious(nameError);

    const updateTotals = useCallback(() => {
        const ageNum = parseInt(age) || 0;
        const tPts = ageNum > 60 ? 15 : ageNum >= 41 ? 20 : ageNum >= 21 ? 25 : ageNum > 0 ? 30 : 0;
        setTimePoints(tPts);
        const currentTotal = tPts + money + health + happy;
        setTotal(currentTotal);

        const cleanName = name.trim().toUpperCase();
        const currentInitials = cleanName.substring(0, 2);

        // Validation: Check for duplicate initials or duplicate full names
        let nameValid = true;
        let errorMsg = null;

        if (cleanName.length < 2) {
            nameValid = false;
        } else {
            const isDuplicate = existingNames.some(existing => {
                const existingInitials = existing.trim().substring(0, 2).toUpperCase();
                return existingInitials === currentInitials;
            });

            if (isDuplicate) {
                nameValid = false;
                errorMsg = "¡Iniciales repetidas! Usa otro nombre o apodo.";
            }
        }

        setNameError(errorMsg);

        const valid = currentTotal === 100 && health >= 10 && happy >= 10 && nameValid && money <= 80;
        setIsValid(valid);
    }, [age, money, health, happy, name, existingNames]);

    useEffect(() => {
        updateTotals();
    }, [name, age, money, health, happy, updateTotals]);

    // Effect to play sound when name error appears
    useEffect(() => {
        if (nameError && !prevNameError) {
            playSound('error', 0.4);
        }
    }, [nameError, prevNameError]);

    useEffect(() => {
        // Reset form for new player
        setName('');
        setAge('');
        setMoney(0);
        setHealth(0);
        setHappy(0);
        setNameError(null);
        setAnimatingIcon(null);

        // Find the next available color and icon
        const availableColor = pColors.find(c => !usedColors.includes(c));
        setColor(availableColor || pColors[playerIndex % pColors.length]);
        const availableIcon = pIcons.find(i => !usedIcons.includes(i));
        setIcon(availableIcon || pIcons[playerIndex % pIcons.length]);
    }, [playerIndex, usedColors, usedIcons]);

    // Handle icon selection with animation
    const handleIconSelect = (index: number) => {
        if (!usedIcons.includes(pIcons[index])) {
            playSound('uiClick', 0.5);
            setIcon(pIcons[index]);
            setAnimatingIcon(pIcons[index]);

            // Select random message for this avatar
            const phrases = avatarPhrasesMap[index] || avatarPhrasesMap[0];
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            setAnimatingMessage(randomPhrase);

            setTimeout(() => {
                setAnimatingIcon(null);
                setAnimatingMessage("");
            }, 1500);
        }
    };


    const validateAge = () => {
        const ageNum = parseInt(age);
        if (isNaN(ageNum)) return;

        if (ageNum < 6 && ageNum >= 0) {
            setAgeAlert({
                title: "🍼 ¡Oops, muy peque!",
                message: "Parece que aún eres muy joven para este camino al éxito. ¡Vuelve cuando tengas al menos 6 años o ajusta tu edad para jugar con un adulto!",
                type: 'too-young'
            });
            setAge('');
        } else if (ageNum >= 70 && ageNum <= 90) {
            const inspirations = [
                "¡Eres una inspiración! El éxito no tiene fecha de vencimiento. 🌟",
                "¡Qué increíble vitalidad! Tu experiencia es tu mejor ventaja en este juego. 🏆",
                "¡Nunca es tarde para trascender! Demuestra que la sabiduría lo gana todo. 🧠",
                "¡Un maestro en el tablero! A darle con todo por ese éxito. ✨"
            ];
            setAgeAlert({
                title: "🎉 ¡Eres Legendario!",
                message: inspirations[Math.floor(Math.random() * inspirations.length)],
                type: 'inspiration'
            });
        } else if (ageNum > 99) {
            const graveMessages = [
                "¡Oye! Este juego es para vivos, ¡no se puede jugar desde la tumba! ⚰️😂",
                "¿Más de 99 años? ¡Seguro eres un viajero del tiempo! Ajusta tu edad real. ⏳",
                "¡Increíble! Pero el éxito se busca en este plano astral... pon una edad entre 6 y 99. ✨"
            ];
            setAgeAlert({
                title: "👻 ¿Vienes del más allá?",
                message: graveMessages[Math.floor(Math.random() * graveMessages.length)],
                type: 'too-old'
            });
            setAge('');
        }

        // Always run autoBalance if age is valid (>=6 and <=99, or even if we show inspiration alert)
        if (ageNum >= 6) {
            autoBalanceSetup();
        }
    };

    const autoBalanceSetup = () => {
        const ageNum = parseInt(age) || 0;
        if (ageNum <= 0) return;
        const tPts = ageNum > 60 ? 15 : ageNum >= 41 ? 20 : ageNum >= 21 ? 25 : ageNum > 0 ? 30 : 0;
        let remaining = 100 - tPts;
        const minS = 10, minH = 10, maxM = 80;
        remaining -= (minS + minH);
        let m_add = Math.floor(Math.random() * (remaining + 1));
        if (m_add > maxM) m_add = maxM;
        let left = remaining - m_add;
        let s_add = Math.floor(Math.random() * (left + 1));
        let h_add = left - s_add;
        setMoney(m_add);
        setHealth(minS + s_add);
        setHappy(minH + h_add);
    };

    const handleSave = () => {
        if (!isValid) return;
        playSound('uiClick', 0.4);
        onSave({
            name: name.trim().toUpperCase(),
            color: color,
            icon: icon,
            metas: { t: timePoints, d: money, s: health, h: happy },
            actual: { pos: 0, money: 5000, health: 0, happy: 0, passive: 5000 },
            inRoute: false, rId: null, rSteps: 0, visitedRoutes: [],
            laps: 0 // Initialize laps
        });
    };

    const getDiffMessage = () => {
        if (total === 100) return <p className="text-xs font-bold text-green-400 uppercase mb-4 h-4">¡PERFECTO!</p>;
        if (total < 100) return <p className="text-xs font-bold text-yellow-400 uppercase mb-4 h-4">{`FALTAN ${100 - total}`}</p>;
        return <p className="text-xs font-bold text-red-400 uppercase mb-4 h-4">{`SOBRAN ${total - 100}`}</p>;
    };

    return (
        <div id="screen-setup" className="fixed inset-0 z-50 bg-slate-900 flex flex-col p-6 overflow-y-auto custom-scroll">
            <div className="flex justify-between items-start mb-4">
                <span id="setup-tag" className="bg-white text-black font-black py-1 px-4 rounded-full text-[10px] uppercase italic">{`JUGADOR ${playerIndex + 1} DE ${totalPlayers}`}</span>
                {roomCode && (
                    <div className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-black py-1 px-4 rounded-xl text-lg uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
                        SALA: {roomCode}
                    </div>
                )}
            </div>
            <h2 className="text-3xl font-black mb-6 italic uppercase leading-none text-white">Tu Fórmula<br /><span className="text-yellow-400">Personal</span></h2>

            <div className="space-y-6 flex-grow">
                <div>
                    <label className="text-[10px] text-white/50 font-black uppercase mb-1 block">Nombre (Se usarán las 2 primeras letras)</label>
                    <input value={name} onChange={e => setName(e.target.value)} type="text" maxLength={12} className={`w-full bg-white/10 p-4 rounded-2xl border ${nameError ? 'border-red-500 animate-pulse' : 'border-white/10'} font-black uppercase text-white outline-none focus:border-yellow-500 transition text-xl`} />
                    {nameError && <p className="text-red-400 text-[10px] font-bold mt-1 uppercase">{nameError}</p>}
                </div>
                <div>
                    <label className="text-[10px] text-white/50 font-black uppercase mb-1 block">Edad (Auto-Fórmula)</label>
                    <input value={age} onChange={e => setAge(e.target.value)} onBlur={validateAge} type="number" className="w-full bg-white/10 p-4 rounded-2xl border border-white/10 font-bold outline-none text-white text-xl placeholder-white/20" placeholder="Ej. 25" />
                </div>
                <div className="space-y-6">

                    <div>
                        <label className="text-[10px] text-white/50 font-black uppercase mb-2 block">Elige tu Ficha</label>
                        <div className="grid grid-cols-5 gap-2">
                            {pIcons.map((i, index) => {
                                const isUsed = usedIcons.includes(i);
                                return <button key={i} type="button" onClick={() => !isUsed && handleIconSelect(index)} disabled={isUsed} className={`relative glass rounded-lg text-2xl transition-all duration-300 transform flex items-center justify-center h-10 ${isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 hover:bg-white/10'} ${icon === i ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'ring-2 ring-transparent'}`} aria-label={`Icono ${i}`}>
                                    {i.includes('/') ? (
                                        <img src={i} alt="icon" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        i
                                    )}
                                </button>;
                            })}
                        </div>
                    </div>
                </div>
                <div className="p-4 glass rounded-2xl flex justify-between items-center border-l-4 border-blue-400">
                    <span className="text-blue-300 font-black text-xs italic uppercase">Puntos Tiempo:</span>
                    <span className="text-2xl font-black">{timePoints}</span>
                </div>
                <div className="space-y-5 pt-2">
                    <div><div className="flex justify-between text-xs font-black uppercase mb-2 text-yellow-400">💰 Dinero ($80k Max) <span className="text-lg">{money}</span></div><input type="range" min="0" max="80" value={money} onChange={e => setMoney(parseInt(e.target.value))} /></div>
                    <div><div className="flex justify-between text-xs font-black uppercase mb-2 text-red-400">❤️ Salud (Min 10) <span className="text-lg">{health}</span></div><input type="range" min="0" max="80" value={health} onChange={e => setHealth(parseInt(e.target.value))} /></div>
                    <div><div className="flex justify-between text-xs font-black uppercase mb-2 text-orange-400">😊 Felicidad (Min 10) <span className="text-lg">{happy}</span></div><input type="range" min="0" max="80" value={happy} onChange={e => setHappy(parseInt(e.target.value))} /></div>
                </div>
            </div>

            {/* Age Alert Modal */}
            {ageAlert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate__animated animate__fadeIn">
                    <div className="bg-slate-800 border-2 border-white/20 p-8 rounded-[2rem] w-full max-w-xs text-center shadow-2xl animate__animated animate__zoomIn">
                        <h3 className={`text-2xl font-black italic uppercase mb-4 leading-tight ${ageAlert.type === 'too-young' ? 'text-blue-400' : ageAlert.type === 'inspiration' ? 'text-yellow-400' : 'text-red-500'}`}>
                            {ageAlert.title}
                        </h3>
                        <p className="text-white/80 text-sm font-bold leading-relaxed mb-8">
                            {ageAlert.message}
                        </p>
                        <button
                            onClick={() => { setAgeAlert(null); playSound('uiClick', 0.3); }}
                            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Avatar Selection Animation */}
            {animatingIcon && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate__animated animate__fadeIn">
                    <div className="animate__animated animate__zoomIn animate__faster flex flex-col items-center justify-center">
                        <div className="text-[150px] filter drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce">
                            {animatingIcon.includes('/') ? (
                                <img src={animatingIcon} alt="Selected Avatar" className="w-48 h-48 object-contain" />
                            ) : (
                                animatingIcon
                            )}
                        </div>
                        <h3 className="text-yellow-400 text-3xl font-black uppercase tracking-widest mt-4 animate-pulse text-center px-4">
                            {animatingMessage}
                        </h3>
                    </div>
                </div>
            )}

            <div className="mt-4 p-5 glass rounded-t-3xl border-t border-white/20 text-center">
                <div className="mb-2"><span className={`text-5xl font-black ${total === 100 ? 'text-green-400' : total > 100 ? 'text-red-400' : 'text-white'}`}>{total}</span><span className="text-lg opacity-50">/100</span></div>
                {getDiffMessage()}
                <button disabled={!isValid} onClick={handleSave} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${isValid ? 'bg-yellow-500 text-black shadow-xl animate-pulse cursor-pointer hover:bg-yellow-400' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>Siguiente</button>
            </div>
        </div>
    );
};

export default SetupScreen;