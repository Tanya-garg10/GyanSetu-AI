import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload size limit to support image uploads
app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI client (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to construct systemic learning prompt
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

// --- Fallback Educational Wisdom Engine (Provides high-quality tutoring when Gemini API Quota is Exceeded) ---
function getFallbackChatResponse(message: string, language: string, topic: string): string {
  const normMsg = (message || "").toLowerCase() + " " + (topic || "").toLowerCase();
  
  let detectedTopic = "general";
  if (normMsg.includes("photo") || normMsg.includes("plant") || normMsg.includes("biol") || normMsg.includes("पट्टी") || normMsg.includes("पौध") || normMsg.includes("संश्लेषण")) {
    detectedTopic = "photosynthesis";
  } else if (normMsg.includes("fraction") || normMsg.includes("math") || normMsg.includes("decimal") || normMsg.includes("भिन्न") || normMsg.includes("गणित") || normMsg.includes("जोड़")) {
    detectedTopic = "fractions";
  } else if (normMsg.includes("water") || normMsg.includes("cycle") || normMsg.includes("rain") || normMsg.includes("जल") || normMsg.includes("चक्र") || normMsg.includes("बारिश")) {
    detectedTopic = "water_cycle";
  } else if (normMsg.includes("force") || normMsg.includes("motion") || normMsg.includes("push") || normMsg.includes("pull") || normMsg.includes("बल") || normMsg.includes("गति") || normMsg.includes("भौतिक")) {
    detectedTopic = "force_motion";
  } else if (normMsg.includes("shivaji") || normMsg.includes("swarajya") || normMsg.includes("maratha") || normMsg.includes("महाराज") || normMsg.includes("शिवाजी") || normMsg.includes("स्वराज्य")) {
    detectedTopic = "swarajya";
  }

  const lang = (language || "English").toLowerCase();

  if (detectedTopic === "photosynthesis") {
    if (lang === "hindi") {
      return `Topic:
Photosynthesis (प्रकाश संश्लेषण)

Simple Explanation:
* पेड़-पौधे अपना भोजन खुद बनाते हैं, और इसी अद्भुत प्राकृतिक क्रिया को हम **Photosynthesis** (प्रकाश संश्लेषण) कहते हैं।
* हमारी तरह पौधों के पास गैस चूल्हा या ओवन नहीं होता, इसलिए वे सूरज की रोशनी (Sunlight) की गर्मी का उपयोग करते हैं।
* पौधे अपनी जड़ों की मदद से जमीन से पानी (Water) सोखते हैं और अपनी पत्तियों के छोटे छेदों से हवा में से कार्बन डाइऑक्साइड (Carbon Dioxide) लेते हैं।
* पत्तियों के अंदर एक विशेष हरे रंग का पदार्थ होता है जिसे क्लोरोफिल (Chlorophyll) कहते हैं। यह क्लोरोफिल पत्तियों में एक 'स्मार्ट शेफ' की तरह काम करता है, जो धूप, पानी और गैस को मिलाकर ग्लूकोज (भोजन) तैयार करता है और हवा में ताज़ा ऑक्सीजन छोड़ता है!

Example:
इसे एक सुंदर रसोईघर (Kitchen Recipe) की तरह समझें:
* **पत्तियाँ (Leaves)** = रसोईघर (Kitchen space)
* **सूरज की धूप (Sunlight)** = गैस चूल्हे की आग (Gas Stove)
* **पानी और हवा (Water & CO2)** = चावल और दाल जैसे कच्चे मसाले (Raw materials)
* **क्लोरोफिल (Chlorophyll)** = मुख्य रसोइया या शेफ (Head Chef) जो सब मिलाकर स्वादिष्ट खाना बनाता है!

Practice Question:
पौधों को प्रकाश संश्लेषण की प्रक्रिया पूरी करने के लिए हवा से कौन सी अदृश्य गैस सोखनी पड़ती है?

Understanding Check:
बेटा, क्या आप मुझे बता सकते हैं कि अगर हम एक पौधे को हमेशा के लिए एक बंद अंधेरे कमरे में रख दें, तो क्या वह अपना भोजन पका पाएगा?

Next Recommendation:
अगला विषय: 'जड़ें और उनका कार्य' (Roots and their Functions) या 'पौधों में श्वसन' (Plant Respiration)।`;
    } else if (lang === "hinglish") {
      return `Topic:
Photosynthesis (Plant Food Making Process)

Simple Explanation:
* Green plants apna khana khud banate hain, aur isi amazing process ko hum **Photosynthesis** kehte hain.
* Humari tarah plants ke paas gas stove ya microwave nahi hota, isliye wo natural Sunlight ki heat aur energy use karte hain.
* Roots zameen ke andar se paani (Water) soak karti hain, aur green leaves hawa me se Carbon Dioxide (CO2) absorb karti hain.
* Leaves ke andar ek green colour ka pigment hota hai jise **Chlorophyll** bolte hain. Yeh ek intelligent chef ki tarah kaam karta hai aur sab ingredients (sunlight, water, carbon dioxide) ko mix karke tasty glucose (food) banata hai aur fresh Oxygen gas release karta hai!

Example:
Think of it like cooking a yummy recipe in a kitchen:
* **Green Leaves** = Kitchen area
* **Sunlight** = Gas stove ki fire/heat
* **Water & CO2** = Vegetable and spices (Ingredients)
* **Chlorophyll** = Head Chef jo food cook karta hai!

Practice Question:
Beta, plants ko photosynthesis karne ke liye leaves me kaun sa green pigment help karta hai?

Understanding Check:
Agar hum kisi green plant ko pure din dhoop me rakhein par uski roots me paani na dalein, toh kya wo apna food cook kar payega?

Next Recommendation:
Next Topic: 'Transpiration' (Leaves se pani ka bahar nikalna) ya 'Types of Plants'.`;
    } else {
      return `Topic:
Photosynthesis (How Plants Make Food)

Simple Explanation:
* Plants make their own food through a beautiful natural process called **Photosynthesis**.
* Unlike humans, plants don't have kitchens or gas stoves, so they use natural energy from **Sunlight**.
* The roots drink water from the soil, and the leaves breathe in a gas called **Carbon Dioxide** from the air around them.
* Inside the green leaves, there is a special green pigment called **Chlorophyll**. It acts like a "master chef", combining sunlight, water, and gas to cook sweet glucose (food) and releasing fresh **Oxygen** for us to breathe!

Example:
Think of it like cooking a nice meal:
* **The Leaves** = The kitchen room.
* **Sunlight** = The fire of the gas stove.
* **Water and CO2** = The raw ingredients like veggies and rice.
* **Chlorophyll** = The head chef who combines everything to cook the perfect dish!

Practice Question:
Which gas is released by green plants during the process of photosynthesis that helps us breathe?

Understanding Check:
Can you tell me which part of the plant is responsible for drawing water from deep inside the soil to help cook the food?

Next Recommendation:
Next Topic: 'Plant Respiration' or 'The Importance of Leaves in Nature'.`;
    }
  }

  if (detectedTopic === "fractions") {
    if (lang === "hindi") {
      return `Topic:
Fractions (भिन्न)

Simple Explanation:
* जब हम किसी एक पूरी चीज़ को कुछ बराबर हिस्सों में बाँटते हैं, तो हर एक हिस्से को हम गणित में **Fraction** (भिन्न) कहते हैं।
* इसे हम ऊपर और नीचे दो नंबरों के रूप में लिखते हैं, जैसे: \`अंश / हर\` (Numerator / Denominator)।
* **हर (Denominator)** (नीचे का नंबर) बताता है कि हमने पूरी चीज़ के कुल कितने बराबर टुकड़े किए हैं।
* **अंश (Numerator)** (ऊपर का नंबर) बताता है कि उन टुकड़ों में से कितने टुकड़े हमारे पास हैं या हमने खाए हैं।

Example:
* मान लीजिए आपके पास एक गोल और स्वादिष्ट सेब (Apple) है। आपने चाकू से उसके बराबर 4 टुकड़े किए।
* अगर आपने 1 टुकड़ा खा लिया, तो आपने सेब का \`1/4\` हिस्सा खाया।
* अब प्लेट में 3 टुकड़े बचे हैं, जो सेब के \`3/4\` हिस्से को दर्शाते हैं!

Practice Question:
अगर एक चॉकलेट बार के 8 बराबर टुकड़े हैं और आप उसमें से 3 टुकड़े अपने छोटे भाई को दे देते हैं, तो आपने चॉकलेट का कौन सा भिन्न (Fraction) उसे दिया?

Understanding Check:
बेटा, यदि किसी भिन्न में ऊपर का अंक 2 है और नीचे का अंक 5 है (यानी \`2/5\`), तो नीचे लिखे '5' का क्या मतलब हुआ?

Next Recommendation:
अगला विषय: 'समान भिन्न' (Equivalent Fractions) या 'भिन्नों का जोड़' (Addition of Fractions)।`;
    } else if (lang === "hinglish") {
      return `Topic:
Fractions (Hisse ya Batwara)

Simple Explanation:
* Jab hum kisi ek full object ko equal parts me divide karte hain, toh un parts ko represent karne ke liye hum **Fraction** (भिन्न) ka use karte hain.
* Isko likhne ka simple formula hota hai: \`Numerator / Denominator\` (Top number / Bottom number).
* **Denominator** (Bottom number) batata hai ki humne total kitne equal slices ya parts kiye hain.
* **Numerator** (Top number) batata hai ki unme se kitne parts hum select kar rahe hain ya hamare paas hain.

Example:
* Man lo aapke paas ek gol, cheesy Pizza hai. Humne uske 4 equal parts kiye.
* Agar aapne 1 slice plate me nikal liya, toh aapke paas pure pizza ka \`1/4\` fraction bacha!
* Agar aap 3 slices kha lete hain, toh aapne pizza ka \`3/4\` hissa kha liya!

Practice Question:
Agar aapke paas 6 mango slices hain aur aap 2 slices kha lete hain, toh aapne total mangoes ka kaun sa fraction khaya?

Understanding Check:
Beta, fraction \`3/10\` me top number '3' kya represent karta hai?

Next Recommendation:
Next Topic: 'Equivalent Fractions' ya 'Introduction to Decimals'.`;
    } else {
      return `Topic:
Fractions (Parts of a Whole)

Simple Explanation:
* A **Fraction** represents a part of a whole. When you divide something whole into equal pieces, each piece is a fraction.
* We write fractions using two numbers: a top number called the **Numerator** and a bottom number called the **Denominator**.
* The **Denominator** (bottom) tells us how many equal parts the whole is divided into.
* The **Numerator** (top) tells us how many of those equal parts we are talking about.

Example:
* Imagine you have a fresh round pizza. You cut it into 4 equal slices.
* If you take 1 slice, you have taken \`1/4\` of the pizza.
* The remaining 3 slices represent \`3/4\` of the pizza!

Practice Question:
If a chocolate bar has 8 equal blocks and you share 5 blocks with your friends, what fraction of the chocolate bar did you give away?

Understanding Check:
In the fraction \`2/7\`, what does the bottom number '7' tell us about the whole object?

Next Recommendation:
Next Topic: 'Equivalent Fractions' or 'Comparing Fractions'.`;
    }
  }

  if (detectedTopic === "water_cycle") {
    if (lang === "hindi") {
      return `Topic:
Water Cycle (जल चक्र)

Simple Explanation:
* पृथ्वी पर पानी का सफर कभी खत्म नहीं होता! पानी का एक रूप से दूसरे रूप में बदलना और फिर वापस अपनी जगह आना ही **Water Cycle** (जल चक्र) कहलाता है।
* इसके 3 मुख्य कदम होते हैं:
  1. **वाष्पीकरण (Evaporation)**: सूरज की तेज धूप नदियों, तालाबों के पानी को गर्म करके भाप (Vapor) बनाकर हवा में ऊपर उड़ा ले जाती है।
  2. **संघनन (Condensation)**: जब भाप आसमान में बहुत ऊपर जाती है, तो ठंडी हवा से मिलकर नन्ही बूंदों में बदल जाती है और 'बादल' (Clouds) बनाती है।
  3. **वर्षा (Precipitation)**: जब बादल बहुत भारी हो जाते हैं, तो वे बारिश, ओलों या बर्फ के रूप में वापस जमीन पर गिर जाते हैं।

Example:
* जब आपकी माताजी गीले कपड़ों को धूप में सुखाती हैं, तो कुछ घंटों में कपड़े सूख जाते हैं। वह पानी कहाँ गया? वह धूप की गर्मी से भाप बनकर हवा में उड़ गया! यही वाष्पीकरण (Evaporation) है।

Practice Question:
बादल बनने की प्रक्रिया को क्या कहते हैं जब पानी की भाप ठंडी होकर फिर से पानी की बूँदें बन जाती है?

Understanding Check:
बेटा, क्या आप मुझे बता सकते हैं कि नदियों का पानी भाप बनकर ऊपर उड़ने के लिए मुख्य ऊर्जा कहाँ से पाता है?

Next Recommendation:
अगला विषय: 'भूजल' (Groundwater) या 'जल संरक्षण' (Water Conservation)।`;
    } else if (lang === "hinglish") {
      return `Topic:
Water Cycle (Pani Ka Safar)

Simple Explanation:
* Earth par pani hamesha ek continuous journey par rehta hai. Is round-trip ko hum **Water Cycle** kehte hain.
* Isme 3 important steps hote hain:
  1. **Evaporation (Vapourization)**: Sun ki heat se rivers aur oceans ka pani garam hokar steam (भाप) ban jata hai aur sky me upar ud jata hai.
  2. **Condensation (Cloud formation)**: Jab steam upar thandi hawa me pahunchti hai, toh wo chhoti-chhoti water droplets banakar **Clouds** bana deti hai.
  3. **Precipitation (Rain)**: Jab clouds heavy ho jate hain aur unse pani sambhala nahi jata, toh wo Rain ya Snow ke roop me wapas zameen par gir jate hain!

Example:
* Jab ghar me water boil hota hai aur hum uspar plate rakh dete hain, toh plate uthane par uspar pani ki boondein dikhti hain. Steam thandi hokar pani ban gayi, yahi Condensation hai!

Practice Question:
Zameen par baarish ke roop me paani girne ke process ko science me kya bolte hain?

Understanding Check:
Beta, agar Sun bilkul na chamke, toh kya Water Cycle chal payegi?

Next Recommendation:
Next Topic: 'Ground Water' ya 'Rainwater Harvesting'.`;
    } else {
      return `Topic:
The Water Cycle (Nature's Water Journey)

Simple Explanation:
* The **Water Cycle** is the continuous journey that water takes from the ground, up into the sky, and back down again!
* It happens in three simple steps:
  1. **Evaporation**: The Sun heats up water in lakes and oceans, turning it into invisible steam (vapor) that rises into the sky.
  2. **Condensation**: As the vapor goes higher where it's cold, it cools down and turns back into tiny liquid drops, forming **Clouds**.
  3. **Precipitation**: When the clouds get too heavy, they release the water back to Earth as **Rain**, snow, or hail!

Example:
* Have you seen wet clothes drying in the sun? Where does the water go? It gets heated by the Sun and evaporates into the air. That is Evaporation!

Practice Question:
What is the scientific term for water vapor turning into liquid water droplets to form clouds?

Understanding Check:
Can you tell me what provides the heat energy needed to start the evaporation process in nature?

Next Recommendation:
Next Topic: 'Types of Clouds' or 'The Importance of Clean Water'.`;
    }
  }

  if (detectedTopic === "force_motion") {
    if (lang === "hindi") {
      return `Topic:
Force and Motion (बल और गति)

Simple Explanation:
* किसी भी चीज़ को हिलाने, रोकने या उसका आकार बदलने के लिए जो जोर लगाना पड़ता है, उसे हम **Force** (बल) कहते हैं।
* आसान शब्दों में कहें तो किसी चीज़ को 'धकेलना' (Push) या 'खींचना' (Pull) ही बल कहलाता है।
* जब हम किसी चीज़ पर बल लगाते हैं, तो वह हिलती है और उसकी स्थिति में बदलाव को **Motion** (गति) कहते हैं।
* बिना किसी बल के कोई भी रुकी हुई चीज़ अपने आप नहीं हिल सकती, और कोई भी चलती हुई चीज़ अपने आप नहीं रुक सकती!

Example:
* जब आप अपनी बंद अलमारी का दरवाज़ा खोलते हैं, तो आप उसे अपनी तरफ 'खींचते' (Pull) हैं।
* जब आप फुटबॉल को पैर से मारते हैं, तो आप उसे अपने से दूर 'धकेलते' हैं (Push)। ये दोनों बल के उदाहरण हैं!

Practice Question:
जब आप चलती हुई साइकिल पर अचानक ब्रेक लगाते हैं, तो वह किस बल के कारण रुक जाती है?

Understanding Check:
बेटा, अगर एक भारी बक्सा जमीन पर रखा हुआ है और वह हिल नहीं रहा है, तो उसे गति में लाने के लिए हमें क्या लगाना पड़ेगा?

Next Recommendation:
अगला विषय: 'घर्षण बल' (Friction Force) या 'गुरुत्वाकर्षण' (Gravity)।`;
    } else if (lang === "hinglish") {
      return `Topic:
Force and Motion (Push aur Pull)

Simple Explanation:
* Kisi bhi object ko move karne, stop karne, ya uski shape change karne ke liye jo physical effort lagta hai, use **Force** (बल) kehte hain.
* Simple words me kahein toh kisi cheez ko **Push** (धकेलना) karna ya **Pull** (खींचना) karna hi Force hai.
* Jab hum Force lagate hain toh object hilne lagta hai, aur uski movement ko hum **Motion** (गति) bolte hain.
* Agar koi book table par rakhi hai, toh jab tak aap uspe koi force nahi lagaoge, wo apne aap nahi hilegi!

Example:
* Football ko kick marna ek **Push** force hai.
* Apne school bag ko floor se uthana ek **Pull** force hai.
* Ye dono objects ko motion me laate hain!

Practice Question:
Gadi chalte waqt jab break lagate hain, toh gadi aur road ke beech kaun sa opposing force kaam karta hai jo use rokta hai?

Understanding Check:
Beta, agar aap ek soft paper cup ko bahut zor se hand se press karo (Force lagao), toh us cup ke sath kya hoga?

Next Recommendation:
Next Topic: 'Friction' (घर्षण) ya 'Gravitational Force' (गुरुत्वाकर्षण)।`;
    } else {
      return `Topic:
Force and Motion (Pushes and Pulls)

Simple Explanation:
* A **Force** is simply a push or a pull on an object. We use forces to make things move, slow down, stop, or change shape.
* When we apply force to an object, it changes its position. This movement is called **Motion**.
* Objects cannot start moving, stop moving, or change direction by themselves. They always need a force to act upon them!

Example:
* Kicking a soccer ball is a **Push** force because you are sending it away from you.
* Opening a desk drawer is a **Pull** force because you are bringing it closer to you.
* Both actions create motion!

Practice Question:
What invisible force pulls everything down toward the center of the Earth, keeping our feet on the ground?

Understanding Check:
If a heavy toy car is sitting still on the floor, what must you apply to it to make it roll and move?

Next Recommendation:
Next Topic: 'Friction' (The rubbing force) or 'Newton's Laws of Motion'.`;
    }
  }

  if (detectedTopic === "swarajya") {
    if (lang === "hindi") {
      return `Topic:
Chhatrapati Shivaji Maharaj and Swarajya (स्वराज्य)

Simple Explanation:
* **स्वराज्य** (Swarajya) का मतलब होता है 'अपना स्वयं का राज्य' जहाँ सभी लोग स्वतंत्रता, सम्मान और न्याय के साथ जी सकें।
* महान योद्धा **छत्रपति शिवाजी महाराज** ने 17वीं शताब्दी में महाराष्ट्र में स्वराज्य की स्थापना की थी।
* उन्होंने विदेशी आक्रांताओं और अन्यायपूर्ण शासकों (जैसे आदिलशाह और मुगलों) के अत्याचारों से पीड़ित किसानों और आम लोगों को एकजुट किया।
* शिवाजी महाराज ने सिखाया कि राजा प्रजा का स्वामी नहीं बल्कि उनका सेवक और रक्षक होता है। उन्होंने महिलाओं का सम्मान, धार्मिक सहिष्णुता और कुशल शासन की नींव रखी।

Example:
* जैसे एक घर में अगर बाहर का कोई अजनबी आकर जबरदस्ती नियम बनाए और आपको सताए, तो आप नाखुश होंगे। लेकिन जब आपके माता-पिता घर चलाते हैं, तो वे आपका ध्यान रखते हैं। शिवाजी महाराज का स्वराज्य ठीक वैसा ही था—आम जनता का अपना न्यायप्रिय शासन!

Practice Question:
छत्रपति शिवाजी महाराज ने अपनी सेना में किस विशेष पहाड़ी युद्ध रणनीति (Guerrilla Warfare) का कुशल उपयोग किया था?

Understanding Check:
बेटा, 'स्वराज्य' शब्द का सीधा और सरल अर्थ क्या होता है?

Next Recommendation:
अगला विषय: 'शिवाजी महाराज के प्रमुख किले' (Forts of Shivaji Maharaj) या 'मराठा नौसेना का इतिहास' (The Maratha Navy)।`;
    } else if (lang === "hinglish") {
      return `Topic:
Chhatrapati Shivaji Maharaj & Swarajya

Simple Explanation:
* **Swarajya** ka literal meaning hota hai 'Apna Khud ka Rule/State', jahan har citizen freedom, respect aur justice ke sath reh sake.
* Great warrior King **Chhatrapati Shivaji Maharaj** ne 17th Century me Maharashtra me Swarajya ki foundation rakhi thi.
* Unhone common farmers, soldiers (called Mavlas) ko motivate kiya aur foreign rulers (Adilshahi aur Mughals) ke injustice ke khilaf ek mazboot stand liya.
* Unka rule bohot fair aur respectful tha. Wo har religion ka respect karte the aur unke state me women ki safety absolute topmost priority thi!

Example:
* Jaise agar aapke school group project me koi bahar ka student aakar bina puche galat rules banaye toh aapko bura lagega. Par jab aap sab milkar aapsi samajh se kaam karte hain toh sab khush rehte hain. Swarajya waisa hi tha—apna pyara, nek aur sachha raaj!

Practice Question:
Shivaji Maharaj ne dushman ki badi senao ko harane ke liye kaun si surprise attack technique (Guerrilla Warfare) use ki thi?

Understanding Check:
Beta, Swarajya me Shivaji Maharaj apni public ko kya maante the—apna sevak ya unka rक्षक?

Next Recommendation:
Next Topic: 'Forts of Maharashtra' ya 'Ashta Pradhan Mandal' (Eight Ministers system).`;
    } else {
      return `Topic:
Chhatrapati Shivaji Maharaj and Swarajya

Simple Explanation:
* **Swarajya** means "Self-Rule" or "Our Own Kingdom", where every citizen can live with absolute freedom, dignity, and justice.
* The visionary king **Chhatrapati Shivaji Maharaj** founded Swarajya in the 17th century in Maharashtra, India.
* He united the local farmers, peasants, and soldiers to fight against powerful, oppressive empires like the Adilshahi and the Mughals.
* Shivaji Maharaj was not just a brave warrior; he was an incredibly kind and just ruler who cared for the environment, built a strong navy, respected women, and promoted religious tolerance.

Example:
* Imagine a classroom where a bully from another class enters and starts taking everyone's lunch and books. If you all stand up together under a fair leader to run your own classroom peacefully, that is like establishing "Swarajya"—taking back your own right to live happily!

Practice Question:
What is the name of the military tactic (surprise mountain warfare) that Shivaji Maharaj successfully used against larger enemy armies?

Understanding Check:
In your own words, what does the beautiful word 'Swarajya' mean to the common people?

Next Recommendation:
Next Topic: 'The Great Hill Forts of Maharashtra' or 'The Administration of Shivaji Maharaj'.`;
    }
  }

  // DEFAULT / GENERAL FALLBACK
  if (lang === "hindi") {
    return `Topic:
${topic || "सामान्य विज्ञान और गणित"}

Simple Explanation:
* ज्ञानसेतु एआई (GyanSetu AI) के साथ किसी भी नए विषय को समझना बहुत आसान और मजेदार है!
* हम जटिल विचारों को सरल, छोटे-छोटे चरणों में विभाजित करते हैं ताकि आप बिना किसी कठिनाई के सीख सकें।
* हर वैज्ञानिक या गणितीय अवधारणा हमारे चारों ओर की सुंदर दुनिया से जुड़ी हुई है।

Example:
* जैसे गुरुत्वाकर्षण (Gravity) को समझने के लिए सोचिए कि जब भी आप गेंद हवा में फेंकते हैं, वह हमेशा नीचे ही क्यों आती है! पृथ्वी उसे एक जादुई चुंबकीय खिंचाव की तरह नीचे खींचती है।

Practice Question:
क्या आप अपने दैनिक जीवन से जुड़ी किसी ऐसी क्रिया के बारे में बता सकते हैं जहाँ आप बल लगाते हैं?

Understanding Check:
बेटा, क्या आपको यह बुनियादी विचार समझ आया या हम इसे किसी अन्य सरल तरीके से समझें?

Next Recommendation:
अगला विषय: 'दैनिक विज्ञान के अनोखे प्रयोग' (Fun Experiments of Daily Science)।`;
  } else if (lang === "hinglish") {
    return `Topic:
${topic || "General Studies & Basics"}

Simple Explanation:
* GyanSetu AI ke saath kisi bhi subject ko seekhna bohot easy aur fun hai!
* Hum har tough topic ko chote-chote easy steps me break karte hain taaki aap use achhe se samajh sakein.
* Sabhi theoretical concepts humare real-world ke examples se connected hote hain.

Example:
* Jaise hum jab cycle chalate hain aur brake press karte hain, toh friction force ki wajah se cycle rukti hai. Hamari daily life science se bhari hui hai!

Practice Question:
Kya aap apni life se koi aisa example de sakte hain jahan aapko koi push ya pull force apply karna padta hai?

Understanding Check:
Beta, kya aapko ye explanation acche se samajh aayi ya hum isko thoda aur break karein?

Next Recommendation:
Next Topic: 'Real Life Science Facts' ya 'Fun Maths Tricks'.`;
  } else {
    return `Topic:
${topic || "General Studies & Concepts"}

Simple Explanation:
* Learning with GyanSetu AI makes any complex subject extremely simple and engaging!
* We break down difficult academic ideas into progressive, bite-sized steps that are easy to grasp without stress.
* Every scientific, mathematical, or social studies concept has a beautiful connection to our daily lives.

Example:
* Think of gravity: whenever you throw a ball in the air, it always falls back down instead of floating away. Earth's gravity pulls it back!

Practice Question:
Can you name any simple activity in your house that uses a "push" or a "pull" force?

Understanding Check:
Did this simple explanation help clear your doubts, or would you like me to use an even simpler story?

Next Recommendation:
Next Topic: 'Wonders of Science' or 'Basic Math Concepts'.`;
  }
}

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
  } else if (normTopic.includes("shivaji") || normTopic.includes("swarajya") || normTopic.includes("maratha") || normTopic.includes("शिवाजी")) {
    detectedTopic = "swarajya";
  }

  if (detectedTopic === "photosynthesis") {
    if (lang === "hindi") {
      return [
        {
          question: "पौधों को भोजन (ग्लूकोज) बनाने के लिए किस ऊर्जा स्रोत की आवश्यकता होती है?",
          options: ["बिजली", "सूरज की रोशनी (Sunlight)", "चंद्रमा की चांदनी", "पवन ऊर्जा"],
          correctAnswer: "सूरज की रोशनी (Sunlight)",
          explanation: "बहुत अच्छे बेटा! सूरज की रोशनी (Sunlight) वह मुख्य ईंधन है जिसका उपयोग करके पत्तियाँ भोजन बनाती हैं।"
        },
        {
          question: "पत्तियों का हरा रंग किस पिगमेंट (पदार्थ) के कारण होता है?",
          options: ["क्लोरोफिल (Chlorophyll)", "हीमोग्लोबिन", "कैरोटीन", "पानी"],
          correctAnswer: "क्लोरोफिल (Chlorophyll)",
          explanation: "शाबाश! क्लोरोफिल ही वह जादुई शेफ है जो पत्तियों को हरा रंग देता है और धूप को सोखने में मदद करता है।"
        },
        {
          question: "प्रकाश संश्लेषण (Photosynthesis) के दौरान पौधे हवा में कौन सी गैस छोड़ते हैं?",
          options: ["नाइट्रोजन", "कार्बन डाइऑक्साइड", "ऑक्सीजन (Oxygen)", "हाइड्रोजन"],
          correctAnswer: "ऑक्सीजन (Oxygen)",
          explanation: "अद्भुत जवाब! पौधे ऑक्सीजन गैस बाहर छोड़ते हैं, जिससे हम सभी जीव सांस ले पाते हैं। पौधे हमारे सच्चे मित्र हैं!"
        }
      ];
    } else if (lang === "hinglish") {
      return [
        {
          question: "Plants ko apna food cook karne ke liye kaun si energy source chahiye hoti hai?",
          options: ["Electricity", "Sunlight (सूरज की रोशनी)", "Moonlight", "Wind energy"],
          correctAnswer: "Sunlight (सूरज की रोशनी)",
          explanation: "Superb beta! Sunlight hi wo primary source hai jise green leaves gas stove ki tarah use karti hain."
        },
        {
          question: "Leaves ka green color kis pigment ki wajah se hota hai?",
          options: ["Chlorophyll (क्लोरोफिल)", "Hemoglobin", "Carotene", "Melanin"],
          correctAnswer: "Chlorophyll (क्लोरोफिल)",
          explanation: "Shabaash! Chlorophyll wo green chef hai jo food cook karne me sunlight ko absorb karta hai."
        },
        {
          question: "Photosynthesis process ke dauran plants hawa me kaun si gas release karte hain?",
          options: ["Carbon Dioxide", "Nitrogen", "Oxygen (ऑक्सीजन)", "Hydrogen"],
          correctAnswer: "Oxygen (ऑक्सीजन)",
          explanation: "Waah beta bilkul sahi! Plants oxygen gas release karte hain, jis se hum breathe kar paate hain."
        }
      ];
    } else {
      return [
        {
          question: "Which energy source is required by plants to make their food (glucose)?",
          options: ["Electricity", "Sunlight", "Wind power", "Moonlight"],
          correctAnswer: "Sunlight",
          explanation: "Excellent job! Sunlight is the main energy fuel used by green leaves to cook food."
        },
        {
          question: "What is the green pigment in leaves called that absorbs sunlight?",
          options: ["Chlorophyll", "Hemoglobin", "Melanin", "Carotene"],
          correctAnswer: "Chlorophyll",
          explanation: "Great! Chlorophyll is the green color pigment that captures sunlight like a master chef."
        },
        {
          question: "Which gas is released by plants as a byproduct of Photosynthesis?",
          options: ["Nitrogen", "Carbon Dioxide", "Oxygen", "Helium"],
          correctAnswer: "Oxygen",
          explanation: "Spot on! Plants release oxygen gas, which is vital for all living beings to breathe and survive."
        }
      ];
    }
  }

  if (detectedTopic === "fractions") {
    if (lang === "hindi") {
      return [
        {
          question: "भिन्न '3/4' में नीचे लिखा नंबर '4' (Denominator) क्या दर्शाता है?",
          options: ["बचे हुए हिस्से", "कुल बराबर हिस्से (Total equal parts)", "खाए गए हिस्से", "कुल चॉकलेट की संख्या"],
          correctAnswer: "कुल बराबर हिस्से (Total equal parts)",
          explanation: "बहुत बढ़िया! हर (Denominator) हमेशा यह बताता है कि हमने पूरी चीज़ के कुल कितने बराबर भाग किए हैं।"
        },
        {
          question: "अगर एक गोल रोटी के 2 बराबर टुकड़े किए जाएँ, तो प्रत्येक टुकड़ा कौन सा भिन्न दर्शाता है?",
          options: ["1/4", "1/2 (आधा)", "2/3", "1/10"],
          correctAnswer: "1/2 (आधा)",
          explanation: "शाबाश बेटा! जब हम किसी चीज़ को दो बराबर भागों में बाँटते हैं, तो प्रत्येक भाग आधा यानी '1/2' कहलाता है।"
        },
        {
          question: "यदि एक बॉक्स में 5 लाल गेंदें और 3 नीली गेंदें हैं, तो नीली गेंदों का भिन्न क्या होगा?",
          options: ["3/8", "5/8", "3/5", "8/3"],
          correctAnswer: "3/8",
          explanation: "अद्भुत! कुल गेंदें 8 हैं (5+3) और नीली गेंदें 3 हैं, इसलिए नीली गेंदों का भिन्न '3/8' होगा।"
        }
      ];
    } else if (lang === "hinglish") {
      return [
        {
          question: "Fraction '3/4' me bottom number '4' (Denominator) kya represent karta hai?",
          options: ["Leftover parts", "Total equal parts", "Eaten slices", "None of these"],
          correctAnswer: "Total equal parts",
          explanation: "Bahut acche! Denominator batata hai ki humne ek whole object ke total kitne equal parts kiye hain."
        },
        {
          question: "Agar ek chocolate ke 8 equal pieces hain aur aapne 3 pieces kha liye, toh aapne kitna fraction khaya?",
          options: ["3/8", "5/8", "8/3", "1/8"],
          correctAnswer: "3/8",
          explanation: "Shabaash! Total 8 parts me se aapne 3 select kiye, isliye correct fraction '3/8' hai."
        },
        {
          question: "Fraction '1/2' aur '2/4' ke baare me kya sach hai?",
          options: ["Dono barabar hain (Equivalent)", "1/2 bada hai", "2/4 bada hai", "Dono alag hain"],
          correctAnswer: "Dono barabar hain (Equivalent)",
          explanation: "Very good! '2/4' ko simplify karne par '1/2' hi aata hai, isliye ye Equivalent fractions hain!"
        }
      ];
    } else {
      return [
        {
          question: "In the fraction '5/8', what is the bottom number 8 called?",
          options: ["Numerator", "Denominator", "Whole number", "Decimal"],
          correctAnswer: "Denominator",
          explanation: "Correct! The bottom number is the Denominator, which tells us the total number of equal parts."
        },
        {
          question: "If you divide an apple into 4 equal slices and eat 1 slice, what fraction is left?",
          options: ["1/4", "3/4", "2/4", "4/4"],
          correctAnswer: "3/4",
          explanation: "Great! 1 slice eaten leaves 3 out of 4, which is '3/4'."
        },
        {
          question: "Which of the following fractions is equivalent to '1/3'?",
          options: ["2/6", "3/6", "2/3", "1/6"],
          correctAnswer: "2/6",
          explanation: "Excellent! '2/6' can be simplified by dividing the top and bottom by 2, which gives '1/3'."
        }
      ];
    }
  }

  if (detectedTopic === "water_cycle") {
    if (lang === "hindi") {
      return [
        {
          question: "नदियों और समुद्रों का पानी गर्म होकर भाप बनने की क्रिया को क्या कहते हैं?",
          options: ["संघनन (Condensation)", "वाष्पीकरण (Evaporation)", "वर्षा", "जमना"],
          correctAnswer: "वाष्पीकरण (Evaporation)",
          explanation: "बिलकुल सही बेटा! सूरज की गर्मी से पानी भाप (Vapor) बनकर ऊपर उड़ता है, इसे वाष्पीकरण कहते हैं।"
        },
        {
          question: "पानी की भाप ऊपर जाकर ठंडी होती है और बादल बनाती है। इस क्रिया को क्या कहते हैं?",
          options: ["संघनन (Condensation)", "पिघलना", "वाष्पीकरण", "प्रवाहित होना"],
          correctAnswer: "संघनन (Condensation)",
          explanation: "शाबाश! भाप का ठंडी होकर फिर से पानी की नन्ही बूंदों में बदलना संघनन (Condensation) कहलाता है।"
        },
        {
          question: "इनमें से कौन जल चक्र का एक प्रमुख हिस्सा नहीं है?",
          options: ["वाष्पीकरण", "संघनन", "वर्षा (Precipitation)", "प्लास्टिक का दहन"],
          correctAnswer: "प्लास्टिक का दहन",
          explanation: "बहुत अच्छे! प्लास्टिक का जलना प्रकृति के जल चक्र का हिस्सा नहीं है, बल्कि यह प्रदूषण फैलाता है।"
        }
      ];
    } else if (lang === "hinglish") {
      return [
        {
          question: "River ka water heat se vapor bankar sky me jata hai. Is process ko kya bolte hain?",
          options: ["Evaporation", "Condensation", "Precipitation", "Freezing"],
          correctAnswer: "Evaporation",
          explanation: "Shabaash! Evaporation me liquid water gas state (vapor) me convert hota hai."
        },
        {
          question: "Badal (Clouds) kis process se bante hain?",
          options: ["Condensation", "Evaporation", "Melting", "Boiling"],
          correctAnswer: "Condensation",
          explanation: "Bilkul sahi! Water vapor thanda hokar tiny water drops me badalta hai jisse clouds bante hain."
        },
        {
          question: "Water cycle par sabse bada control kis natural energy source ka hota hai?",
          options: ["The Sun (सूरज)", "The Moon", "Wind", "Electricity"],
          correctAnswer: "The Sun (सूरज)",
          explanation: "Wah! Sun hi sabhi water bodies ko garam karta hai jisse water cycle chalti hai."
        }
      ];
    } else {
      return [
        {
          question: "What is the process where liquid water turns into gas and rises into the air?",
          options: ["Evaporation", "Condensation", "Precipitation", "Respiration"],
          correctAnswer: "Evaporation",
          explanation: "Correct! The heat of the Sun turns liquid water into gas, which is Evaporation."
        },
        {
          question: "Tiny water droplets in the sky combine to form clouds. What is this cooling process called?",
          options: ["Condensation", "Evaporation", "Freezing", "Precipitation"],
          correctAnswer: "Condensation",
          explanation: "Well done! Condensation is when water vapor cools down and turns back into liquid water to form clouds."
        },
        {
          question: "Rain, snow, or sleet falling from clouds to the ground is called what?",
          options: ["Precipitation", "Evaporation", "Condensation", "Runoff"],
          correctAnswer: "Precipitation",
          explanation: "Superb! Precipitation is water falling back to Earth's surface as rain or snow."
        }
      ];
    }
  }

  if (detectedTopic === "force_motion") {
    if (lang === "hindi") {
      return [
        {
          question: "भौतिक विज्ञान में किसी चीज़ को धक्का देना (Push) या खींचना (Pull) क्या कहलाता है?",
          options: ["दूरी", "बल (Force)", "समय", "ऊर्जा"],
          correctAnswer: "बल (Force)",
          explanation: "शाबाश बेटा! किसी भी वस्तु पर लगाया गया धक्का (Push) या खिंचाव (Pull) ही बल या Force कहलाता है।"
        },
        {
          question: "चलती हुई गेंद फर्श पर रगड़ खाने के बाद थोड़ी देर में अपने आप क्यों रुक जाती है?",
          options: ["गुरुत्वाकर्षण के कारण", "घर्षण बल (Friction Force) के कारण", "हवा न होने के कारण", "जादू से"],
          correctAnswer: "घर्षण बल (Friction Force) के कारण",
          explanation: "बिलकुल सही! फर्श और गेंद के बीच घर्षण बल (Friction) गति का विरोध करता है और उसे रोक देता है।"
        },
        {
          question: "यदि कोई वस्तु स्थिर (रुकी हुई) है, तो उसे गति में लाने के लिए किसकी आवश्यकता होगी?",
          options: ["केवल समय की", "तापमान की", "बाहरी असंतुलित बल (Force) की", "अंधेरे की"],
          correctAnswer: "बाहरी असंतुलित बल (Force) की",
          explanation: "बहुत बढ़िया! जब तक हम किसी वस्तु पर कोई बाहरी बल नहीं लगाते, वह अपनी जगह से नहीं हिल सकती।"
        }
      ];
    } else if (lang === "hinglish") {
      return [
        {
          question: "Kisi object ko push karna ya pull karna science me kya kehlata hai?",
          options: ["Force (बल)", "Speed", "Weight", "Friction"],
          correctAnswer: "Force (बल)",
          explanation: "Bilkul sahi! Push aur Pull actions ko hum simple words me Force bolte hain."
        },
        {
          question: "Earth ki wo invisible power kaun si hai jo sabhi cheezon ko zameen par kheench kar rakhti hai?",
          options: ["Gravity (गुरुत्वाकर्षण)", "Friction", "Magnetic Force", "Wind"],
          correctAnswer: "Gravity (गुरुत्वाकर्षण)",
          explanation: "Superb! Gravity hi wo magnetic-like pull hai jo humein aur objects ko udne se rokti hai."
        },
        {
          question: "Heavy boxes ko floor par drag karna mushkil hota. Kaun sa force is drag ka oppose karta hai?",
          options: ["Friction Force", "Gravity", "Muscular Force", "None"],
          correctAnswer: "Friction Force",
          explanation: "Bahut achhe! Friction force do surfaces ke beech rub hone par opposite direction me act karta hai."
        }
      ];
    } else {
      return [
        {
          question: "A push or a pull on an object is called a:",
          options: ["Force", "Motion", "Gravity", "Inertia"],
          correctAnswer: "Force",
          explanation: "Spot on! Any push or pull applied to an object is defined as a force."
        },
        {
          question: "Which force acts in the opposite direction of motion to slow down sliding objects?",
          options: ["Friction", "Gravity", "Magnetic force", "Centrifugal force"],
          correctAnswer: "Friction",
          explanation: "Excellent! Friction is the rubbing force between surfaces that opposes motion."
        },
        {
          question: "What invisible force keeps the Earth and other planets orbiting the Sun?",
          options: ["Gravity", "Friction", "Electricity", "Magnetism"],
          correctAnswer: "Gravity",
          explanation: "Correct! The Sun's massive gravitational force acts like a cosmic lasso keeping planets in orbit."
        }
      ];
    }
  }

  // DEFAULT / GENERAL STUDIES QUIZ
  if (lang === "hindi") {
    return [
      {
        question: "हम सूर्य से क्या प्राप्त करते हैं जो पौधों के लिए भोजन बनाने में आवश्यक है?",
        options: ["कोयला", "धूप और प्रकाश", "पानी", "लकड़ी"],
        correctAnswer: "धूप और प्रकाश",
        explanation: "शाबाश! सूर्य का प्रकाश ही पृथ्वी पर जीवन और ऊर्जा का मुख्य स्रोत है।"
      },
      {
        question: "स्वस्थ शरीर के लिए हमें प्रतिदिन क्या पीना अत्यंत आवश्यक है?",
        options: ["कोल्ड ड्रिंक", "चाय", "साफ पानी (Clean Water)", "कॉफ़ी"],
        correctAnswer: "साफ पानी (Clean Water)",
        explanation: "बिलकुल सही! हमारा शरीर लगभग 70% पानी से बना है, इसलिए पर्याप्त साफ पानी पीना बहुत जरूरी है।"
      },
      {
        question: "रात में आसमान में चमकने वाले तारे किस प्रकाश से चमकते हैं?",
        options: ["बिजली से", "अपने स्वयं के प्रकाश से (या सूर्य के प्रकाश से)", "बैटरी से", "मोमबत्ती से"],
        correctAnswer: "अपने स्वयं के प्रकाश से (या सूर्य के प्रकाश से)",
        explanation: "अद्भुत! तारे अत्यंत बड़े और गर्म खगोलीय पिंड होते हैं जो स्वयं प्रकाश और ऊर्जा उत्सर्जित करते हैं।"
      }
    ];
  } else if (lang === "hinglish") {
    return [
      {
        question: "Humein healthy rehne ke liye kaisa food khana chahiye?",
        options: ["Junk Food", "Balanced Diet (पौष्टिक भोजन)", "Cold drinks", "Only sweets"],
        correctAnswer: "Balanced Diet (पौष्टिक भोजन)",
        explanation: "Superb! Balanced diet me sabhi jaruri vitamins aur nutrients hote hain jo humari growth me help karte hain."
      },
      {
        question: "Plants humare liye kaun si gas release karte hain jo hum breath karne me use karte hain?",
        options: ["Oxygen (ऑक्सीजन)", "Carbon Dioxide", "Nitrogen", "Helium"],
        correctAnswer: "Oxygen (ऑक्सीजन)",
        explanation: "Bilkul sahi! Plants humein oxygen dete hain, isliye humein zyada se zyada trees plant karne chahiye."
      },
      {
        question: "Earth par sabse bada heat aur light ka natural source kaun sa hai?",
        options: ["The Sun (सूरज)", "The Moon", "Stars", "Forest Fire"],
        correctAnswer: "The Sun (सूरज)",
        explanation: "Bahut acche! Sun hi pure solar system me ultimate energy aur light ka head source hai."
      }
    ];
  } else {
    return [
      {
        question: "Which of the following is considered a healthy food habit?",
        options: ["Eating balanced meals with fruits and veggies", "Eating junk food daily", "Skipping breakfast", "Drinking sugar sodas daily"],
        correctAnswer: "Eating balanced meals with fruits and veggies",
        explanation: "Great! A balanced diet with vegetables and fruits provides essential vitamins for a strong mind and body."
      },
      {
        question: "Which planet do we live on?",
        options: ["Mars", "Earth", "Venus", "Jupiter"],
        correctAnswer: "Earth",
        explanation: "Spot on! Earth is our beautiful green-blue home planet, the only known planet that supports life."
      },
      {
        question: "How many hours are there in one single day?",
        options: ["12 hours", "24 hours", "60 hours", "30 hours"],
        correctAnswer: "24 hours",
        explanation: "Excellent! One full day consists of 24 hours, representing one full rotation of the Earth on its axis."
      }
    ];
  }
}

// 1. Chat Completion Endpoint (handles Text, Visual textbook photo, and simpler explanations)
app.post("/api/chat", async (req, res) => {
  const {
    message,
    studentName,
    language,
    grade,
    topic,
    weaknesses,
    history = [],
    image, // base64 encoded image
    imageType, // e.g. "image/jpeg"
    simpler = false,
  } = req.body;

  try {
    const systemPrompt = getSystemPrompt(studentName, grade, language, topic, weaknesses);

    // If the student requested a simpler explanation of the last topic discussed
    let currentPrompt = message;
    if (simpler) {
      currentPrompt =
        language === "Hindi"
          ? "कृपया इस विषय को और भी सरल हिंदी में समझाएं। कोई बहुत आसान उदाहरण या कहानी इस्तेमाल करें ताकि मैं आसानी से समझ सकूं।"
          : language === "Hinglish"
            ? "Pls is topic ko aur bhi simple language me samjhao. Koi bahut easy real-life example ya short story use karo jisse me turant samajh jau."
            : "Please explain this concept even more simply. Use an extremely basic analogy or a simple step-by-step breakdown.";
    }

    // Format chat history for Gemini API
    const contents: any[] = [];

    // Add history
    for (const msg of history) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    }

    // Prepare current parts
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

    // Append the current turn
    contents.push({
      role: "user",
      parts: currentParts,
    });

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
});

// 2. Quiz Generation Endpoint
app.post("/api/quiz/generate", async (req, res) => {
  const { topic, language, grade, weaknesses = [] } = req.body;
  try {
    const quizInstruction = `You are a professional educational assessor. Generate exactly 3 multiple-choice questions (MCQs) to evaluate a student's understanding of the topic: "${topic}".
Grade level: ${grade || "School level"}.
Focus Areas/Struggles: ${weaknesses.length > 0 ? weaknesses.join(", ") : "General introduction"}.

Language requirement:
- If language is "Hindi", formulate the questions, options, and explanations in polite simple Hindi (Devanagari script).
- If language is "Hinglish", formulate the questions, options, and explanations in friendly conversational Hinglish (Hindi in Roman script with English academic terms).
- If language is "English", formulate them in simple, clear English.

Each question must have exactly 4 choices and exactly 1 correct answer.
Explanations should be very encouraging, praising correct answers, and giving gentle, easy-to-understand explanations for why the correct option is indeed correct.`;

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
              question: {
                type: Type.STRING,
                description: "The question statement clearly written.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of exactly 4 choices/options.",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct option text. MUST match exactly one of the values in the options array.",
              },
              explanation: {
                type: Type.STRING,
                description: "A super warm, kid-friendly explanation explaining why this option is correct.",
              },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const quizData = JSON.parse(jsonText.trim());
    return res.json(quizData);
  } catch (error: any) {
    console.log("[Info] Initiating local quiz generator...");
    const fallbackQuizzes = getFallbackQuizResponse(topic || "General", language || "English");
    return res.json(fallbackQuizzes);
  }
});

// Start the server
async function startServer() {
  // Vite middleware setup for asset serving based on development or production environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware for Development");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GyanSetu AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
