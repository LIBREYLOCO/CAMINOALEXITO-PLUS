import { GameState, GameStatus, Player, Tile, Rewards, Card, ActiveModal } from '../types';
import { mainBoard, mazoReto, mazoExpertis, mazoRutas, routeCosts, pColors, ROUTE_LENGTH, HOSPITAL_COST_MULTIPLIER, routeCompletionMessages } from '../constants';

export type Action =
    | { type: 'SHOW_START_SCREEN' }
    | { type: 'START_SETUP'; payload: number }
    | { type: 'SAVE_PLAYER'; payload: Omit<Player, 'id'> }
    | { type: 'START_GAME' }
    | { type: 'SHOW_TURN_OVERLAY' }
    | { type: 'START_TURN' }
    | { type: 'ROLL_DICE' }
    | { type: 'FINISH_ROLL'; payload: { d1: number, d2: number } }
    | { type: 'DECIDE_ROUTE'; payload: boolean }
    | { type: 'RESOLVE_CARD'; payload: boolean }
    | { type: 'RESOLVE_DICE_EVENT', payload: Rewards }
    | { type: 'RESOLVE_HOSPITAL', payload: { cost: number, health: number, happy: number } }
    | { type: 'RESOLVE_GIFT', payload: Rewards }
    | { type: 'END_GAME_EARLY' }
    | { type: 'RESET_GAME' }
    | { type: 'UPDATE_PLAYER_POSITION'; payload: number }
    | { type: 'FINISH_MOVE' }
    | { type: 'UPDATE_PLAYER_ROUTE_STEP'; payload: number }
    | { type: 'FINISH_ROUTE_MOVE'; payload?: { overflow?: number } }
    | { type: 'ADVANCE_TURN_PHASE' }
    | { type: 'HIDE_PASSIVE_INCOME_BANNER' }
    | { type: 'ADVANCE_TURN_PHASE' }
    | { type: 'HIDE_PASSIVE_INCOME_BANNER' }
    | { type: 'END_ANIMATION' }
    | { type: 'FINISH_WIN_ANIMATION' }
    | { type: 'LOAD_SAVED_GAME'; payload: GameState }
    | { type: 'SYNC_ONLINE_STATE'; payload: GameState }
    | { type: 'SET_ROOM_ID'; payload: { roomId: string, isHost: boolean } }
    | { type: 'SHOW_LOBBY' };


export const initialState: GameState = {
    gameStatus: GameStatus.Intro,
    totalPlayers: 0,
    setupPlayerIndex: 0,
    players: [],
    currentPlayerIndex: 0,
    pozo: 0,
    activeModal: null,
    currentTile: null,
    showTurnOverlay: false,
    winner: null,
    dice: [0, 0],
    isRolling: false,
    passiveIncomeBanner: null,
    isMoving: false,
    moveDetails: null,
    isMovingInRoute: false,
    routeMoveDetails: null,
    isShowingStatChanges: false,
    turnPhase: 'IDLE',
    animationType: null,
    lastSource: 'LOCAL',
    roomId: null,
    isHost: false,
    localPlayerId: null,
};

function calculateSuccess(p: Player): number {
    const m = Math.min(Math.floor(p.actual.money / 1000), p.metas.d);
    const h = Math.min(p.actual.health, p.metas.s);
    const ha = Math.min(p.actual.happy, p.metas.h);
    return p.metas.t + m + h + ha;
}

// Helper to check for any stat changes
const statsChanged = (oldPlayer: Player, newPlayer: Player): boolean => {
    return oldPlayer.actual.money !== newPlayer.actual.money ||
        oldPlayer.actual.health !== newPlayer.actual.health ||
        oldPlayer.actual.happy !== newPlayer.actual.happy ||
        oldPlayer.actual.passive !== newPlayer.actual.passive;
}

export function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'RESET_GAME':
            return initialState;

        case 'SHOW_START_SCREEN':
            return {
                ...state,
                gameStatus: GameStatus.Start
            };

        case 'START_SETUP':
            return {
                ...initialState,
                gameStatus: GameStatus.Setup,
                totalPlayers: action.payload,
            };

        case 'SAVE_PLAYER':
            const newPlayer: Player = {
                ...action.payload,
                id: state.setupPlayerIndex,
            };
            const nextSetupIndex = state.setupPlayerIndex + 1;
            const updatedPlayers = [...state.players, newPlayer];

            if (nextSetupIndex >= state.totalPlayers) {
                return {
                    ...state,
                    players: updatedPlayers,
                    gameStatus: GameStatus.Playing,
                    setupPlayerIndex: 0,
                    showTurnOverlay: true,
                };
            }
            return {
                ...state,
                players: updatedPlayers,
                setupPlayerIndex: nextSetupIndex,
            };

        case 'START_TURN':
            return { ...state, showTurnOverlay: false, turnPhase: 'IDLE' };

        case 'ROLL_DICE':
            return { ...state, isRolling: true, dice: [0, 0], turnPhase: 'ROLLING' };

        case 'FINISH_ROLL': {
            const { d1, d2 } = action.payload;
            // FIX: Explicitly cast 'MOVING' to the correct TurnPhase type to prevent type widening to 'string'.
            const newState = { ...state, isRolling: false, dice: [d1, d2] as [number, number], turnPhase: 'MOVING' as GameState['turnPhase'] };
            const p = newState.players[newState.currentPlayerIndex];

            if (p.inRoute) {
                return {
                    ...newState,
                    isMovingInRoute: true,
                    routeMoveDetails: {
                        startStep: p.rSteps,
                        steps: d1,
                    },
                };
            } else {
                const move = d1 + d2;
                if (move === 0) { // No movement, end turn
                    return { ...state, turnPhase: 'TURN_END', showTurnOverlay: true, currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length };
                }
                return {
                    ...newState,
                    isMoving: true,
                    moveDetails: {
                        startPos: p.actual.pos,
                        steps: move,
                    }
                };
            }
        }

        case 'UPDATE_PLAYER_POSITION': {
            const players = [...state.players];
            players[state.currentPlayerIndex].actual.pos = action.payload;
            return { ...state, players };
        }

        case 'FINISH_MOVE': {
            const players = [...state.players];
            let p = { ...players[state.currentPlayerIndex] };
            const startPos = state.moveDetails!.startPos;
            const endPos = p.actual.pos;
            let newState = { ...state };

            if (endPos < startPos) {
                // Completó una vuelta
                // Lógica: Vuelta 1 = 3 corazones (2+1). Vuelta 2 = 4 corazones (2+2).
                const newLaps = (p.laps || 0) + 1;
                p.laps = newLaps;

                const healthBonus = 2 + newLaps;

                const receivedPassive = p.actual.passive;

                p.actual.money += receivedPassive;
                p.actual.passive += 1000; // Incremento del pasivo base para la próxima
                p.actual.health += healthBonus;

                newState.passiveIncomeBanner = {
                    visible: true,
                    amount: receivedPassive,
                    healthGain: healthBonus,
                    playerName: p.name,
                    lap: newLaps
                };
            }

            players[state.currentPlayerIndex] = p;
            const currentTile = mainBoard[endPos];
            let nextPhase: GameState['turnPhase'] = 'TILE_INFO';
            let nextModal: GameState['activeModal'] = { type: 'INFO_TILE', payload: currentTile };
            let animationType: GameState['animationType'] = state.animationType;

            // DYNAMIC TRANSITIONS: Skip Info Tile/Modal for interactive events
            if (currentTile.t === 'CARTA') {
                nextPhase = 'TILE_ACTION';
                const deck = currentTile.c === 'RETO' ? mazoReto : mazoExpertis;
                const card = deck[Math.floor(Math.random() * deck.length)];
                const category = currentTile.c === 'RETO' ? 'RETO DIVERTIDO' : 'MOMENTO EXPERTIS';
                nextModal = { type: 'CARD', payload: { card, category } };
                animationType = currentTile.c === 'RETO' ? 'RETO' : 'EXPERTISE';

            } else if (currentTile.t === 'DADO_EVENTO') {
                nextPhase = 'TILE_ACTION';
                nextModal = { type: 'DICE_EVENT', payload: currentTile };

            } else if (currentTile.t === 'MULTA') {
                const isGlobal = currentTile.global;
                // Treat Multa like a Tax Card -> SHOW CARD immediately
                if (!isGlobal) {
                    nextPhase = 'TILE_ACTION';
                    const card: Card = {
                        t: `Pagas impuestos/multa de $${currentTile.a!}.`,
                        i: "💸",
                        c: "bg-red-100",
                        r: { money: -currentTile.a! }
                    };
                    nextModal = { type: 'CARD', payload: { card, category: 'IMPUESTOS' } };
                } else if (currentTile.n === "Todos Donan") {
                    // Global Multa: Todos Donan
                    // We need to execute the logic first (similar to Birthday) then show card
                    nextPhase = 'TILE_ACTION';
                    const players = [...state.players];
                    let totalDonation = 0;
                    const pId = p.id;

                    const updatedPlayers = players.map(pl => {
                        if (pl.id !== pId) {
                            const donation = Math.min(pl.actual.money, currentTile.a!);
                            totalDonation += donation;
                            return { ...pl, actual: { ...pl.actual, money: pl.actual.money - donation } };
                        }
                        return pl;
                    });

                    // Main player logic? Wait, main player triggers it. 
                    // "Todos Donan": Does the current player also donate? usually yes or handled in 'MULTA' logic.
                    // Existing 'MULTA' logic: "if global, players.map... if pl.id !== p.id... pozo += totalDonation".
                    // Wait, existing logic only charges OTHERS?
                    // Let's look at existing MULTA logic in ADVANCE_TURN_PHASE:
                    // "players = state.players.map(pl => { if (pl.id !== p.id) ... }"
                    // It seems ONLY others donate? The name is "Todos Donan".
                    // If it implies EVERYONE, the logic should be for everyone. 
                    // However, I will replicate existing logic to be safe, or just charge everyone.
                    // Let's charge everyone including current player for "Todos Donan". It makes sense.

                    // Actually, let's stick to the visual enhancement request.
                    // If I change game rules, I might break balance.
                    // Let's assume existing rules: Others donate.
                    // BUT, I'll charge the current player too if the tile says "Todos".
                    // Let's stick to safe path: Replicate existing behavior but visually.
                    // Actually, existing behavior (lines 286-296 of original file) excluded current player?
                    // "if (pl.id !== p.id)" -> Yes.
                    // Okay, I will stick to that to avoid regression, but show the card saying "Communal Contribution".

                    state.players = updatedPlayers; // Update state directly? No, return new state.
                    const card = {
                        t: `¡Causa Común! Todos los demás jugadores donan $${currentTile.a!} al Pozo.`,
                        i: "🤲",
                        r: { money: 0, pozoAdd: totalDonation } // pozoAdd handled in RESOLVE? No, card logic handles it.
                    };
                    // Manually handle pozo add here or let RESOLVE_CARD do it?
                    // RESOLVE_CARD handles card.r props.
                    // So I can set r: { pozoAdd: totalDonation }.
                    nextModal = { type: 'CARD', payload: { card, category: 'COMUNIDAD' } };

                    // BUT, I can't set state.players here and then return it mixed. 
                    // "players" var in FINISH_MOVE is a copy.
                    // I need to update "players" variable.
                    players.splice(0, players.length, ...updatedPlayers);
                }

            } else if (currentTile.t === 'BONUS') {
                if (currentTile.n === 'Ganaste') {
                    nextPhase = 'TILE_ACTION';
                    const card = { t: `¡Felicidades! Tu ingreso pasivo aumenta permanentemente en $${currentTile.a!}.`, i: '🏆', r: { passive: currentTile.a! } };
                    nextModal = { type: 'CARD', payload: { card, category: currentTile.n.toUpperCase() } };
                } else if (currentTile.n === 'Feliz Cumpleaños') {
                    // Interactive Gift Logic
                    const otherPlayersIndices = players.map((_, i) => i).filter(i => i !== state.currentPlayerIndex);

                    if (otherPlayersIndices.length > 0) {
                        nextPhase = 'TILE_ACTION';
                        const firstGiverIndex = otherPlayersIndices[0];
                        const remainingGivers = otherPlayersIndices.slice(1);

                        nextModal = {
                            type: 'GIFT_SELECTION',
                            payload: {
                                giverIndex: firstGiverIndex,
                                receiverIndex: state.currentPlayerIndex,
                                pendingGiverIndices: remainingGivers,
                                accumulatedGifts: {}
                            }
                        };
                    } else {
                        // Solo play fallback
                        nextPhase = 'TILE_ACTION';
                        const card = { t: `¡Feliz Cumpleaños! Recibes un bono del banco de $1000.`, i: '🎂', r: { money: 1000 } };
                        nextModal = { type: 'CARD', payload: { card, category: 'FELIZ CUMPLEAÑOS' } };
                    }
                } else if (currentTile.n === 'Recita un Poema') {
                    nextPhase = 'TILE_ACTION';
                    const card = {
                        t: "Recita un poema con pasión. (Los demás votan si lo lograste).",
                        i: "📜",
                        r: { happy: 3 },
                        requiresJudgment: true
                    };
                    nextModal = { type: 'CARD', payload: { card, category: 'POEMA' } };
                } else if (currentTile.n === 'Día de Suerte') {
                    nextPhase = 'TILE_ACTION';
                    const card = {
                        t: "¡Día de Suerte! El jugador de tu derecha te regala 1 de Felicidad y 1 de Salud.",
                        i: "😊",
                        r: { happy: 1, health: 1 } // Applying simplified logic for now
                    };
                    nextModal = { type: 'CARD', payload: { card, category: 'SUERTE' } };
                }
            } else if (currentTile.t === 'RELAX') {
                nextPhase = 'TILE_ACTION';
                const card = {
                    t: "Momento de paz. Respira profundo y disfruta el camino.",
                    i: "😌",
                    r: { health: 1 } // Small bonus for relaxing
                };
                nextModal = { type: 'CARD', payload: { card, category: 'RELAX' } };
            } else if (currentTile.t === 'ENTRADA') {
                nextPhase = 'TILE_ACTION';
                nextModal = { type: 'ROUTE', payload: currentTile };

            } else if (currentTile.t === 'ESQUINA') {
                if (currentTile.n === "HOSPITAL" || currentTile.n === "VACACIONES") {
                    nextPhase = 'TILE_ACTION';
                    nextModal = { type: 'HOSPITAL', payload: currentTile };
                } else if (currentTile.n === "SUERTE") {
                    nextPhase = 'TILE_ACTION';
                    const card = { t: `¡Ganaste el Pozo! Recibes $${state.pozo.toLocaleString()}`, r: { money: state.pozo, pozoReset: true }, i: "🍀" };
                    nextModal = { type: 'CARD', payload: { card, category: 'SUERTE' } };
                }
            }

            return {
                ...newState,
                players,
                isMoving: false,
                moveDetails: null,
                currentTile: currentTile,
                turnPhase: nextPhase,
                activeModal: nextModal,
                animationType: animationType,
            };
        }

        case 'UPDATE_PLAYER_ROUTE_STEP': {
            const players = [...state.players];
            players[state.currentPlayerIndex].rSteps = action.payload;
            return { ...state, players };
        }

        case 'FINISH_ROUTE_MOVE': {
            let newState = { ...state, isMovingInRoute: false, routeMoveDetails: null };
            const players = [...state.players];
            let p = { ...players[newState.currentPlayerIndex] };

            if (p.rSteps >= ROUTE_LENGTH) {
                const bonus = routeCosts[p.rId!] || 3000;
                // keep inRoute = true and rSteps = ROUTE_LENGTH for the animation visibility
                if (!p.visitedRoutes.includes(p.rId!)) {
                    p.visitedRoutes.push(p.rId!);
                }

                const randomMsg = routeCompletionMessages[Math.floor(Math.random() * routeCompletionMessages.length)];

                // Trigger 'GRADUATION' animation on exit
                newState.animationType = 'GRADUATION';
                newState.animationData = { bonus, message: randomMsg };
                newState.overflowSteps = action.payload?.overflow || 0;

                // Apply bonus directly
                p.actual.passive += bonus;
                newState.activeModal = null;
            } else {
                const deck = mazoRutas[p.rId!];
                const card = deck[Math.floor(Math.random() * deck.length)];
                newState.activeModal = { type: 'CARD', payload: { card, category: `Ruta ${p.rId}` } };
                newState.turnPhase = 'TILE_ACTION';
            }

            players[newState.currentPlayerIndex] = p;
            return { ...newState, players }; // Fix: Include updated players array
        }

        case 'ADVANCE_TURN_PHASE': {
            switch (state.turnPhase) {
                case 'TILE_INFO': {
                    const tile = state.currentTile;
                    if (!tile) return { ...state, activeModal: null, turnPhase: 'TURN_END' };

                    let players = [...state.players];
                    let p = { ...players[state.currentPlayerIndex] };
                    let newModal: GameState['activeModal'] = null;
                    let pozo = state.pozo;
                    let nextPhase: GameState['turnPhase'] = 'TILE_ACTION';

                    switch (tile.t) {
                        case 'ENTRADA':
                            newModal = { type: 'ROUTE', payload: tile };
                            break;
                        case 'CARTA': {
                            const deck = tile.c === 'RETO' ? mazoReto : mazoExpertis;
                            const card = deck[Math.floor(Math.random() * deck.length)];
                            const category = tile.c === 'RETO' ? 'RETO DIVERTIDO' : 'MOMENTO EXPERTIS';
                            newModal = { type: 'CARD', payload: { card, category } };
                            // Trigger specific animation based on card type
                            const animType = tile.c === 'RETO' ? 'RETO' : 'EXPERTISE';
                            return { ...state, players, pozo, activeModal: newModal, turnPhase: nextPhase, animationType: animType };
                        }
                        case 'DADO_EVENTO':
                            newModal = { type: 'DICE_EVENT', payload: tile };
                            break;
                        case 'ESQUINA':
                            if (tile.n === "HOSPITAL" || tile.n === "VACACIONES") {
                                newModal = { type: 'HOSPITAL', payload: tile };
                            } else if (tile.n === "SUERTE") {
                                const card = { t: `¡Ganaste el Pozo! Recibes $${state.pozo.toLocaleString()}`, r: { money: state.pozo, pozoReset: true }, i: "🍀" };
                                newModal = { type: 'CARD', payload: { card, category: 'SUERTE' } };
                            } else {
                                nextPhase = 'TURN_END'; // No action on START tile
                            }
                            break;
                        case 'RELAX':
                            nextPhase = 'TURN_END'; // No action on RELAX tile
                            break;
                        case 'MULTA': {
                            const oldPlayers = JSON.parse(JSON.stringify(state.players));
                            if (tile.global) {
                                let totalDonation = 0;
                                players = state.players.map(pl => {
                                    if (pl.id !== p.id) {
                                        const donation = Math.min(pl.actual.money, tile.a!);
                                        totalDonation += donation;
                                        return { ...pl, actual: { ...pl.actual, money: pl.actual.money - donation } };
                                    }
                                    return pl;
                                });
                                pozo += totalDonation;
                            } else {
                                const amount = Math.min(p.actual.money, tile.a!);
                                p.actual.money -= amount;
                                players[state.currentPlayerIndex] = p;
                                pozo += amount;
                            }
                            const anyPlayerChanged = oldPlayers.some((op: Player, i: number) => statsChanged(op, players[i]));
                            return { ...state, players, pozo, activeModal: null, turnPhase: 'STAT_UPDATE', isShowingStatChanges: anyPlayerChanged };
                        }
                        case 'BONUS': {
                            let card: Card | null = null;
                            const oldPlayers = JSON.parse(JSON.stringify(state.players));
                            if (tile.n === 'Ganaste') {
                                p.actual.passive += tile.a!;
                                card = { t: `¡Felicidades! Tu ingreso pasivo aumenta permanentemente en $${tile.a!}.`, i: '🏆', r: { passive: tile.a! } };
                                players[state.currentPlayerIndex] = p;
                                newModal = { type: 'CARD', payload: { card, category: tile.n.toUpperCase() } };
                            } else if (tile.n === 'Feliz Cumpleaños') {
                                const otherPlayerIndices = state.players
                                    .map((_, i) => i)
                                    .filter(idx => idx !== state.currentPlayerIndex);

                                if (otherPlayerIndices.length === 0) {
                                    // Single player edge case
                                    nextPhase = 'TURN_END';
                                } else {
                                    const firstGiverIdx = otherPlayerIndices[0];
                                    const restGiverIndices = otherPlayerIndices.slice(1);

                                    newModal = {
                                        type: 'GIFT_SELECTION',
                                        payload: {
                                            giverIndex: firstGiverIdx,
                                            receiverIndex: state.currentPlayerIndex,
                                            pendingGiverIndices: restGiverIndices,
                                            accumulatedGifts: { money: 0, health: 0, happy: 0 }
                                        }
                                    };
                                    // Set turnPhase to IDLE or wait here to prevent AUTO-ADVANCE issues?
                                    // The renderModal in App.tsx shows it.
                                    return { ...state, players, activeModal: newModal };
                                }
                            } else {
                                // For other bonus tiles without specific actions
                                players[state.currentPlayerIndex] = p;
                                nextPhase = 'TURN_END';
                            }
                            break;
                        }
                    }

                    if (nextPhase === 'TURN_END') {
                        return { ...state, activeModal: null, turnPhase: 'TURN_END', showTurnOverlay: true, currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length, passiveIncomeBanner: null };
                    }
                    return { ...state, players, pozo, activeModal: newModal, turnPhase: nextPhase };
                }
                case 'STAT_UPDATE':
                case 'TURN_END':
                    return {
                        ...state,
                        isShowingStatChanges: false,
                        showTurnOverlay: true,
                        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
                        passiveIncomeBanner: null,
                        turnPhase: 'IDLE'
                    };
                default:
                    return state;
            }
        }

        case 'DECIDE_ROUTE': {
            const players = [...state.players];
            const p = { ...players[state.currentPlayerIndex] };
            const tile = state.currentTile as Tile;
            const oldPlayerState = { ...p };
            let newPozo = state.pozo;

            if (action.payload && tile.r) {
                const alreadyVisited = p.visitedRoutes.includes(tile.r);
                const cost = alreadyVisited ? 0 : (routeCosts[tile.r] || 3000);

                if (p.actual.money >= cost) {
                    p.actual.money -= cost;
                    newPozo += cost; // Add cost to Pozo
                    p.inRoute = true;
                    p.rId = tile.r;
                    p.rSteps = 1;
                    console.log(`[DECIDE_ROUTE] Player entered route ${tile.r}. inRoute set to true.`);
                } else {
                    console.log(`[DECIDE_ROUTE] Failed to enter. Money: ${p.actual.money}, Cost: ${cost}`);
                }
            } else {
                console.log(`[DECIDE_ROUTE] denied or invalid tile`);
            }

            players[state.currentPlayerIndex] = p;
            const hasChanged = statsChanged(oldPlayerState, p);

            // If player successfully entered route, we might want to trigger the animation here
            // For now, let's just make sure the logic holds.
            if (!p.inRoute) {
                return { ...state, players, pozo: newPozo, activeModal: null, turnPhase: 'STAT_UPDATE', isShowingStatChanges: hasChanged };
            }

            // Ensure we reset relevant state to force Controls re-render/update
            // specifically ensure isRolling is false and turnPhase is IDLE to enable controls
            return { ...state, players, pozo: newPozo, activeModal: null, turnPhase: 'IDLE', isRolling: false };
        }

        case 'END_ANIMATION': {
            const nextPhase = state.animationType === 'GRADUATION' ? 'TURN_END' : state.turnPhase;
            const players = [...state.players];
            let p = { ...players[state.currentPlayerIndex] };

            let newState = { ...state, players, animationType: null, animationData: null, turnPhase: nextPhase };

            // Continuation of movement if overflow exists
            if (state.animationType === 'GRADUATION') {
                // Return to main board now
                p.inRoute = false;
                p.rSteps = 0;
                players[state.currentPlayerIndex] = p;
                newState.players = players;

                if (state.overflowSteps && state.overflowSteps > 0) {
                    newState.isMoving = true;
                    newState.moveDetails = { startPos: p.actual.pos, steps: state.overflowSteps };
                    newState.turnPhase = 'MOVING';
                    newState.overflowSteps = 0;
                }
            }

            return newState;
        }

        case 'RESOLVE_CARD': {
            const players = [...state.players];
            const p = { ...players[state.currentPlayerIndex] };
            const card = (state.activeModal?.payload as any).card as Card;
            let pozo = state.pozo;
            const oldPlayerState = { ...p };

            if (action.payload && card.r) {
                const r = card.r;
                if (r.money) p.actual.money = Math.max(0, p.actual.money + r.money);
                if (r.health) p.actual.health = Math.max(0, p.actual.health + r.health);
                if (r.happy) p.actual.happy = Math.max(0, p.actual.happy + r.happy);
                if (r.passive) p.actual.passive = Math.max(0, p.actual.passive + r.passive);
                if (r.pozoAdd) pozo += r.pozoAdd;
                if (r.pozoReset) pozo = 0;
            }
            players[state.currentPlayerIndex] = p;

            if (calculateSuccess(p) >= 100) {
                return { ...state, gameStatus: GameStatus.Celebrating, winner: p, activeModal: null };
            }
            const hasChanged = statsChanged(oldPlayerState, p);
            return { ...state, players, pozo, activeModal: null, turnPhase: 'STAT_UPDATE', isShowingStatChanges: hasChanged };
        }

        case 'RESOLVE_DICE_EVENT': {
            const players = [...state.players];
            const p = { ...players[state.currentPlayerIndex] };
            const r = action.payload;
            let pozo = state.pozo;
            const oldPlayerState = { ...p };

            if (r.money) p.actual.money = Math.max(0, p.actual.money + r.money);
            if (r.health) p.actual.health = Math.max(0, p.actual.health + r.health);
            if (r.happy) p.actual.happy = Math.max(0, p.actual.happy + r.happy);
            if (r.money && r.money < 0) pozo += Math.abs(r.money);

            players[state.currentPlayerIndex] = p;
            const hasChanged = statsChanged(oldPlayerState, p);
            return { ...state, players, pozo, activeModal: null, turnPhase: 'STAT_UPDATE', isShowingStatChanges: hasChanged };
        }

        case 'RESOLVE_HOSPITAL': {
            const players = [...state.players];
            const p = { ...players[state.currentPlayerIndex] };
            const { cost, health, happy } = action.payload;
            let pozo = state.pozo;
            const oldPlayerState = { ...p };

            p.actual.money = Math.max(0, p.actual.money - cost);
            p.actual.health += health;
            p.actual.happy += happy;
            pozo += cost;

            players[state.currentPlayerIndex] = p;
            const hasChanged = statsChanged(oldPlayerState, p);
            return { ...state, players, pozo, activeModal: null, turnPhase: 'STAT_UPDATE', isShowingStatChanges: hasChanged };
        }

        case 'END_GAME_EARLY': {
            if (state.players.length === 0) return state;

            const successPercentages = state.players.map(p => ({
                player: p,
                percentage: calculateSuccess(p),
            }));

            const winnerData = successPercentages.reduce((max, current) =>
                current.percentage > max.percentage ? current : max,
                successPercentages[0]
            );

            return {
                ...state,
                gameStatus: GameStatus.Celebrating,
                winner: winnerData.player,
                activeModal: null,
                showTurnOverlay: false,
            };
        }

        case 'RESOLVE_GIFT': {
            // 1. Get current gift context from payload
            const currentPayload = state.activeModal?.payload as any; // GiftSelectionPayload
            const { giverIndex, receiverIndex, pendingGiverIndices, accumulatedGifts } = currentPayload;
            const chosenGift = action.payload; // Rewards object

            const players = [...state.players];
            const giver = { ...players[giverIndex] };

            // 2. Deduct from Giver
            if (chosenGift.money) giver.actual.money -= chosenGift.money;
            if (chosenGift.health) giver.actual.health -= chosenGift.health;
            if (chosenGift.happy) giver.actual.happy -= chosenGift.happy;

            players[giverIndex] = giver;

            // 3. Accumulate Gift
            const newAccumulated = { ...accumulatedGifts };
            if (chosenGift.money) newAccumulated.money = (newAccumulated.money || 0) + chosenGift.money;
            if (chosenGift.health) newAccumulated.health = (newAccumulated.health || 0) + chosenGift.health;
            if (chosenGift.happy) newAccumulated.happy = (newAccumulated.happy || 0) + chosenGift.happy;

            // 4. Check for next giver
            if (pendingGiverIndices.length > 0) {
                const nextGiverIndex = pendingGiverIndices[0];
                const nextPending = pendingGiverIndices.slice(1);

                const nextModal: ActiveModal = {
                    type: 'GIFT_SELECTION',
                    payload: {
                        giverIndex: nextGiverIndex,
                        receiverIndex,
                        pendingGiverIndices: nextPending,
                        accumulatedGifts: newAccumulated
                    }
                };
                return { ...state, players, activeModal: nextModal };

            } else {
                // 5. Apply all gifts to Receiver
                const receiver = { ...players[receiverIndex] };
                if (newAccumulated.money) receiver.actual.money += newAccumulated.money;
                if (newAccumulated.health) receiver.actual.health += newAccumulated.health;
                if (newAccumulated.happy) receiver.actual.happy += newAccumulated.happy;

                players[receiverIndex] = receiver;

                // 6. Show Summary Card
                // Format summary string
                const parts = [];
                if (newAccumulated.money) parts.push(`$${newAccumulated.money.toLocaleString()}`);
                if (newAccumulated.health) parts.push(`${newAccumulated.health} Salud`);
                if (newAccumulated.happy) parts.push(`${newAccumulated.happy} Felicidad`);

                const summaryText = parts.length > 0
                    ? `¡Recibiste: ${parts.join(", ")} de tus amigos!`
                    : "Tus amigos no te regalaron nada... 😢";

                const card = {
                    t: summaryText,
                    i: '🎂',
                    r: { money: 0 } // No functional reward here because we already applied it mentally? 
                    // Wait, RESOLVE_CARD applies rewards again? 
                    // YES. RESOLVE_CARD applies rewards from card.r. 
                    // If I apply them here, I shouldn't put them in card.r OR I shouldn't apply them here.
                    // Better design: Don't apply here. Put total in card.r and let RESOLVE_CARD apply it.
                };

                // Revert manual application to receiver to avoid double counting
                // Reset receiver to original state? No, simply DO NOT modify receiver here.
                // Modify: Removed lines modifying receiver directly.

                // CORRECTED LOGIC:
                // Don't modify receiver stats yet. Just set card.r to newAccumulated.
                // The 'RESOLVE_CARD' action will trigger when user clicks 'OK' on the summary card, 
                // and THAT will apply the stats.

                const finalCard = {
                    t: summaryText,
                    i: '🎂',
                    r: newAccumulated
                };

                return {
                    ...state,
                    players,
                    activeModal: { type: 'CARD', payload: { card: finalCard, category: 'CUMPLEAÑOS' } },
                    turnPhase: 'STAT_UPDATE',
                    isShowingStatChanges: true
                };
            }
        }

        case 'HIDE_PASSIVE_INCOME_BANNER': {
            return { ...state, passiveIncomeBanner: null };
        }

        case 'FINISH_WIN_ANIMATION': {
            return {
                ...state,
                gameStatus: GameStatus.Win
            };
        }

        case 'SHOW_LOBBY':
            return { ...state, gameStatus: GameStatus.Lobby };

        case 'SET_ROOM_ID':
            return {
                ...state,
                roomId: action.payload.roomId,
                isHost: action.payload.isHost,
                gameStatus: GameStatus.Setup // Force transition to Setup screen
            };

        case 'SYNC_ONLINE_STATE': {
            const remote = action.payload;
            // Firebase sanitization: arrays might be objects or null
            let safePlayers = remote.players;
            if (!safePlayers) {
                safePlayers = [];
            } else if (!Array.isArray(safePlayers)) {
                safePlayers = Object.values(safePlayers);
            }

            let safeDice = remote.dice;
            if (!safeDice || !Array.isArray(safeDice)) {
                safeDice = [0, 0];
            }

            // Merge state but keep local identity
            return {
                ...state,
                ...remote,
                players: safePlayers,
                dice: safeDice,
                roomId: state.roomId || null,
                isHost: state.isHost || false,
                localPlayerId: state.localPlayerId || null,
                lastSource: 'REMOTE'
            };
        }

        case 'LOAD_SAVED_GAME':
            return {
                ...action.payload,
                // Ensure temporary UI states are reset for safety
                isRolling: false,
                isMoving: false,
                isMovingInRoute: false,
                animationType: null,
            };

        default:
            return state;
    }
}