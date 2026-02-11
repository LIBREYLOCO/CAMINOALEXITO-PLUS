import React from 'react';

interface WaitingSetupScreenProps {
    currentSetupIndex: number;
    totalPlayers: number;
    roomId?: string | null;
}

const WaitingSetupScreen: React.FC<WaitingSetupScreenProps> = ({ currentSetupIndex, totalPlayers, roomId }) => {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6">
            {roomId && (
                <div className="fixed top-6 right-6 z-[100]">
                    <div className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 font-black py-2 px-6 rounded-xl text-xl uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
                        SALA: {roomId}
                    </div>
                </div>
            )}
            <div className="w-full max-w-md text-center space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full animate-pulse"></div>
                    <div className="relative text-8xl mb-4 animate-bounce">⏳</div>
                </div>

                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                    Esperando a<br />
                    <span className="text-yellow-400">Jugador {currentSetupIndex + 1}</span>
                </h2>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                    <p className="text-white/60 font-bold text-lg mb-2">
                        Configurando perfil...
                    </p>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-yellow-400 h-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentSetupIndex) / totalPlayers) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-right text-xs text-white/30 font-black mt-2 uppercase">
                        {currentSetupIndex} de {totalPlayers} Listos
                    </p>
                </div>

                <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                    Por favor espera tu turno
                </p>
            </div>
        </div>
    );
};

export default WaitingSetupScreen;
