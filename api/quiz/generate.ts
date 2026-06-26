import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function getFallbackQuizResponse(topic: string, language: string): any[] {
  const normTopic = (topic || "").toLowerCase();
  const lang = (language || "English").toLowerCase();

  let detectedTopic = "general";
  if (normTopic.includes("photo") || normTopic.includes("plant") || normTopic.includes("biol") || normTopic.includes("संश्लेषण")) {
    detectedTopic = "photosynthesis";
  } else if (normTopic.includes("fraction") || normTopic.includes("math") || normTopic.includes("decimal") || normTopic.includes("भिन्न")) {
    detectedTopic = "fractions";
  } else if (normTopic.includes("water") || normTopic.includes("cycle") || normTopic.includes("rain") || normTopic.includes("जल")) {
    detectedTopic = "water_cycle";
  } else if (normTopic.includes("force") || normTopic.includes("motion") || normTopic.includes("push") || normTopic.includes("pull") || normTopic.includes("बल")) {
    detectedTopic = "force_motion";
  }

  if (detectedTopic === "photosynthesis") {
    if (lang === "hindi") {
      return [
        { question: "पौधों को भोजन बनाने के लिए किस ऊर्जा स्रोत की आवश्यकता होती है?", options: ["बिजली", "सूरज की रोशनी (Sunlight)", "चंद्रमा की चांदनी", "पवन ऊर्जा"], correctAnswer: "सूरज की रोशनी (Sunlight)", explanation: "बहुत अच्छे बेटा! सूरज की रोशनी वह मुख्य ईंधन है।" },
        { question: "पत्तियों का हरा रंग किस पिगमेंट के कारण होता है?", options: ["क्लोरोफिल (Chlorophyll)", "हीमोग्लोबिन", "कैरोटीन", "पानी"], correctAnswer: "क्लोरोफिल (Chlorophyll)", explanation: "शाबाश! क्लोरोफिल ही वह जादुई शेफ है।" },
        { question: "प्रकाश संश्लेषण के दौरान पौधे कौन सी गैस छोड़ते हैं?", options: ["नाइट्रोजन", "कार्बन डाइऑक्साइड", "ऑक्सीजन (Oxygen)", "हाइड्रोजन"], correctAnswer: "ऑक्सीजन (Oxygen)", explanation: "अद्भुत जवाब! पौधे ऑक्सीजन गैस बाहर छोड़ते हैं।" }
      ];
    } else {
      return [
        { question: "Which energy source is required by plants to make their food?", options: ["Electricity", "Sunlight", "Wind power", "Moonlight"], correctAnswer: "Sunlight", explanation: "Excellent! Sunlight is the main energy fuel." },
        { question: "What is the green pigment in leaves called?", options: ["Chlorophyll", "Hemoglobin", "Melanin", "Carotene"], correctAnswer: "Chlorophyll", explanation: "Great! Chlorophyll captures sunlight." },
        { question: "Which gas is released by plants during Photosynthesis?", options: ["Nitrogen", "Carbon Dioxide", "Oxygen", "Helium"], correctAnswer: "Oxygen", explanation: "Spot on! Plants release oxygen gas." }
      ];
    }
  }

  if (detectedTopic === "fractions") {
    return [
      { question: "In the fraction '5/8', what is the bottom number 8 called?", options: ["Numerator", "Denominator", "Whole number", "Decimal"], correctAnswer: "Denominator", explanation: "Correct! The bottom number is the Denominator." },
      { question: "If you divide an apple into 4 equal slices and eat 1, what fraction is left?", options: ["1/4", "3/4", "2/4", "4/4"], correctAnswer: "3/4", explanation: "Great! 1 slice eaten leaves 3 out of 4." },
      { question: "Which fraction is equivalent to '1/3'?", options: ["2/6", "3/6", "2/3", "1/6"], correctAnswer: "2/6", explanation: "Excellent! '2/6' simplifies to '1/3'." }
    ];
  }

  if (detectedTopic === "water_cycle") {
    return [
      { question: "What is the process where liquid water turns into gas?", options: ["Evaporation", "Condensation", "Precipitation", "Respiration"], correctAnswer: "Evaporation", explanation: "Correct! Sun heats water into gas." },
      { question: "Water droplets in the sky combine to form clouds. What is this called?", options: ["Condensation", "Evaporation", "Freezing", "Precipitation"], correctAnswer: "Condensation", explanation: "Well done! Condensation forms clouds." },
      { question: "Rain falling from clouds is called:", options: ["Precipitation", "Evaporation", "Condensation", "Runoff"], correctAnswer: "Precipitation", explanation: "Superb! Precipitation is water falling back to Earth." }
    ];
  }

  if (detectedTopic === "force_motion") {
    return [
      { question: "A push or pull on an object is called:", options: ["Force", "Motion", "Gravity", "Inertia"], correctAnswer: "Force", explanation: "Spot on! Push or pull is a force." },
      { question: "Which force slows down sliding objects?", options: ["Friction", "Gravity", "Magnetic force", "Centrifugal force"], correctAnswer: "Friction", explanation: "Excellent! Friction opposes motion." },
      { question: "What force keeps planets orbiting the Sun?", options: ["Gravity", "Friction", "Electricity", "Magnetism"], correctAnswer: "Gravity", explanation: "Correct! Gravity keeps planets in orbit." }
    ];
  }

  // Default general quiz
  return [
    { question: "Which is a healthy food habit?", options: ["Eating balanced meals with fruits and veggies", "Eating junk food daily", "Skipping breakfast", "Drinking sodas"], correctAnswer: "Eating balanced meals with fruits and veggies", explanation: "A balanced diet provides essential vitamins." },
    { question: "Which planet do we live on?", options: ["Mars", "Earth", "Venus", "Jupiter"], correctAnswer: "Earth", explanation: "Earth is our beautiful home planet." },
    { question: "How many hours are in one day?", options: ["12 hours", "24 hours", "60 hours", "30 hours"], correctAnswer: "24 hours", explanation: "One full day has 24 hours." }
  ];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic, language, grade, weaknesses = [] } = req.body;

  try {
    const quizInstruction = `You are a professional educational assessor. Generate exactly 3 multiple-choice questions (MCQs) to evaluate a student's understanding of the topic: "${topic}".
Grade level: ${grade || "School level"}.
Focus Areas/Struggles: ${weaknesses.length > 0 ? weaknesses.join(", ") : "General introduction"}.

Language requirement:
- If language is "Hindi", formulate the questions, options, and explanations in polite simple Hindi (Devanagari script).
- If language is "Hinglish", formulate the questions, options, and explanations in friendly conversational Hinglish.
- If language is "English", formulate them in simple, clear English.

Each question must have exactly 4 choices and exactly 1 correct answer.
Explanations should be very encouraging, praising correct answers, and giving gentle, easy-to-understand explanations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a quiz of 3 multiple-choice questions for topic: "${topic}". Language: ${language}.`,
      config: {
        systemInstruction: quizInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "An array of exactly 3 multiple-choice quiz questions.",
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The question statement." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 choices." },
              correctAnswer: { type: Type.STRING, description: "The correct option text. MUST match one of the options." },
              explanation: { type: Type.STRING, description: "A warm, kid-friendly explanation." },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const quizData = JSON.parse(jsonText.trim());

    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Invalid format received");
    }

    return res.json(quizData);
  } catch (error: any) {
    console.log("[Info] Initiating local quiz generator...");
    const fallbackQuizzes = getFallbackQuizResponse(topic || "General", language || "English");
    return res.json(fallbackQuizzes);
  }
}
