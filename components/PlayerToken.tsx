import React from 'react';
import { Player } from '../types';

interface PlayerTokenProps {
    player: Player;
    index: number;
    isCurrent: boolean;
    top: number;
    left: number;
    tileWidth: number;
    tileHeight: number;
    isWinner?: boolean;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ player, index, isCurrent, top, left, tileWidth, tileHeight, isWinner }) => {
    // Center the token and apply offset for multiple players
    const tokenSize = isCurrent ? 28 : 24;
    const baseOffsetX = (tileWidth - tokenSize) / 2;
    const baseOffsetY = (tileHeight - tokenSize) / 2;

    const smallOffset = (index % 2) * (tokenSize / 2 + 4) - (tokenSize / 4);
    const largeOffset = Math.floor(index / 2) * (tokenSize / 2 + 4) - (tokenSize / 4);

    const style = {
        backgroundColor: 'transparent',
        top: `${top + baseOffsetY + largeOffset}px`,
        left: `${left + baseOffsetX + smallOffset}px`,
        borderColor: 'transparent',
        filter: isCurrent ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' : 'none',
        zIndex: isCurrent ? 50 : 10
    };

    const isImage = (typeof player.icon === 'string' && (player.icon.startsWith('/') || player.icon.includes('.png') || player.icon.includes('data:')));

    const classes = `p-token ${isCurrent ? 'active' : ''} ${isWinner ? 'animate-winner-spin z-[100] scale-[3]' : ''}`;

    return (
        <div className={classes} style={style}>
            <span className="p-token-icon leading-none select-none flex items-center justify-center w-full h-full">
                {isImage ? (
                    <img src={player.icon} alt="Avatar" className="w-[120%] h-[120%] max-w-none object-contain filter drop-shadow-sm" />
                ) : (
                    player.icon
                )}
            </span>
        </div>
    );
};

export default PlayerToken;