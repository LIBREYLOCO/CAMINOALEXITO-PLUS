import React from 'react';
import { Tile } from '../../types';

interface InfoTileModalProps {
    tile: Tile;
    onClose: () => void;
}

const InfoTileModal: React.FC<InfoTileModalProps> = ({ tile, onClose }) => {
    if (!tile) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm z-[100] modal-active animate__animated animate__fadeIn">
            <div className={`
                relative w-full max-w-sm rounded-[2rem] p-1 
                bg-gradient-to-br from-white/20 to-white/5 
                shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                animate__animated animate__zoomIn
            `}>
                <div className="relative rounded-[1.8rem] px-8 py-10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md border border-white/10 text-center">

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">HAS CAÍDO EN</p>

                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 uppercase italic mb-6 filter drop-shadow-sm leading-none">
                        {tile.n}
                    </h2>

                    <div className="bg-white/5 rounded-xl p-4 mb-8 border border-white/5">
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            {tile.d || "Evento de Casilla"}
                        </p>
                    </div>

                    <button onClick={onClose}
                        className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-gray-100 hover:scale-[1.02] transition-transform active:scale-95 border-b-4 border-gray-300">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InfoTileModal;