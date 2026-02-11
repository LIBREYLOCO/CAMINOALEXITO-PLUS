import React, { useState, useEffect, useReducer, useRef } from 'react';
import { GameState, GameStatus, Player, ModalPayload } from './types';
import StartScreen from './components/StartScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import WinScreen from './components/WinScreen';
import IntroScreen from './components/IntroScreen';
import LobbyScreen from './components/LobbyScreen';
import TurnOverlay from './components/TurnOverlay';
import InfoTileModal from './components/modals/InfoTileModal';
import RouteModal from './components/modals/RouteModal';
import CardModal from './components/modals/CardModal';
import DiceEventModal from './components/modals/DiceEventModal';
import HospitalModal from './components/modals/HospitalModal';
import GiftSelectionModal from './components/modals/GiftSelectionModal';
import { gameReducer, initialState } from './state/gameReducer';
import { mainBoard } from './constants';
import { playSound } from './utils/soundManager';
import SoundToggle from './components/SoundToggle';
import GameAnimations from './components/GameAnimations';
import { subscribeToRoom, syncGameState } from './utils/firebase';

function usePrevious<T>(value: T): T | undefined {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

const App: React.FC = () => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const {
        gameStatus, players, setupPlayerIndex, totalPlayers, currentPlayerIndex,
        activeModal, showTurnOverlay, winner, isShowingStatChanges, turnPhase,
        roomId, isHost
    } = state;
    const prevGameStatus = usePrevious(gameStatus);
    const prevActiveModal = usePrevious(activeModal);

    const lastRemoteState = useRef<string | null>(null);

    // SYNC: Si estamos en una sala, escuchamos cambios del servidor
    useEffect(() => {
        if (roomId) {
            const unsubscribe = subscribeToRoom(roomId, (remoteState) => {
                // Store the stringified remote state to avoid echoing it back
                lastRemoteState.current = JSON.stringify(remoteState);

                // Solo sincronizamos si no somos el host, o si el cambio viene de fuera
                dispatch({ type: 'SYNC_ONLINE_STATE', payload: remoteState });
            });
            return () => unsubscribe();
        }
    }, [roomId]);

    // AUTO-SYNC: Si somos el host, enviamos los cambios locales al servidor
    // EXCEPTION: During SETUP, allow clients to sync their player creation data
    useEffect(() => {
        if (roomId) {
            const isSetup = state.gameStatus === GameStatus.Setup;
            if (isHost || isSetup) {
                const currentStateStr = JSON.stringify(state);
                // Only sync if the current state is different from the last state we received from remote
                if (currentStateStr !== lastRemoteState.current) {
                    syncGameState(roomId, state);
                }
            }
        }
    }, [state, roomId, isHost]);

    // Sound effects for high-level state changes
    useEffect(() => {
        if (showTurnOverlay) {
            playSound('turnStart', 0.4);
        }
    }, [showTurnOverlay]);

    useEffect(() => {
        if (activeModal?.type === 'CARD' && prevActiveModal?.type !== 'CARD') {
            playSound('cardDraw', 0.6);
        }
    }, [activeModal, prevActiveModal]);

    useEffect(() => {
        if (gameStatus === GameStatus.Win && prevGameStatus !== GameStatus.Win) {
            playSound('winGame', 0.7);
        }
    }, [gameStatus, prevGameStatus]);


    useEffect(() => {
        if (turnPhase === 'STAT_UPDATE') {
            if (isShowingStatChanges) {
                // Wait for animations to finish before advancing
                const timer = setTimeout(() => {
                    dispatch({ type: 'ADVANCE_TURN_PHASE' });
                }, 1800);
                return () => clearTimeout(timer);
            } else {
                // No animations, advance immediately
                dispatch({ type: 'ADVANCE_TURN_PHASE' });
            }
        }
    }, [turnPhase, isShowingStatChanges, dispatch]);

    // AUTO-SAVE: Persist state to localStorage (Solo en modo local)
    useEffect(() => {
        if (!roomId) {
            if (gameStatus === GameStatus.Playing || gameStatus === GameStatus.Celebrating) {
                localStorage.setItem('antigravity_savegame', JSON.stringify(state));
            } else if (gameStatus === GameStatus.Win || gameStatus === GameStatus.Start) {
                if (gameStatus === GameStatus.Win) {
                    localStorage.removeItem('antigravity_savegame');
                }
            }
        }
    }, [state, gameStatus, roomId]);

    const [hasSave, setHasSave] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('antigravity_savegame');
        setHasSave(!!saved);
    }, [gameStatus]);

    const handleResumeGame = () => {
        const saved = localStorage.getItem('antigravity_savegame');
        if (saved) {
            const parsed = JSON.parse(saved);
            dispatch({ type: 'LOAD_SAVED_GAME', payload: parsed });
            playSound('uiClick', 0.5);
        }
    };

    const handleShowLobby = () => {
        playSound('uiClick', 0.5);
        dispatch({ type: 'SHOW_LOBBY' });
    };

    const handleCreateRoom = (id: string, initialGameSettings?: any) => {
        dispatch({
            type: 'SET_ROOM_ID',
            payload: {
                roomId: id,
                isHost: true,
                // If we have settings, we can merge them? Or just force Setup status.
                // Better: The reducer change (forcing Setup) was good, but we missed totalPlayers.
                // We'll dispatch a separate action or update the payload.
            }
        });
        if (initialGameSettings) {
            // Force local state update immediately to match the room we just created
            dispatch({ type: 'SYNC_ONLINE_STATE', payload: initialGameSettings });
        }
    }

    const handleJoinRoom = (id: string, remoteState: any) => {
        dispatch({ type: 'SET_ROOM_ID', payload: { roomId: id, isHost: false } });
        dispatch({ type: 'SYNC_ONLINE_STATE', payload: remoteState });
    }

    const handleStartSetup = (playerCount: number) => {
        dispatch({ type: 'START_SETUP', payload: playerCount });
    };

    const handleSavePlayer = (player: Omit<Player, 'id'>) => {
        dispatch({ type: 'SAVE_PLAYER', payload: player });
    };

    const handleCloseModal = () => {
        playSound('uiClick', 0.3);
        dispatch({ type: 'ADVANCE_TURN_PHASE' });
    }

    const renderModal = () => {
        if (state.animationType) return null;
        if (!activeModal) return null;

        const p = players[currentPlayerIndex];
        if (!p) return null;

        switch (activeModal.type) {
            case 'INFO_TILE':
                return <InfoTileModal tile={activeModal.payload} onClose={handleCloseModal} />;
            case 'ROUTE':
                return <RouteModal tile={activeModal.payload} player={p} onDecision={(decision) => dispatch({ type: 'DECIDE_ROUTE', payload: decision })} />;
            case 'CARD':
                return <CardModal card={activeModal.payload.card} category={activeModal.payload.category} onResolve={(success) => dispatch({ type: 'RESOLVE_CARD', payload: success })} />;
            case 'DICE_EVENT':
                return <DiceEventModal tile={activeModal.payload} onResolve={(rewards) => dispatch({ type: 'RESOLVE_DICE_EVENT', payload: rewards })} />;
            case 'HOSPITAL':
                return <HospitalModal tile={activeModal.payload} onResolve={(result) => dispatch({ type: 'RESOLVE_HOSPITAL', payload: result })} />;
            case 'GIFT_SELECTION':
                const { giverIndex, receiverIndex } = activeModal.payload as any;
                return (
                    <GiftSelectionModal
                        giver={state.players[giverIndex]}
                        receiver={state.players[receiverIndex]}
                        onGiftSelect={(gift) => dispatch({ type: 'RESOLVE_GIFT', payload: gift })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            {gameStatus !== GameStatus.Intro && gameStatus !== GameStatus.Start && gameStatus !== GameStatus.Setup && gameStatus !== GameStatus.Lobby && <SoundToggle />}

            {gameStatus === GameStatus.Intro && <IntroScreen onNext={() => dispatch({ type: 'SHOW_START_SCREEN' })} />}

            {gameStatus === GameStatus.Start && (
                <StartScreen
                    onStart={handleStartSetup}
                    hasSavedGame={hasSave}
                    onResume={handleResumeGame}
                    onOnline={handleShowLobby}
                />
            )}
            {gameStatus === GameStatus.Lobby && (
                <LobbyScreen
                    onCreate={handleCreateRoom}
                    onJoin={handleJoinRoom}
                    onBack={() => dispatch({ type: 'SHOW_START_SCREEN' })}
                />
            )}
            {gameStatus === GameStatus.Setup && (
                <SetupScreen
                    playerIndex={setupPlayerIndex}
                    totalPlayers={totalPlayers}
                    onSave={handleSavePlayer}
                    existingNames={players.map(p => p.name)}
                    usedColors={players.map(p => p.color)}
                    usedIcons={players.map(p => p.icon)}
                    roomCode={roomId}
                />
            )}
            {(gameStatus === GameStatus.Playing || gameStatus === GameStatus.Celebrating) && <GameScreen state={state} dispatch={dispatch} />}
            {gameStatus === GameStatus.Win && winner && <WinScreen winner={winner} allPlayers={players} dispatch={dispatch} />}

            {showTurnOverlay && players[currentPlayerIndex] && (
                <TurnOverlay
                    player={players[currentPlayerIndex]}
                    onStartTurn={() => dispatch({ type: 'START_TURN' })}
                    dispatch={dispatch}
                />
            )}
            {state.animationType && (
                <GameAnimations
                    type={state.animationType}
                    onComplete={() => dispatch({ type: 'END_ANIMATION' })}
                    data={state.animationData}
                />
            )}
            {renderModal()}
        </>
    );
};

export default App;