/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Player } from "../types";

// Fallback "Mock" mentors for simulation mode
const MOCK_MENTORS = [
    { name: "Steve Jobs", feedback: "Tu diseño de vida es minimalista pero efectivo. Has logrado conectar los puntos hacia atrás. Mantente hambriento, mantente alocado." },
    { name: "Einstein", feedback: "La vida es como montar en bicicleta. Para mantener el equilibrio, debes seguir moviéndote. Tu balance de éxito y bienestar es admirable." },
    { name: "Yoda", feedback: "El éxito en ti veo, joven aprendiz. El equilibrio entre tu paz mental y tus metas la verdadera fuerza demuestra." },
    { name: "Marie Curie", feedback: "Nada en la vida debe ser temido, solo comprendido. Tu balance de conocimiento y salud demuestra que has dominado las leyes de este juego." },
    { name: "Cleopatra", feedback: "Has construido un imperio de éxito con la astucia de una reina. Que tu prosperidad sea tan inagotable como el Nilo mismo." },
    { name: "Marco Aurelio", feedback: "La felicidad de tu vida depende de la calidad de tus pensamientos. Tus estadísticas reflejan una mente ordenada y un propósito claro." },
    { name: "Dalai Lama", feedback: "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito. Tu armonía interna es tu mayor trofeo." },
    { name: "Frida Kahlo", feedback: "Pies, ¿para qué los quiero si tengo alas para volar? Has volado alto en este camino, transformando cada reto en una obra maestra." },
    { name: "Elon Musk", feedback: "Has optimizado tus recursos para alcanzar la órbita del éxito. Ahora, asegúrate de que tu soporte vital (salud y familia) sea sostenible." },
    { name: "Oprah Winfrey", feedback: "Conviértete en lo que crees. Tu victoria de hoy es solo el reflejo de la pasión y el equilibrio que has puesto en cada turno." }
];

export const generateMentorFeedback = async (winner: Player): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    // DIAGNOSTIC LOGGING
    console.log("IA Diagnostic - Key present:", !!apiKey, "Length:", apiKey?.length);
    if (apiKey) console.log("IA Diagnostic - Key prefix:", apiKey.substring(0, 7));

    if (!apiKey || apiKey === "undefined" || apiKey.includes("pegatuclave")) {
        console.warn("Gemini API Key missing, undefined or default. Mode: Simulation.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        const randomMentor = MOCK_MENTORS[Math.floor(Math.random() * MOCK_MENTORS.length)];
        return `"${randomMentor.feedback}" \n\n— ${randomMentor.name} (Simulado)`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Fallback strategy: Try all possible variations for version v1/v1beta
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-latest"
    ];

    const prompt = `
        Eres un mentor legendario (como Steve Jobs, Einstein, Cleopatra, o Yoda). 
        El jugador ${winner.name} ha ganado el juego "Camino al Éxito".
        Estadísticas finales:
        - Dinero: $${winner.actual.money}
        - Salud: ${winner.actual.health}%
        - Felicidad: ${winner.actual.happy}%
        - Metas cumplidas: ${winner.metas.d}
        
        Dale un consejo épico y breve (max 2 frases) sobre su vida futura basado en estos datos. 
        Si tiene mucho dinero pero poca salud, adviértele. Si está equilibrado, felicítalo.
        Firma con el nombre del personaje.
    `;

    let lastErrorMessage = "";

    for (const modelName of modelsToTry) {
        try {
            console.log(`Intentando conectar con modelo: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text) return text;
        } catch (error: any) {
            console.error(`Error con ${modelName}:`, error);
            // Prepend model name to help user identify which one failed
            lastErrorMessage = `[${modelName}] ${error?.message || String(error)}`;
        }
    }

    // FALLBACK SILENCIOSO Y ELEGANTE
    console.warn("La IA no respondió a tiempo. Usando sabiduría ancestral offline.");
    const randomMentor = MOCK_MENTORS[Math.floor(Math.random() * MOCK_MENTORS.length)];
    return `"${randomMentor.feedback}" \n\n— ${randomMentor.name}`;
};
