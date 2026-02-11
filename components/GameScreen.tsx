import React, { Dispatch, useEffect, useRef } from 'react';
import { GameState, GameStatus } from '../types';
import { Action } from '../state/gameReducer';
import StatusSidebar from './StatusSidebar';
import MobileStatsBar from './MobileStatsBar';
import GameBoard from './GameBoard';
import Controls from './Controls';
import CurrentPlayerDisplay from './CurrentPlayerDisplay';
import PassiveIncomeBanner from './PassiveIncomeBanner';
import { mainBoard, ROUTE_LENGTH } from '../constants';
import BoardWrapper from './BoardWrapper';
import { playSound } from '../utils/soundManager';

interface GameScreenProps {
    state: GameState;
    dispatch: Dispatch<Action>;
}

const GameScreen: React.FC<GameScreenProps> = ({ state, dispatch }) => {
    const { players, currentPlayerIndex, pozo, dice, isRolling, passiveIncomeBanner, isMoving, moveDetails, isMovingInRoute, routeMoveDetails } = state;
    const currentPlayer = players[currentPlayerIndex];
    const isAnimating = useRef(false);

    useEffect(() => {
        if (passiveIncomeBanner?.visible) {
            // Updated to 3000ms (3 seconds) per user request
            const timer = setTimeout(() => {
                dispatch({ type: 'HIDE_PASSIVE_INCOME_BANNER' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [passiveIncomeBanner, dispatch]);

    useEffect(() => {
        if (isRolling) {
            const timer = setTimeout(() => {
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = currentPlayer.inRoute ? 0 : Math.floor(Math.random() * 6) + 1;
                dispatch({ type: 'FINISH_ROLL', payload: { d1, d2 } });
            }, 1000); // Simulate rolling for 1 second

            return () => clearTimeout(timer);
        }
    }, [isRolling, dispatch, currentPlayer.inRoute]);

    useEffect(() => {
        if (!isMoving || !moveDetails || isAnimating.current) return;

        const animateMove = async () => {
            isAnimating.current = true;
            const { startPos, steps } = moveDetails;

            // Wait for the dice animation to snap to result (0.4s) + a little reading time (0.2s)
            await new Promise(resolve => setTimeout(resolve, 600));

            for (let i = 1; i <= steps; i++) {
                playSound('tokenMove', 0.2);
                const nextPos = (startPos + i) % mainBoard.length;
                dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: nextPos });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            dispatch({ type: 'FINISH_MOVE' });
            isAnimating.current = false;
        };

        animateMove();
    }, [isMoving, moveDetails, dispatch]);

    useEffect(() => {
        if (!isMovingInRoute || !routeMoveDetails || isAnimating.current) return;

        const animateRouteMove = async () => {
            isAnimating.current = true;
            const { startStep, steps } = routeMoveDetails;

            // Wait for the dice animation to snap to result (0.4s) + a little reading time (0.2s)
            await new Promise(resolve => setTimeout(resolve, 600));

            const movingSteps = Math.min(steps, ROUTE_LENGTH - startStep);
            const overflow = steps - movingSteps;

            for (let i = 1; i <= movingSteps; i++) {
                playSound('tokenMove', 0.2);
                const nextStep = startStep + i;
                dispatch({ type: 'UPDATE_PLAYER_ROUTE_STEP', payload: nextStep });
                await new Promise(resolve => setTimeout(resolve, 400));
            }
            dispatch({ type: 'FINISH_ROUTE_MOVE', payload: { overflow } });
            isAnimating.current = false;
        };

        animateRouteMove();
    }, [isMovingInRoute, routeMoveDetails, dispatch]);

    useEffect(() => {
        if (state.gameStatus === GameStatus.Celebrating) {
            playSound('winGame', 1.0);
            const timer = setTimeout(() => {
                dispatch({ type: 'FINISH_WIN_ANIMATION' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [state.gameStatus, dispatch]);

    return (
        <div id="screen-game" className="bg-slate-900 absolute inset-0">
            {passiveIncomeBanner?.visible && (
                <PassiveIncomeBanner
                    amount={passiveIncomeBanner.amount}
                    healthGain={passiveIncomeBanner.healthGain}
                    playerName={passiveIncomeBanner.playerName}
                    lap={passiveIncomeBanner.lap}
                />
            )}
            <div id="game-layout" className='flex h-screen w-screen overflow-hidden'>
                <StatusSidebar players={players} currentPlayerIndex={currentPlayerIndex} />

                <div id="main-area" className="flex-grow relative flex flex-col h-full">
                    <MobileStatsBar players={players} currentPlayerIndex={currentPlayerIndex} />

                    <div id="board-wrapper" className="flex-grow flex items-center justify-center p-2.5 relative">
                        {currentPlayer.inRoute && (
                            <div className="absolute top-4 bg-yellow-500 text-black text-[10px] font-black px-4 py-2 rounded-full uppercase animate-bounce z-20 shadow-xl border-2 border-white">
                                🚧 Explorando: <span>{currentPlayer.rId}</span>
                            </div>
                        )}

                        <BoardWrapper>
                            <div className="relative w-[95vmin] h-[95vmin] max-w-[680px] max-h-[680px]">
                                <GameBoard
                                    players={players}
                                    currentPlayerIndex={currentPlayerIndex}
                                    winnerId={state.winner?.id}
                                    isCelebrating={state.gameStatus === GameStatus.Celebrating}
                                />
                                <CurrentPlayerDisplay player={currentPlayer} pozo={pozo} />
                            </div>
                        </BoardWrapper>
                    </div>

                    <Controls
                        dice={dice}
                        isRolling={isRolling}
                        disabled={isRolling || isMoving || isMovingInRoute}
                        inRoute={currentPlayer.inRoute}
                        onRoll={() => dispatch({ type: 'ROLL_DICE' })}
                    />
                </div>
            </div>

            {state.gameStatus === GameStatus.Celebrating && state.winner && (
                <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="text-yellow-400 text-6xl font-black mb-8 animate-bounce drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-widest uppercase">
                        ¡Victoria!
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                        <div className="text-[120px] animate-[winner-spin_3s_ease-in-out_infinite] flex items-center justify-center w-32 h-32 rounded-full overflow-hidden">
                            {(state.winner.icon.startsWith('/') || state.winner.icon.includes('.png') || state.winner.icon.includes('data:')) ? (
                                <img src={state.winner.icon} alt="Winner Avatar" className="w-full h-full object-cover" />
                            ) : (
                                state.winner.icon
                            )}
                        </div>
                    </div>
                    <div className="mt-12 text-white text-3xl font-bold bg-slate-900/80 px-8 py-3 rounded-xl border border-yellow-500/30">
                        {state.winner.name}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameScreen;