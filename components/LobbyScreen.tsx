import React, { useState } from 'react';
import { createRoom, joinRoom } from '../utils/firebase';
import { GameState, GameStatus } from '../types';
import { playSound } from '../utils/soundManager';

interface LobbyScreenProps {
    onCreate: (roomId: string, initialState: any) => void;
    onJoin: (roomId: string, state: GameState) => void;
    onBack: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreate, onJoin, onBack }) => {
    const [mode, setMode] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Estado inicial mínimo para la sala
            const initialState: any = {
                gameStatus: 2, // GameStatus.Setup (Hardcoded to ensure correct state)
                players: [],
                totalPlayers: 2, // Default to 2 for easier testing/gameplay
                currentPlayerIndex: 0,
                pozo: 0,
                turnPhase: 'IDLE'
            };
            const id = await createRoom(initialState);
            onCreate(id, initialState);
        } catch (err: any) {
            setError("Error al crear la sala.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (roomCode.length < 4) return;
        setLoading(true);
        setError(null);
        try {
            const state = await joinRoom(roomCode.toUpperCase(), "", "");
            onJoin(roomCode.toUpperCase(), state);
        } catch (err: any) {
            setError(err.message || "Error al unirse.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <span className="text-cyan-400 text-6xl font-black italic">PLUS</span>
                </div>

                <h2 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter">
                    Multijugador <span className="text-cyan-400">Online</span>
                </h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {mode === 'SELECT' && (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => { playSound('uiClick', 0.5); setMode('CREATE'); handleCreate(); }}
                            disabled={loading}
                            className="btn-gold py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-600"
                        >
                            {loading && mode === 'CREATE' ? 'Creando...' : 'Crear Nueva Sala'}
                        </button>

                        <button
                            onClick={() => { playSound('uiClick', 0.5); setMode('JOIN'); }}
                            disabled={loading}
                            className="bg-slate-800 border border-cyan-500/30 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-slate-750 transition"
                        >
                            Unirse con Código
                        </button>

                        <button
                            onClick={onBack}
                            className="mt-4 text-white/40 text-sm font-bold uppercase hover:text-white/60 transition"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                )}

                {mode === 'JOIN' && (
                    <div className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Código de Sala</label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="EJ: XJ72"
                                maxLength={6}
                                className="w-full bg-black/40 border-2 border-cyan-500/30 rounded-2xl p-5 text-center text-3xl font-black text-cyan-400 tracking-[0.5em] focus:border-cyan-400 focus:outline-none transition-all placeholder:text-white/10"
                            />
                        </div>

                        <button
                            onClick={handleJoin}
                            disabled={loading || roomCode.length < 4}
                            className="btn-gold py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Entrar a la Sala'}
                        </button>

                        <button
                            onClick={() => setMode('SELECT')}
                            className="text-white/40 text-sm font-bold uppercase hover:text-white/60 transition"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {mode === 'CREATE' && loading && (
                    <div className="flex flex-col items-center py-10 gap-4">
                        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                        <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Generando Código...</p>
                    </div>
                )}
            </div>

            <p className="mt-8 text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Camino al Éxito Plus</p>
        </div>
    );
};

export default LobbyScreen;
