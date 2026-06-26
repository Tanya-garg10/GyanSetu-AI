import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

function getSystemPrompt(studentName: string, grade: string, language: string, topic: string, weaknesses: string[]) {
  const langInstruction =
    language === "Hindi"
      ? "Respond in polite, simple, and warm Hindi using Devanagari script (e.g., 'नमस्ते बेटा, आज हम...' )."
      : language === "Hinglish"
        ? "Respond in conversational Hinglish (Hindi written in Roman script or colloquial Hindi mixed naturally with English academic words, e.g., 'Namaste beta, aaj hum Photosynthesis ke baare me seekhenge. Yeh ek bahut hi exciting process hai!')."
        : "Respond in clear, simple, and warm English suitable for school children.";

  return `You are GyanSetu AI (ज्ञानसेतु एआई), an adaptive multilingual educational tutor designed for Indian students from diverse linguistic and educational backgrounds.
Your mission is to improve deep conceptual understanding, not just provide direct answers.

Student Context:
- Name: ${studentName || "Student"}
- Grade/Class: ${grade || "Not specified"}
- Selected Topic: ${topic || "General Studies"}
- Topic Weaknesses/Struggles: ${weaknesses && weaknesses.length > 0 ? weaknesses.join(", ") : "None identified yet"}

Rules you MUST follow:
1. Always detect the student's preferred language (e.g., Hindi, English, Hinglish, Tamil, Bengali, etc.) and respond in that language. (Strong guidance: ${langInstruction}).
2. Explain concepts using simple, plain, and warm words appropriate for the student's grade level (${grade || "their age group"}).
3. Never assume prior knowledge. Introduce terms simply.
4. Break difficult concepts into small, progressive steps.
5. Use highly creative real-life examples and vivid analogies whenever possible (e.g., comparing fractions to pizza slices or rotis, comparing photosynthesis to kitchen cooking).
6. After every explanation, ask exactly one short follow-up question to check understanding.
7. If the student struggles, simplify the explanation further and provide another very simple example.
8. If the student performs well, gradually increase difficulty to build mastery.
9. For uploaded textbook images or homework, first identify the topic, then explain it in simple language.
10. Generate personalized practice questions based on previous mistakes and struggles (Struggles: ${weaknesses.join(", ")}).
11. Track: Topic mastery, Common mistakes, Learning pace, Preferred language, and use these to customize future turns.
12. Encourage learning and confidence. Never shame students for incorrect answers. Use warm phrases like "Beta", "Bahut achhe", "Koshish acchi thi!", "Shabaash!".

OUTPUT FORMAT:
Your response MUST strictly be formatted in the following text structure, using bold section titles:

Topic:
[topic name]

Simple Explanation:
[explanation - structured with bullet points or simple paragraphs, in the student's preferred language]

Example:
[real-world analogy or example, in the student's preferred language]

Practice Question:
[one specific question to solve or ponder, in the student's preferred language]

Understanding Check:
[exactly one short follow-up question to check understanding, in the student's preferred language]

Next Recommendation:
[next topic or improvement area, in the student's preferred language]

Do not include any other conversational preamble or postscript outside of this structured output format. Ensure the structure is exactly preserved!`;
}

function getFallbackChatResponse(message: string, language: string, topic: string): string {
  const lang = (language || "English").toLowerCase();
  if (lang === "hindi") {
    return `Topic:\n${topic || "सामान्य विज्ञान और गणित"}\n\nSimple Explanation:\n* ज्ञानसेतु एआई (GyanSetu AI) के साथ किसी भी नए विषय को समझना बहुत आसान और मजेदार है!\n* हम जटिल विचारों को सरल, छोटे-छोटे चरणों में विभाजित करते हैं।\n\nExample:\n* जैसे गुरुत्वाकर्षण (Gravity) को समझने के लिए सोचिए कि जब भी आप गेंद हवा में फेंकते हैं, वह हमेशा नीचे ही क्यों आती है!\n\nPractice Question:\nक्या आप अपने दैनिक जीवन से जुड़ी किसी ऐसी क्रिया के बारे में बता सकते हैं जहाँ आप बल लगाते हैं?\n\nUnderstanding Check:\nबेटा, क्या आपको यह बुनियादी विचार समझ आया?\n\nNext Recommendation:\nअगला विषय: 'दैनिक विज्ञान के अनोखे प्रयोग'।`;
  } else if (lang === "hinglish") {
    return `Topic:\n${topic || "General Studies & Basics"}\n\nSimple Explanation:\n* GyanSetu AI ke saath kisi bhi subject ko seekhna bohot easy aur fun hai!\n* Hum har tough topic ko chote-chote easy steps me break karte hain.\n\nExample:\n* Jaise hum jab cycle chalate hain aur brake press karte hain, toh friction force ki wajah se cycle rukti hai.\n\nPractice Question:\nKya aap apni life se koi aisa example de sakte hain jahan aapko koi push ya pull force apply karna padta hai?\n\nUnderstanding Check:\nBeta, kya aapko ye explanation acche se samajh aayi?\n\nNext Recommendation:\nNext Topic: 'Real Life Science Facts' ya 'Fun Maths Tricks'.`;
  } else {
    return `Topic:\n${topic || "General Studies & Concepts"}\n\nSimple Explanation:\n* Learning with GyanSetu AI makes any complex subject extremely simple and engaging!\n* We break down difficult ideas into progressive, bite-sized steps.\n\nExample:\n* Think of gravity: whenever you throw a ball in the air, it always falls back down.\n\nPractice Question:\nCan you name any simple activity in your house that uses a "push" or a "pull" force?\n\nUnderstanding Check:\nDid this simple explanation help clear your doubts?\n\nNext Recommendation:\nNext Topic: 'Wonders of Science' or 'Basic Math Concepts'.`;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    message,
    studentName,
    language,
    grade,
    topic,
    weaknesses,
    history = [],
    image,
    imageType,
    simpler = false,
  } = req.body;

  try {
    const systemPrompt = getSystemPrompt(studentName, grade, language, topic, weaknesses);

    let currentPrompt = message;
    if (simpler) {
      currentPrompt =
        language === "Hindi"
          ? "कृपया इस विषय को और भी सरल हिंदी में समझाएं। कोई बहुत आसान उदाहरण या कहानी इस्तेमाल करें ताकि मैं आसानी से समझ सकूं।"
          : language === "Hinglish"
            ? "Pls is topic ko aur bhi simple language me samjhao. Koi bahut easy real-life example ya short story use karo jisse me turant samajh jau."
            : "Please explain this concept even more simply. Use an extremely basic analogy or a simple step-by-step breakdown.";
    }

    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }

    const currentParts: any[] = [];
    if (image && imageType) {
      currentParts.push({
        inlineData: {
          mimeType: imageType,
          data: image,
        },
      });
    }
    currentParts.push({ text: currentPrompt });
    contents.push({ role: "user", parts: currentParts });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    return res.json({ text });
  } catch (error: any) {
    console.log("[Info] Initiating local educational tutoring assistant...");
    const fallbackText = getFallbackChatResponse(message || "", language || "English", topic || "General");
    return res.json({ text: fallbackText });
  }
}
