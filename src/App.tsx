import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  BookOpen,
  Award,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Compass,
  AlertCircle,
  User,
  HelpCircle,
  Clock,
  Menu,
  FileText,
  X,
  Check,
  Languages,
  BookOpenText,
  ArrowLeft,
  Flame,
  Bell,
  Calendar,
  Target,
  ListTodo,
  Share2,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudentProfile, ChatMessage, QuizQuestion, QuizAttempt, TopicProgress, DailyGoal } from "./types";
import { KnowledgeGraph } from "./components/KnowledgeGraph";

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() - offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // --- Persistent Storage State ---
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem("gyansetu_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      name: "Amit Kumar",
      language: "Hinglish",
      grade: "Class 7",
      topic: "Photosynthesis",
      weaknesses: ["Chlorophyll Function", "Stomata & Gas Exchange"],
    };
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("gyansetu_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default starter chat history
    return [
      {
        id: "welcome",
        role: "model",
        text: "Namaste beta! 🙏 Main aapka smart tutor GyanSetu AI hoon. Aaj hum *Photosynthesis* ke baare me seekhenge. Aapko jo bhi doubt ho, bina kisi darr ke Hindi ya Hinglish me mujhse puchein! Aap apne textbook ki photo bhi click karke bhej sakte hain. Main aapko simple, step-by-step tareeqe se real-life examples ke sath samjhaunga. Chalo, seekhte hain! ✨",
        timestamp: Date.now(),
      },
    ];
  });

  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>(() => {
    const saved = localStorage.getItem("gyansetu_quiz_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "demo-quiz-1",
        topic: "Photosynthesis",
        score: 1,
        total: 3,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
        questions: [],
        studentAnswers: [],
      },
    ];
  });

  // --- Learning Streak & Activity Tracker State ---
  const [activityDates, setActivityDates] = useState<string[]>(() => {
    const saved = localStorage.getItem("gyansetu_activity_dates");
    const todayStr = getLocalDateString(0);
    const yesterdayStr = getLocalDateString(1);
    if (saved) {
      try {
        const dates: string[] = JSON.parse(saved);
        if (!dates.includes(todayStr)) {
          const updated = [todayStr, ...dates];
          localStorage.setItem("gyansetu_activity_dates", JSON.stringify(updated));
          return updated;
        }
        return dates;
      } catch (e) {}
    }
    const initial = [todayStr, yesterdayStr];
    localStorage.setItem("gyansetu_activity_dates", JSON.stringify(initial));
    return initial;
  });

  const calculateConsecutiveStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;
    let streak = 0;
    let offset = 0;
    while (true) {
      const dateStr = getLocalDateString(offset);
      if (dates.includes(dateStr)) {
        streak++;
        offset++;
      } else {
        break;
      }
    }
    return streak;
  };

  const hasStudiedToday = () => {
    // 1. Check if any quiz attempt in quizHistory has today's date
    const todayStr = new Date().toLocaleDateString();
    const hasQuizToday = quizHistory.some(q => q.date === todayStr);

    // 2. Check if any message in chatHistory (by user) has today's timestamp
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const hasChatToday = chatHistory.some(m => m.role === "user" && m.timestamp >= startOfToday.getTime());

    return hasQuizToday || hasChatToday;
  };

  const [dismissedReminder, setDismissedReminder] = useState(() => {
    const saved = localStorage.getItem("gyansetu_dismiss_reminder");
    return saved === "true";
  });

  const [simulatedNoActivity, setSimulatedNoActivity] = useState(false);

  const handleDismissReminder = () => {
    setDismissedReminder(true);
    localStorage.setItem("gyansetu_dismiss_reminder", "true");
  };

  // Sync activity dates to localStorage
  useEffect(() => {
    localStorage.setItem("gyansetu_activity_dates", JSON.stringify(activityDates));
  }, [activityDates]);

  // --- Daily Goals State & Handlers ---
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
    const saved = localStorage.getItem("gyansetu_daily_goals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const todayStr = getLocalDateString(0);
    return [
      {
        id: "default-1",
        text: "Complete today's chemistry quiz (केमिस्ट्री क्विज पूरा करें)",
        completed: false,
        date: todayStr
      },
      {
        id: "default-2",
        text: "Ask AI Companion about photosynthesis (AI से बातचीत करें)",
        completed: false,
        date: todayStr
      }
    ];
  });

  const [newGoalText, setNewGoalText] = useState("");

  // Sync daily goals to localStorage
  useEffect(() => {
    localStorage.setItem("gyansetu_daily_goals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  const addDailyGoal = (text: string) => {
    if (!text.trim()) return;
    const newGoal: DailyGoal = {
      id: "goal-" + Date.now(),
      text: text.trim(),
      completed: false,
      date: getLocalDateString(0)
    };
    setDailyGoals(prev => [newGoal, ...prev]);
    setNewGoalText("");

    // Automatically count adding/interacting with goals as today's activity
    const todayStr = getLocalDateString(0);
    if (!activityDates.includes(todayStr)) {
      setActivityDates(prev => [todayStr, ...prev]);
    }
  };

  const toggleDailyGoal = (id: string) => {
    setDailyGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const nextCompleted = !goal.completed;
        if (nextCompleted) {
          const todayStr = getLocalDateString(0);
          if (!activityDates.includes(todayStr)) {
            setActivityDates(d => [todayStr, ...d]);
          }
        }
        return { ...goal, completed: nextCompleted };
      }
      return goal;
    }));
  };

  const deleteDailyGoal = (id: string) => {
    setDailyGoals(prev => prev.filter(goal => goal.id !== id));
  };

  // --- Share Achievements State ---
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // --- UI Interactivity State ---
  const [activeTab, setActiveTab] = useState<"chat" | "quiz" | "dashboard">("chat");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Interaction State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Active Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Countdown Timer State
  const [timerDuration, setTimerDuration] = useState<number>(30); // 0 means no timer
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [showTimeUpAlert, setShowTimeUpAlert] = useState<boolean>(false);

  // Sync / reset timer when question changes
  useEffect(() => {
    if (activeQuizQuestions.length === 0 || quizSubmitted || timerDuration === 0 || isQuizLoading) {
      return;
    }
    setTimeLeft(timerDuration);
    setIsTimerPaused(false);
    setShowTimeUpAlert(false);
  }, [currentQuizIndex, activeQuizQuestions, quizSubmitted, timerDuration, isQuizLoading]);

  // Handle countdown interval
  useEffect(() => {
    if (activeQuizQuestions.length === 0 || quizSubmitted || timerDuration === 0 || isTimerPaused || isQuizLoading) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimeUpAlert(true);
          setTimeout(() => {
            handleTimeUp();
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuizIndex, activeQuizQuestions, quizSubmitted, timerDuration, isTimerPaused, isQuizLoading, selectedAnswers]);

  // Sidebar or quick settings topics list
  const suggestedTopics = [
    "Photosynthesis",
    "Fractions (भिन्न)",
    "Water Cycle (जल चक्र)",
    "Force and Motion (बल और गति)",
    "Swarajya & Chhatrapati Shivaji",
    "Decimals & Percentages",
  ];

  // Sync profile to localStorage
  useEffect(() => {
    localStorage.setItem("gyansetu_profile", JSON.stringify(profile));
  }, [profile]);

  // Sync chat to localStorage
  useEffect(() => {
    localStorage.setItem("gyansetu_chat_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Sync quiz history to localStorage
  useEffect(() => {
    localStorage.setItem("gyansetu_quiz_history", JSON.stringify(quizHistory));
  }, [quizHistory]);

  // --- Check speech support on mount ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev ? prev + " " + transcript : transcript));
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // --- Handle Audio Out (Text-to-Speech) ---
  const speakText = (text: string, messageId: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speakingMessageId === messageId) {
      synth.cancel();
      setSpeakingMessageId(null);
      return;
    }

    synth.cancel(); // Stop any current speech
    
    // Clean markdown bold and stars from text for cleaner reading
    const cleanText = text
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/^-/g, "")
      .replace(/\[.*\]\(.*\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Find Hindi or Indian English voice based on student selection or text
    const voices = synth.getVoices();
    let selectedVoice = null;

    if (profile.language === "Hindi" || profile.language === "Hinglish") {
      selectedVoice = voices.find(v => v.lang.startsWith("hi") || v.lang.includes("hi-IN"));
    }
    
    // Fallback Indian English or any natural English
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.startsWith("en"));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Set speech attributes
    utterance.rate = 0.95; // Slightly slower for children
    utterance.pitch = 1.05; // Slightly cheerful and friendly

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setSpeakingMessageId(null);
    };

    speechUttRef.current = utterance;
    setSpeakingMessageId(messageId);
    synth.speak(utterance);
  };

  // Stop current speaking when leaving or changing tabs
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
  }, [activeTab]);

  // --- Voice Input (Speech-to-Text) ---
  const toggleRecording = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert("Aapka browser voice recognition support nahi karta. Google Chrome use karein!");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Set language dynamically
      if (profile.language === "Hindi") {
        recognitionRef.current.lang = "hi-IN";
      } else {
        recognitionRef.current.lang = "en-IN"; // Handles Hinglish/English
      }
      recognitionRef.current.start();
    }
  };

  // --- Handle Image Upload ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        // Extract raw base64 data for API (removing header metadata if exists)
        const rawBase64 = base64String.split(",")[1];
        setImageFile(rawBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Send Chat Message to Server ---
  const sendChatMessage = async (overrideMessage?: string, isSimplerTrigger = false) => {
    const textToSend = overrideMessage || chatInput.trim();
    if (!textToSend && !imageFile) return;

    // Create a unique message ID for the user message
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: Date.now(),
      imageUrl: imagePreview || undefined,
    };

    // Update state
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setIsChatLoading(true);

    // Add today's date to activity tracking
    const todayStr = getLocalDateString(0);
    if (!activityDates.includes(todayStr)) {
      setActivityDates(prev => [todayStr, ...prev]);
    }

    // Clear uploaded image previews
    const originalImageFile = imageFile;
    const originalImageType = imagePreview ? imagePreview.split(";")[0].split(":")[1] : "image/jpeg";
    clearImage();

    try {
      // Keep only last 8 messages of history for API efficiency
      const apiHistory = updatedHistory.slice(-8).map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          studentName: profile.name,
          language: profile.language,
          grade: profile.grade,
          topic: profile.topic,
          weaknesses: profile.weaknesses,
          history: apiHistory,
          image: originalImageFile,
          imageType: originalImageType,
          simpler: isSimplerTrigger,
        }),
      });

      if (!res.ok) {
        throw new Error("Kuch gadbad ho gayi server par!");
      }

      const data = await res.json();
      
      const botMsgId = `bot-${Date.now()}`;
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: data.text,
        timestamp: Date.now(),
      };

      setChatHistory(prev => [...prev, newBotMsg]);
      
      // Auto speak response in Hindi/Hinglish if requested
      if (profile.language !== "English") {
        setTimeout(() => speakText(data.text, botMsgId), 500);
      }
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          text: "Maaf kijiye beta, lagta hai internet me thodi thandak aa gayi hai. Ek baar fir se try karein! 🔌",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Fetch Dynamic Practice Quiz ---
  const startQuiz = async (topicName = profile.topic) => {
    setActiveTab("quiz");
    setIsQuizLoading(true);
    setCurrentQuizIndex(0);
    setSelectedAnswers([]);
    setQuizSubmitted(false);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topicName,
          language: profile.language,
          grade: profile.grade,
          weaknesses: profile.weaknesses,
        }),
      });

      if (!res.ok) {
        throw new Error("Quiz generate nahi ho payi");
      }

      const quizData = await res.json();
      
      // Fallback in case JSON is corrupt
      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("Invalid format received");
      }

      setActiveQuizQuestions(quizData);
    } catch (err) {
      console.error("Failed to generate dynamic quiz, loading standard backup quiz:", err);
      // High-quality backup template quiz
      const backupQuiz: QuizQuestion[] = [
        {
          question: "Plants ke patte (leaves) hare (green) kyun dikhte hain?",
          options: [
            "Hawa me Oxygen hone ke karan",
            "Chlorophyll pigment ki maujoodgi ke karan",
            "Mitti me se milne wale laal rang ke karan",
            "Water absorption ke karan"
          ],
          correctAnswer: "Chlorophyll pigment ki maujoodgi ke karan",
          explanation: "Sahi jawab! Beta, Chlorophyll ek special green pigment hota hai jo solar energy/sunlight ko trap karta hai. ISI vajah se patte green dikhte hain! 🌿"
        },
        {
          question: "Photosynthesis ke process me plants mitti (soil) se kya absorbe karte hain?",
          options: [
            "Carbon Dioxide gas",
            "Only Sunlight",
            "Pani aur Minerals (Water & Minerals)",
            "Oxygen Gas"
          ],
          correctAnswer: "Pani aur Minerals (Water & Minerals)",
          explanation: "Bahut badhiya! Roots mitti ke andar se pani (water) aur minerals khinchti hain aur fir ise stem ke raste leaves tak bhejti hain! 💧"
        },
        {
          question: "Photosynthesis ke doran plants kaunsi gas hawa me release karte hain jo hamare saas lene ke liye zaroori hai?",
          options: [
            "Carbon Dioxide (CO2)",
            "Oxygen (O2)",
            "Nitrogen (N2)",
            "Argon"
          ],
          correctAnswer: "Oxygen (O2)",
          explanation: "Perfect jawab! Plants hume sabse keemti taufa dete hain - Oxygen gas! Woh CO2 lete hain aur Oxygen bahar nikalte hain. 🌬️"
        }
      ];
      setActiveQuizQuestions(backupQuiz);
    } finally {
      setIsQuizLoading(false);
    }
  };

  // --- Evaluate and Submit Quiz ---
  const handleSelectAnswer = (option: string) => {
    if (showTimeUpAlert) return; // Prevent selection after time is up
    const updated = [...selectedAnswers];
    updated[currentQuizIndex] = option;
    setSelectedAnswers(updated);
  };

  const submitQuiz = (answers: string[]) => {
    let score = 0;
    activeQuizQuestions.forEach((q, idx) => {
      // Handle missing or time-out answers gracefully
      if (answers[idx] && answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });

    const newAttempt: QuizAttempt = {
      id: `quiz-attempt-${Date.now()}`,
      topic: profile.topic,
      score: score,
      total: activeQuizQuestions.length,
      date: new Date().toLocaleDateString(),
      questions: activeQuizQuestions,
      studentAnswers: answers,
    };

    setQuizHistory(prev => [newAttempt, ...prev]);
    setQuizSubmitted(true);

    // Add today's date to activity tracking on quiz completion
    const todayStr = getLocalDateString(0);
    if (!activityDates.includes(todayStr)) {
      setActivityDates(prev => [todayStr, ...prev]);
    }

    // --- DYNAMIC AI STUDENT AGENT WEAKNESS RECALCULATION ---
    // If student fails/scores low, analyze weaknesses
    if (score < activeQuizQuestions.length) {
      // Find which question they got wrong (including timed out or unselected ones)
      const wrongIdx = answers.findIndex((ans, idx) => !ans || ans !== activeQuizQuestions[idx].correctAnswer);
      if (wrongIdx !== -1) {
        const wrongQuestion = activeQuizQuestions[wrongIdx].question;
        
        // Generate an elegant, short keyword representing the struggle area
        let weakArea = "Concept Review";
        if (wrongQuestion.toLowerCase().includes("leaf") || wrongQuestion.toLowerCase().includes("chlorophyll") || wrongQuestion.toLowerCase().includes("patte") || wrongQuestion.toLowerCase().includes("hare")) {
          weakArea = "Chlorophyll Function";
        } else if (wrongQuestion.toLowerCase().includes("gas") || wrongQuestion.toLowerCase().includes("oxygen") || wrongQuestion.toLowerCase().includes("release") || wrongQuestion.toLowerCase().includes("co2")) {
          weakArea = "Gas Exchange & Stomata";
        } else if (wrongQuestion.toLowerCase().includes("absorb") || wrongQuestion.toLowerCase().includes("roots") || wrongQuestion.toLowerCase().includes("pani") || wrongQuestion.toLowerCase().includes("water")) {
          weakArea = "Water Absorption process";
        } else {
          weakArea = `${profile.topic} Essentials`;
        }

        // Append to weaknesses if not already there
        if (!profile.weaknesses.includes(weakArea)) {
          setProfile(prev => ({
            ...prev,
            weaknesses: [...prev.weaknesses, weakArea],
          }));
        }
      }
    } else {
      // If they aced the quiz, clear some weaknesses of the topic!
      if (profile.weaknesses.length > 0) {
        setProfile(prev => ({
          ...prev,
          weaknesses: prev.weaknesses.slice(1), // Clear one weaknesses as they showed mastery!
        }));
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < activeQuizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      submitQuiz(selectedAnswers);
    }
  };

  const handleTimeUp = () => {
    // Determine selected option or mark "Time Out / No Answer"
    const currentAns = selectedAnswers[currentQuizIndex];
    const finalAns = currentAns || "Time Out / No Answer";
    
    setSelectedAnswers(prev => {
      const updated = [...prev];
      updated[currentQuizIndex] = finalAns;
      return updated;
    });

    // Advance to next or submit
    if (currentQuizIndex < activeQuizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      // Assemble final list of answers (incorporating the timed out answer)
      const finalAnswersList = [...selectedAnswers];
      finalAnswersList[currentQuizIndex] = finalAns;
      submitQuiz(finalAnswersList);
    }
  };

  // --- Dynamic Dashboard Metrics ---
  const calculateMetrics = () => {
    const streak = calculateConsecutiveStreak(activityDates);
    if (quizHistory.length === 0) return { avg: 0, totalScore: 0, streak: Math.max(1, streak) };
    
    // Calculate overall average score
    const totalScore = quizHistory.reduce((sum, item) => sum + item.score, 0);
    const totalQuestions = quizHistory.reduce((sum, item) => sum + item.total, 0);
    const avg = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    return { avg, totalScore, streak };
  };

  const metrics = calculateMetrics();

  // Define badges list and check if they are unlocked dynamically
  const getBadges = () => {
    const { streak } = metrics;
    const hasPerfectScore = quizHistory.some(q => q.score === q.total && q.total > 0);
    
    const hasBiologyPerfect = quizHistory.some(
      q => q.score === q.total && q.total > 0 && 
      (q.topic.toLowerCase().includes("photosynthesis") || q.topic.toLowerCase().includes("cycle") || q.topic.toLowerCase().includes("biology") || q.topic.toLowerCase().includes("plant"))
    );
    
    const hasMathPerfect = quizHistory.some(
      q => q.score === q.total && q.total > 0 && 
      (q.topic.toLowerCase().includes("fraction") || q.topic.toLowerCase().includes("decimal") || q.topic.toLowerCase().includes("math") || q.topic.toLowerCase().includes("percentage"))
    );

    const perfectCount = quizHistory.filter(q => q.score === q.total && q.total > 0).length;

    return [
      {
        id: "concept-crusher",
        name: "Concept Crusher",
        hindiName: "कॉन्सेप्ट क्रशर",
        description: "Achieve a perfect 100% score on any quiz.",
        hindiDescription: "किसी भी क्विज में पूरे 100% अंक प्राप्त करें।",
        icon: "Sparkles",
        earned: hasPerfectScore,
        color: "from-amber-400 to-orange-500 text-amber-950",
        bgLight: "bg-amber-50/70 border-amber-200",
        badgeStyle: "shadow-amber-200 border-amber-300",
      },
      {
        id: "biology-master",
        name: "Biology Master",
        hindiName: "जीवविज्ञान मास्टर",
        description: "Achieve a perfect 100% score on a Biology topic.",
        hindiDescription: "जीवविज्ञान विषय (जैसे Photosynthesis) पर पूरा स्कोर पाएं।",
        icon: "BookOpenText",
        earned: hasBiologyPerfect,
        color: "from-emerald-400 to-teal-500 text-emerald-950",
        bgLight: "bg-emerald-50/70 border-emerald-200",
        badgeStyle: "shadow-emerald-200 border-emerald-300",
      },
      {
        id: "math-wizard",
        name: "Math Wizard",
        hindiName: "गणित विजार्ड",
        description: "Achieve a perfect 100% score on a Mathematics topic.",
        hindiDescription: "गणित विषय (जैसे Fractions) पर पूरा स्कोर पाएं।",
        icon: "Award",
        earned: hasMathPerfect,
        color: "from-blue-400 to-indigo-500 text-blue-950",
        bgLight: "bg-blue-50/70 border-blue-200",
        badgeStyle: "shadow-blue-200 border-blue-300",
      },
      {
        id: "streak-star",
        name: "Streak Star",
        hindiName: "स्ट्रीक स्टार",
        description: "Maintain a learning streak of 3 or more days.",
        hindiDescription: "3 या अधिक दिनों की लगातार पढ़ाई की स्ट्रीक बनाएं।",
        icon: "Clock",
        earned: streak >= 3,
        color: "from-red-400 to-rose-500 text-red-950",
        bgLight: "bg-rose-50/70 border-rose-200",
        badgeStyle: "shadow-rose-200 border-rose-300",
      },
      {
        id: "curious-mind",
        name: "Curious Mind",
        hindiName: "जिज्ञासु दिमाग",
        description: "Ask at least 5 questions or complete 3 quizzes.",
        hindiDescription: "कम से कम 5 सवाल पूछें या 3 क्विज पूरे करें।",
        icon: "Compass",
        earned: quizHistory.length >= 3 || chatHistory.length >= 5,
        color: "from-purple-400 to-fuchsia-500 text-purple-950",
        bgLight: "bg-purple-50/70 border-purple-200",
        badgeStyle: "shadow-purple-200 border-purple-300",
      },
      {
        id: "gyan-guru",
        name: "Gyan Guru",
        hindiName: "ज्ञान गुरु",
        description: "Achieve a perfect 100% score on 3 or more quizzes.",
        hindiDescription: "3 या अधिक क्विज में पूरे 100% अंक प्राप्त करें।",
        icon: "FileText",
        earned: perfectCount >= 3,
        color: "from-yellow-400 to-amber-500 text-yellow-950",
        bgLight: "bg-yellow-50/70 border-yellow-200",
        badgeStyle: "shadow-yellow-200 border-yellow-300",
      }
    ];
  };

  const badges = getBadges();

  const renderBadgeIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Sparkles": return <Sparkles className={className} />;
      case "BookOpenText": return <BookOpenText className={className} />;
      case "Award": return <Award className={className} />;
      case "Clock": return <Clock className={className} />;
      case "Compass": return <Compass className={className} />;
      case "FileText": return <FileText className={className} />;
      default: return <Award className={className} />;
    }
  };

  // Clean chat history
  const clearChatHistory = () => {
    if (confirm("Kya aap saari chat history delete karna chahte hain?")) {
      const defaultWelcome: ChatMessage = {
        id: "welcome",
        role: "model",
        text: `Namaste ${profile.name}! Beta, chalo dubaara se seedha aur mazedaar learning start karte hain. Poochho Photosynthesis ya kisi bhi topic se juda koi bhi sawaal! 🙏🌿`,
        timestamp: Date.now(),
      };
      setChatHistory([defaultWelcome]);
    }
  };

  // Trigger quick revision help inside Chat
  const triggerRevisionHelp = (topicName: string, subTopic: string) => {
    setActiveTab("chat");
    const promptMessage = `Pls explain "${subTopic}" inside topic "${topicName}" with a simple real-life analogy!`;
    setChatInput(promptMessage);
    // Automatically send it
    setTimeout(() => {
      sendChatMessage(promptMessage);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="gyansetu-root">
      
      {/* HEADER BAR */}
      <header className="bg-amber-600 text-white shadow-md border-b border-amber-700 sticky top-0 z-50 py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-full shadow-inner border border-amber-400">
              <Sparkles className="w-6 h-6 text-yellow-100 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 font-display">
                GyanSetu AI <span className="text-xs bg-amber-700 px-2 py-0.5 rounded-full text-amber-100 font-normal">MVP</span>
              </h1>
              <p className="text-xs text-amber-100">Aapka Anokha Multilingual Learning Guide 🎓</p>
            </div>
          </div>

          {/* Student Status & Config */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            
            {/* Quick Profile Viewer */}
            <button
              onClick={() => setShowProfileSetup(true)}
              className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 transition px-3 py-1.5 rounded-lg border border-amber-500 shadow-sm cursor-pointer"
              id="btn-edit-profile"
            >
              <User className="w-4 h-4 text-amber-200" />
              <span>
                <strong>{profile.name}</strong> ({profile.grade})
              </span>
            </button>

            {/* Learning Streak Counter */}
            <div 
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1.5 rounded-lg border border-red-400 shadow-sm text-white font-bold hover:scale-105 cursor-pointer transition active:scale-95"
              title="Aapka Lagatar Padhai ka Record! (Consecutive Days of Activity)"
              id="header-streak-counter"
            >
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>{metrics.streak} Day{metrics.streak !== 1 ? "s" : ""} Streak 🔥</span>
            </div>

            {/* Quick Language Toggle */}
            <div className="flex items-center bg-amber-800 rounded-lg p-0.5 border border-amber-600">
              {(["Hindi", "Hinglish", "English"] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setProfile(prev => ({ ...prev, language: lang }))}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    profile.language === lang
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-200 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

          </div>

        </div>
      </header>

      {/* CORE VIEWPORT LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* SIDEBAR: Student Profile Summary, Dynamic Weaknesses and Quick Topics */}
        <aside className="lg:col-span-1 flex flex-col gap-5">
          
          {/* Bento card: Current topic status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-500" /> Current Focus Topic
            </h3>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-slate-800">{profile.topic}</h4>
                <p className="text-xs text-slate-500">Class: {profile.grade}</p>
              </div>
              <span className="text-2xl">🌱</span>
            </div>

            {/* Change topic list */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-500 block mb-2">Padhai ka Topic Badlein:</label>
              <select
                value={profile.topic}
                onChange={(e) => {
                  const newTopic = e.target.value;
                  setProfile(prev => ({ ...prev, topic: newTopic }));
                  // Push customized system greeting for the new topic
                  const greeting =
                    profile.language === "Hindi"
                      ? `Very Good! Chalo ab hum **${newTopic}** ke baare me seekhte hain. Aapko isme kya dubaara samajhna hai ya koi sawal hai? Mujhe likh kar bhejien! 🚀`
                      : profile.language === "Hinglish"
                        ? `Arey wah! Ab hum **${newTopic}** ke concepts samjhenge. Is topic se related jo bhi doubt ho, turant poochiye! 😄`
                        : `Great choice! Let's explore **${newTopic}** now. Tell me what topic, concept or question you'd like to understand first! 📚`;
                  
                  setChatHistory(prev => [
                    ...prev,
                    {
                      id: `switch-${Date.now()}`,
                      role: "model",
                      text: greeting,
                      timestamp: Date.now(),
                    }
                  ]);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2 font-medium text-slate-700 outline-none"
              >
                {suggestedTopics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bento card: Weakness Tracker with Quick Explain Triggers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Target Weak Areas
            </h3>
            
            {profile.weaknesses.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center py-6">
                <span className="text-3xl mb-2">🎉</span>
                <p className="text-xs font-semibold text-emerald-600">No weak areas identified!</p>
                <p className="text-[11px] text-slate-400 mt-1">Quiz dekar apna performance test karein.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] pr-1">
                <p className="text-xs text-slate-500 leading-relaxed mb-1">
                  AI ne in topics me kam accuracy detect ki hai. Quick revision ke liye niche click karein:
                </p>
                {profile.weaknesses.map((weak, idx) => (
                  <div
                    key={idx}
                    onClick={() => triggerRevisionHelp(profile.topic, weak)}
                    className="flex items-center justify-between bg-red-50/50 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-xl p-2.5 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-red-700 transition">
                        {weak}
                      </span>
                    </div>
                    <span className="text-[10px] text-red-600 font-bold bg-white border border-red-200 px-1.5 py-0.5 rounded-full">
                      Revise ⚡
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {profile.weaknesses.length > 0 && (
              <button
                onClick={() => setProfile(prev => ({ ...prev, weaknesses: [] }))}
                className="mt-4 w-full border border-slate-200 hover:bg-slate-50 transition text-slate-500 text-[10px] py-1 rounded-lg font-medium"
              >
                Clear Weaknesses
              </button>
            )}
          </div>

          {/* Small Vedic Quote / Fun Learning tip */}
          <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-4 text-xs text-amber-800 leading-relaxed italic shadow-sm">
            <strong className="block text-[10px] uppercase font-bold text-amber-600 tracking-wider mb-1">Guru Mantra of the Day:</strong>
            "Asli seekhna tab hota hai jab hum question poochne se nahi darte! Galatiyaan hi humare dimaag ki khurak hoti hain." 🌱💡
          </div>

        </aside>

        {/* MAIN AREA: Interactive Tabs and Viewport */}
        <main className="lg:col-span-3 flex flex-col gap-6">
          
          {/* DAILY REMINDER & STUDY NUDGE BANNER */}
          {(!dismissedReminder) && (() => {
            const studiedToday = hasStudiedToday() && !simulatedNoActivity;
            const streak = calculateConsecutiveStreak(activityDates);

            return (
              <div 
                className={`rounded-3xl border p-5 shadow-sm transition-all duration-300 relative overflow-hidden ${
                  studiedToday 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                    : "bg-gradient-to-r from-amber-50 to-orange-50/50 border-amber-200 text-amber-900 shadow-amber-100/50"
                }`}
                id="daily-study-reminder"
              >
                {/* Close Button */}
                <button 
                  onClick={handleDismissReminder}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-black/5 cursor-pointer"
                  title="Hide Reminder"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className={`p-3 rounded-2xl flex-shrink-0 ${
                    studiedToday ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600 animate-bounce"
                  }`}>
                    {studiedToday ? (
                      <Sparkles className="w-6 h-6" />
                    ) : (
                      <Bell className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-base flex items-center gap-1.5">
                        {studiedToday 
                          ? "Daily Goal Completed! (आज का लक्ष्य पूरा हुआ) 🎉" 
                          : "Daily Study Reminder! (रोजाना अभ्यास याद दिलाना) 📅"
                        }
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        studiedToday ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"
                      }`}>
                        Streak status: {streak} Day{streak !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <p className="text-xs mt-1.5 leading-relaxed text-slate-700">
                      {studiedToday 
                        ? `Arey wah ${profile.name}! Aaj aapne padhai kar li hai aur apna ${streak}-day active streak secure kar liya hai. Kal dubaara zaroor aana! 🌟`
                        : `Namaste ${profile.name}! Aapne aaj abhi tak koi learning activity nahi ki hai. Apni active learning streak ko tootne se bachane ke liye ek quick quiz karein ya chat par sawaal puchein! 🎯`
                      }
                    </p>

                    {/* Quick action buttons */}
                    {!studiedToday && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          onClick={() => {
                            setActiveTab("quiz");
                            startQuiz();
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
                        >
                          <BookOpenText className="w-3.5 h-3.5" /> Start Practice Quiz
                        </button>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="bg-white hover:bg-slate-50 border border-amber-200 text-amber-800 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-600" /> Ask AI Companion
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dev/Review Test Controls */}
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px]">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    🔧 Streak Tester:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSimulatedNoActivity(prev => !prev);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 transition cursor-pointer font-medium"
                    >
                      Toggle Studied Status (simulate {studiedToday ? "No Study" : "Studied"})
                    </button>
                    <button
                      onClick={() => {
                        // Simulate Yesterday Missed (removes everything except today's date)
                        const todayStr = getLocalDateString(0);
                        setActivityDates([todayStr]);
                        setSimulatedNoActivity(false);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-300 hover:border-rose-200 rounded-lg text-slate-700 transition cursor-pointer font-medium"
                    >
                      Reset Streak (1-Day)
                    </button>
                    <button
                      onClick={() => {
                        // Simulate 5-day streak
                        const streakDates = Array.from({ length: 5 }, (_, i) => getLocalDateString(i));
                        setActivityDates(streakDates);
                        setSimulatedNoActivity(false);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-300 hover:border-emerald-200 rounded-lg text-slate-700 transition cursor-pointer font-medium"
                    >
                      Set 5-Day Streak
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB HEADERS NAVIGATION */}
          <div className="flex bg-slate-200/60 rounded-2xl p-1 shadow-inner border border-slate-200/50">
            
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
                activeTab === "chat"
                  ? "bg-white text-amber-700 shadow-md"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>GyanSetu Chat (वार्तालाप)</span>
            </button>

            <button
              onClick={() => startQuiz()}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
                activeTab === "quiz"
                  ? "bg-white text-amber-700 shadow-md"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
              id="tab-quiz"
            >
              <BookOpenText className="w-4 h-4" />
              <span>Practice Quiz (अभ्यास)</span>
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 ${
                activeTab === "dashboard"
                  ? "bg-white text-amber-700 shadow-md"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Dashboard (प्रगति)</span>
            </button>

          </div>

          {/* RENDER ACTIVE TAB COMPONENT */}
          <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            
            {/* 1. CHAT TAB COMPONENT */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col h-full">
                
                {/* Chat Top Banner */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-xs font-bold text-slate-700">GyanSetu Live Companion is Online</p>
                  </div>
                  
                  {/* Clear Button */}
                  <button
                    onClick={clearChatHistory}
                    className="text-slate-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-slate-100"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[450px]">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {/* Message Box */}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3.5 shadow-sm text-sm ${
                          msg.role === "user"
                            ? "bg-amber-600 text-white rounded-tr-none"
                            : "bg-slate-100/80 text-slate-800 rounded-tl-none border border-slate-200"
                        }`}
                      >
                        {/* Image Preview inside chat bubbles */}
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20 shadow-inner">
                            <img
                              src={msg.imageUrl}
                              alt="Uploaded visual context"
                              className="max-h-[160px] w-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Text formatting with simple support for bold strings */}
                        <p className="whitespace-pre-line leading-relaxed text-sm md:text-[14px]">
                          {msg.text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                        
                        {/* Interactive Voice Out Button for Bot Messages */}
                        {msg.role === "model" && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex justify-between items-center text-xs text-slate-500">
                            <button
                              onClick={() => speakText(msg.text, msg.id)}
                              className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1.5 rounded-lg ${
                                speakingMessageId === msg.id
                                  ? "bg-amber-100 text-amber-700 animate-pulse border border-amber-200"
                                  : "bg-white hover:bg-slate-50 hover:text-amber-700 border border-slate-200"
                              }`}
                            >
                              {speakingMessageId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Stop Voice 🔊</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Sunein (सुनें) 🗣️</span>
                                </>
                              )}
                            </button>

                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading Bot Indicator */}
                  {isChatLoading && (
                    <div className="flex justify-start items-center gap-3">
                      <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-slate-500 text-xs flex items-center gap-2">
                        <span className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                        </span>
                        <span>GyanSetu soch raha hai...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Chat Shortcut Helper Buttons */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => sendChatMessage(undefined, true)}
                    disabled={isChatLoading || chatHistory.length <= 1}
                    className="bg-white hover:bg-amber-50 border border-amber-200 disabled:opacity-50 text-amber-700 font-bold text-xs px-3.5 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5"
                  >
                    💡 Aasaan bhasha me samjhao (Explain Simpler)
                  </button>
                  <button
                    onClick={() => startQuiz()}
                    disabled={isChatLoading}
                    className="bg-white hover:bg-emerald-50 border border-emerald-200 disabled:opacity-50 text-emerald-700 font-bold text-xs px-3.5 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5"
                  >
                    📝 Mera Quiz lelo! (Take Quiz)
                  </button>
                </div>

                {/* Inputs Bar */}
                <div className="p-4 border-t border-slate-150 bg-white">
                  
                  {/* Image Upload Preview Row */}
                  {imagePreview && (
                    <div className="mb-3 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-2 max-w-sm animate-fadeIn">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-amber-200 shadow">
                        <img
                          src={imagePreview}
                          alt="Textbook Upload Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">Textbook Page Uploaded</p>
                        <p className="text-[10px] text-slate-500">GPT Vision alternates via Gemini Multimodal</p>
                      </div>
                      <button
                        onClick={clearImage}
                        className="p-1.5 bg-white border border-amber-200 hover:bg-amber-100 rounded-full text-amber-700 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    
                    {/* Upload textbook button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-800 transition shadow-sm"
                      title="Upload textbook photo"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Chat Text Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                        placeholder={
                          profile.language === "Hindi"
                            ? "Mujhse apna sawal hindi me poochhein..."
                            : profile.language === "Hinglish"
                              ? "Yahan sawal likhein (e.g., chlorophyll kya hota h?)"
                              : "Ask your question or upload textbook photo..."
                        }
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 hover:border-slate-300 rounded-2xl py-3 pl-4 pr-12 text-sm outline-none transition shadow-inner"
                        disabled={isChatLoading}
                      />
                      
                      {/* Microphone speech-to-text trigger button */}
                      <button
                        onClick={toggleRecording}
                        className={`absolute right-2 top-1.5 p-2 rounded-xl transition ${
                          isRecording
                            ? "bg-red-500 text-white animate-ping"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                        title={isRecording ? "Listening... click to stop" : "Speak to ask (बोल कर पूछें)"}
                      >
                        {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={() => sendChatMessage()}
                      disabled={isChatLoading || (!chatInput.trim() && !imageFile)}
                      className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-md"
                    >
                      Bhejein 🚀
                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* 2. QUIZ TAB COMPONENT */}
            {activeTab === "quiz" && (
              <div className="flex-1 p-6 flex flex-col justify-center">
                
                {isQuizLoading ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-12">
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-sm font-bold text-slate-700 mt-4">GyanSetu aapke liye smart MCQs bana raha hai...</h3>
                    <p className="text-xs text-slate-400 mt-1">Struggling area: {profile.weaknesses[0] || "General"}</p>
                  </div>
                ) : activeQuizQuestions.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-12 text-center max-w-md mx-auto">
                    <span className="text-5xl mb-3">📝</span>
                    <h3 className="text-lg font-bold text-slate-800">Topic: {profile.topic} Quiz</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2">
                      Gemini model se generated personalized quiz. Yeh test karega aapke weak areas ko aur instant feedback dega!
                    </p>

                    {/* Timer Mode Selection */}
                    <div className="mt-6 w-full max-w-sm bg-slate-50 border border-slate-200 rounded-3xl p-4 text-left shadow-sm">
                      <h4 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" /> Quiz Timer Mode (समय सीमा तय करें)
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "🚫 No Timer", desc: "Untimed practice", value: 0 },
                          { label: "⚡ Speed Run", desc: "15 seconds pressure", value: 15 },
                          { label: "⏱️ Standard", desc: "30 seconds balance", value: 30 },
                          { label: "🕰️ Relaxed", desc: "60 seconds calm", value: 60 }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => setTimerDuration(mode.value)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                              timerDuration === mode.value
                                ? "bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-100"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-xs font-black text-slate-800">{mode.label}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{mode.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => startQuiz()}
                      className="mt-6 bg-amber-600 hover:bg-amber-700 transition px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Quiz Start Karein 🚀
                    </button>
                  </div>
                ) : !quizSubmitted ? (
                  // Active interactive quiz session
                  <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full py-2">
                    
                    {/* Progress tracking */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Practice Quiz ({profile.topic})
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Question {currentQuizIndex + 1} of {activeQuizQuestions.length}
                        </span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${((currentQuizIndex + 1) / activeQuizQuestions.length) * 100}%` }}
                        ></div>
                      </div>

                      {/* COUNTDOWN TIMER BAR */}
                      {timerDuration > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? "text-red-500 animate-bounce" : "text-amber-600 animate-spin"}`} style={{ animationDuration: timeLeft <= 5 ? '0.5s' : '6s' }} />
                            <span className="text-xs font-bold text-slate-700">
                              Time Remaining:{" "}
                              <span className={`text-sm font-black ${timeLeft <= 5 ? "text-red-600 animate-pulse text-base" : "text-amber-700"}`}>
                                {timeLeft}s
                              </span>
                            </span>
                          </div>

                          {/* Interactive progress bar */}
                          <div className="flex-1 max-w-[180px] bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                timeLeft <= 5 
                                  ? "bg-red-500 animate-pulse" 
                                  : timeLeft <= (timerDuration / 3) 
                                    ? "bg-orange-500" 
                                    : "bg-emerald-500"
                              }`} 
                              style={{ width: `${(timeLeft / timerDuration) * 100}%` }}
                            />
                          </div>

                          {/* Pause / Play button */}
                          <button
                            onClick={() => setIsTimerPaused(!isTimerPaused)}
                            className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                              isTimerPaused 
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400" 
                                : "bg-white hover:bg-slate-150 text-slate-600 border-slate-300"
                            }`}
                            title={isTimerPaused ? "Resume Timer" : "Pause Timer"}
                          >
                            {isTimerPaused ? "▶ Resume" : "⏸ Pause"}
                          </button>
                        </div>
                      )}

                      {/* CONDITIONAL INTERACTIVE DISPLAY: Paused, Time's Up, or Question Card */}
                      {isTimerPaused ? (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8 text-center my-6 shadow-sm flex flex-col items-center justify-center gap-3">
                          <span className="text-4xl animate-pulse">⏸️</span>
                          <h4 className="text-sm font-extrabold text-slate-800">Quiz is Paused! (क्विज रुकी हुई है)</h4>
                          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                            Beta, timer paused hai. Question chupa diya hai taaki pressure bina socha ja sake. Jab taiyar ho toh resume karein!
                          </p>
                          <button
                            onClick={() => setIsTimerPaused(false)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition cursor-pointer shadow-sm"
                          >
                            ▶ Resume Quiz
                          </button>
                        </div>
                      ) : showTimeUpAlert ? (
                        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 text-center my-6 shadow-sm flex flex-col items-center justify-center gap-3 animate-bounce">
                          <span className="text-4xl">⏰</span>
                          <h4 className="text-sm font-extrabold text-rose-800">Time's Up! (समय समाप्त)</h4>
                          <p className="text-xs text-rose-600 font-bold">
                            Beta aapka time khatam ho gaya. Agla question aa raha hai...
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Question box */}
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
                            <h4 className="text-md md:text-lg font-bold text-slate-800 leading-relaxed">
                              {activeQuizQuestions[currentQuizIndex]?.question}
                            </h4>
                          </div>

                          {/* Options listing */}
                          <div className="space-y-3">
                            {activeQuizQuestions[currentQuizIndex]?.options.map((option, idx) => {
                              const isSelected = selectedAnswers[currentQuizIndex] === option;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleSelectAnswer(option)}
                                  className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all duration-200 flex justify-between items-center shadow-sm cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-100"
                                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700"
                                  }`}
                                >
                                  <span>{option}</span>
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                                    isSelected ? "border-amber-600 bg-amber-600 text-white" : "border-slate-300"
                                  }`}>
                                    {isSelected ? "✓" : String.fromCharCode(65 + idx)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Lower actions footer */}
                    <div className="mt-8 pt-5 border-t border-slate-150 flex justify-between items-center">
                      <button
                        onClick={() => {
                          if (confirm("Kya aap sach me quiz beech me chhodna chahte hain?")) {
                            setActiveQuizQuestions([]);
                          }
                        }}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
                      >
                        Cancel Quiz
                      </button>

                      <button
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswers[currentQuizIndex]}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 transition px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md flex items-center gap-1.5"
                      >
                        <span>
                          {currentQuizIndex === activeQuizQuestions.length - 1 ? "Submit Score 🏁" : "Agla Sawaal (Next) →"}
                        </span>
                      </button>
                    </div>

                  </div>
                ) : (
                  // Quiz completed results scorecard screen
                  <div className="flex-1 max-w-2xl mx-auto w-full py-4 text-center">
                    
                    {/* Medal / Trophy icon */}
                    <div className="inline-flex p-4 bg-amber-100 rounded-full shadow-inner mb-4">
                      <Award className="w-12 h-12 text-amber-600" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-slate-800">Shabaash! Quiz Poori Huyi 🎉</h3>
                    <p className="text-slate-500 text-xs mt-1 mb-4">Aapne topic <strong>{profile.topic}</strong> ki practice complete ki hai.</p>

                    {/* Perfect Score Special Badge Celebration */}
                    {quizHistory[0] && quizHistory[0].score === quizHistory[0].total && quizHistory[0].total > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                        className="my-5 max-w-sm mx-auto bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg border border-amber-400 relative overflow-hidden"
                      >
                        {/* Sparkles effects */}
                        <div className="absolute top-2 right-2 animate-pulse">
                          <Sparkles className="w-5 h-5 text-yellow-200" />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Sparkles className="w-4 h-4 text-yellow-100" />
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-4xl mb-2">🏆</span>
                          <h4 className="text-xs font-extrabold tracking-wider uppercase text-yellow-200">
                            Badge Unlocked! (बैज अनलॉक हुआ!)
                          </h4>
                          <h3 className="text-lg font-black mt-1">
                            {(() => {
                              const isBio = quizHistory[0]?.topic.toLowerCase().includes("photosynthesis") || quizHistory[0]?.topic.toLowerCase().includes("cycle") || quizHistory[0]?.topic.toLowerCase().includes("biology") || quizHistory[0]?.topic.toLowerCase().includes("plant");
                              const isMath = quizHistory[0]?.topic.toLowerCase().includes("fraction") || quizHistory[0]?.topic.toLowerCase().includes("decimal") || quizHistory[0]?.topic.toLowerCase().includes("math") || quizHistory[0]?.topic.toLowerCase().includes("percentage");
                              if (isBio) {
                                return profile.language === "Hindi" ? "Biology Master 🌿" : "Biology Master 🌿";
                              } else if (isMath) {
                                return profile.language === "Hindi" ? "Math Wizard 📐" : "Math Wizard 📐";
                              } else {
                                return profile.language === "Hindi" ? "Concept Crusher ⚡" : "Concept Crusher ⚡";
                              }
                            })()}
                          </h3>
                          <p className="text-[11px] text-amber-50 mt-2 leading-relaxed">
                            {profile.language === "Hindi"
                              ? "Shabaash! Aapne is topic ke saare sawalo ke sahi jawab dekar dimaag ki shakti ka pradarshan kiya hai! Aapko humare 'Medal Gallery' me ye medal mil gaya hai."
                              : profile.language === "Hinglish"
                                ? "Superb beta! Aapne quiz me 100% accurate answers dekar is badge ko apna bana liya hai! Medal Gallery me check karein! Proud of you!"
                                : "Congratulations! You answered all questions correctly and unlocked this special badge! Check it out in your Medal Gallery."}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Big Scorecard Board */}
                    <div className="my-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Final Accuracy Score</p>
                      <h4 className="text-5xl font-extrabold text-amber-600 my-2">
                        {quizHistory[0]?.score} <span className="text-xl text-slate-400 font-normal">/ {quizHistory[0]?.total}</span>
                      </h4>
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        {quizHistory[0]?.score === 3
                          ? "Perfect score! Aapne kamaal kar diya! 🌟"
                          : quizHistory[0]?.score === 2
                            ? "Bahut badhiya beta! Thodi si practice aur fir perfect! 👍"
                            : "Koshish acchi thi, dubaara seekhein aur samjhein! 🌿"}
                      </p>
                    </div>

                    {/* Explanations Accordion Loop */}
                    <div className="text-left space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-1 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Answers Sheet Analysis:</h5>
                      {quizHistory[0]?.questions.map((q, idx) => {
                        const studentAns = quizHistory[0]?.studentAnswers[idx];
                        const isCorrect = studentAns === q.correctAnswer;
                        
                        return (
                          <div key={idx} className="border-b border-slate-150 pb-3 last:border-b-0 last:pb-0">
                            <p className="text-xs font-bold text-slate-800 mb-1 flex items-start gap-1.5">
                              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                              <span>Q{idx+1}: {q.question}</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Aapka Jawab: <span className={isCorrect ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>{studentAns}</span>
                            </p>
                            {!isCorrect && (
                              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                Correct Jawab: {q.correctAnswer}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2.5 mt-2 leading-relaxed italic">
                              💡 {q.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions bar */}
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => startQuiz()}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" /> Repeat Quiz
                      </button>
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5"
                      >
                        Ask GyanSetu AI doubts 🗣️
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* 3. DASHBOARD TAB COMPONENT */}
            {activeTab === "dashboard" && (
              <div className="flex-1 p-6 flex flex-col gap-5">
                
                {/* Stats Bento Grid Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Metric Card 1: Accuracy */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Average Accuracy</h4>
                      <p className="text-xl md:text-2xl font-black text-slate-800">{metrics.avg}%</p>
                    </div>
                  </div>

                  {/* Metric Card 2: Streak */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Daily Streak</h4>
                      <p className="text-xl md:text-2xl font-black text-slate-800">{metrics.streak} Days 🔥</p>
                    </div>
                  </div>

                  {/* Metric Card 3: Total Completed */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase">Total Quizzes</h4>
                      <p className="text-xl md:text-2xl font-black text-slate-800">{quizHistory.length}</p>
                    </div>
                  </div>

                </div>

                {/* VISUAL SVG HISTORICAL LINE CHART */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Progress Chart over Time (Accuracy Level)
                  </h4>

                  {quizHistory.length === 0 ? (
                    <div className="h-40 flex justify-center items-center text-slate-400 text-xs">
                      No quiz data available yet. Start your first quiz!
                    </div>
                  ) : (
                    <div className="w-full h-40">
                      {/* Simple high-fidelity SVG responsive line graph */}
                      <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                        {/* Grid lines */}
                        <line x1="10" y1="20" x2="490" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="10" y1="60" x2="490" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="10" y1="100" x2="490" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />

                        {/* Chart path generator */}
                        {(() => {
                          const points = quizHistory
                            .slice(0, 6)
                            .reverse()
                            .map((item, idx, arr) => {
                              const x = 20 + (idx * 450) / Math.max(1, arr.length - 1);
                              const pct = item.total > 0 ? item.score / item.total : 0;
                              const y = 100 - pct * 80; // Scale 0-100% to height 20-100
                              return { x, y, score: item.score, date: item.date };
                            });

                          const pathD = points.length > 1
                            ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
                            : "";

                          return (
                            <>
                              {/* Glowing path background */}
                              {points.length > 1 && (
                                <path
                                  d={`${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
                                  fill="rgba(217, 119, 6, 0.1)"
                                />
                              )}
                              
                              {/* Actual line path */}
                              {points.length > 1 && (
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke="#d97706"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              )}

                              {/* Interactive dot markers */}
                              {points.map((p, i) => (
                                <g key={i}>
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="5"
                                    fill="#d97706"
                                    stroke="#fff"
                                    strokeWidth="2"
                                    className="cursor-pointer"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 10}
                                    fontSize="8"
                                    textAnchor="middle"
                                    className="fill-slate-600 font-bold"
                                  >
                                    Score: {p.score}
                                  </text>
                                  <text
                                    x={p.x}
                                    y="115"
                                    fontSize="7"
                                    textAnchor="middle"
                                    className="fill-slate-400 font-medium"
                                  >
                                    {p.date}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  )}
                </div>

                {/* KNOWLEDGE GRAPH COMPONENT */}
                <KnowledgeGraph
                  currentTopic={profile.topic}
                  onTopicChange={(topic) => setProfile(prev => ({ ...prev, topic }))}
                  onStartQuiz={(topic) => {
                    setProfile(prev => ({ ...prev, topic }));
                    setActiveTab("quiz");
                    startQuiz(topic);
                  }}
                  onAskAI={(topic) => {
                    setProfile(prev => ({ ...prev, topic }));
                    setActiveTab("chat");
                    sendChatMessage(`Mujhe **${topic}** ke baare mein detail mein samjhao (Explain this topic in detail)`);
                  }}
                  language={profile.language}
                />

                {/* DAILY LEARNING GOALS SECTION */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm" id="daily-goals-container">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-600 animate-pulse" /> Daily Learning Goals (आज के लक्ष्य)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Plan what you want to learn today and tick them off when done! (आज की पढ़ाई का लक्ष्य तय करें)
                      </p>
                    </div>

                    {/* Progress indicator */}
                    {(() => {
                      const todayStr = getLocalDateString(0);
                      const todaysGoals = dailyGoals.filter(g => g.date === todayStr);
                      const completedCount = todaysGoals.filter(g => g.completed).length;
                      const totalCount = todaysGoals.length;
                      const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return totalCount > 0 ? (
                        <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-2xl px-3 py-1.5 shrink-0 self-start md:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] font-black text-amber-800 block">Progress: {completedCount}/{totalCount} Goals</span>
                            <span className="text-[9px] text-slate-500">{pct}% Completed</span>
                          </div>
                          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Add Goal Input Area */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      addDailyGoal(newGoalText);
                    }}
                    className="flex gap-2 mb-4"
                  >
                    <input
                      type="text"
                      value={newGoalText}
                      onChange={(e) => setNewGoalText(e.target.value)}
                      placeholder="e.g., Read about metals, Ask AI about photosynthesis, do a quick quiz..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-slate-400 text-slate-700"
                      id="input-new-goal"
                    />
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                      id="btn-add-goal"
                    >
                      <Plus className="w-4 h-4" /> Add Goal
                    </button>
                  </form>

                  {/* Goals List */}
                  {(() => {
                    const todayStr = getLocalDateString(0);
                    const todaysGoals = dailyGoals.filter(g => g.date === todayStr);

                    return todaysGoals.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                        <ListTodo className="w-8 h-8 text-slate-300 mb-1" />
                        <span className="font-bold text-slate-600">No learning goals set for today yet.</span>
                        <span>Aap aaj kya sikhna chahte hain? Type a goal above and get started!</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {todaysGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                              goal.completed 
                                ? "bg-slate-50/50 border-slate-100 opacity-75" 
                                : "bg-white border-slate-200 hover:border-amber-200 shadow-sm"
                            }`}
                            id={`goal-item-${goal.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Custom Checkbox button */}
                              <button
                                type="button"
                                onClick={() => toggleDailyGoal(goal.id)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                                  goal.completed 
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                                    : "border-slate-300 hover:border-amber-500 hover:bg-amber-50/30 text-transparent"
                                }`}
                                title={goal.completed ? "Mark Uncompleted" : "Mark Completed"}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>

                              <span className={`text-xs select-none transition-all truncate leading-relaxed ${
                                goal.completed 
                                  ? "text-slate-400 line-through" 
                                  : "text-slate-700 font-medium"
                              }`}>
                                {goal.text}
                              </span>
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => deleteDailyGoal(goal.id)}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Archived / Past Goals indicator */}
                  {(() => {
                    const todayStr = getLocalDateString(0);
                    const pastGoals = dailyGoals.filter(g => g.date !== todayStr);
                    if (pastGoals.length === 0) return null;

                    return (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>💡 You have {pastGoals.length} past goals in archives.</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to clear all archived past goals?")) {
                              setDailyGoals(prev => prev.filter(g => g.date === todayStr));
                            }
                          }}
                          className="hover:text-red-500 font-medium cursor-pointer"
                        >
                          Clear Archives
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* MEDAL GALLERY / BADGES SHOWCASE */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                        <Award className="w-5 h-5 text-amber-600" /> Medal Gallery & Badges (मेडल गैलरी)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Achieve perfect scores or study consistently to earn all medals!</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                        Earned: {badges.filter(b => b.earned).length} / {badges.length} 🏆
                      </span>
                      <button
                        onClick={() => {
                          setShowSharePanel(!showSharePanel);
                          setShareCopied(false);
                        }}
                        className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl border border-amber-500 shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95 hover:scale-105"
                        id="btn-share-achievements"
                        title="Share your achievements with friends!"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-100 animate-pulse" />
                        <span>Share Achievements</span>
                      </button>
                    </div>
                  </div>

                  {/* Share Panel Container */}
                  <AnimatePresence>
                    {showSharePanel && (() => {
                      const earned = badges.filter(b => b.earned);
                      const earnedList = earned.map(b => `• ${profile.language === "Hindi" ? b.hindiName : b.name}`).join("\n");
                      const todayStr = getLocalDateString(0);
                      const todaysGoals = dailyGoals.filter(g => g.date === todayStr);
                      const completedGoals = todaysGoals.filter(g => g.completed).length;

                      const summaryText = `🏆 GyanSetu AI Achievement Card! 🏆
--------------------------------------------
👤 Student: ${profile.name} (Class ${profile.grade})
🔥 Learning Streak: ${metrics.streak} Day${metrics.streak !== 1 ? 's' : ''} active
🏆 Medals Earned: ${earned.length} / ${badges.length} Unlocked
${earnedList ? `\n🏅 Badges List:\n${earnedList}\n` : ""}
🎯 Today's Goals Completed: ${completedGoals} / ${todaysGoals.length}
--------------------------------------------
Join me on GyanSetu AI to learn and excel! 🚀📚`;

                      const handleCopy = () => {
                        navigator.clipboard.writeText(summaryText);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 3000);
                      };

                      const shareUrl = "https://ai.studio/build";
                      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(summaryText.substring(0, 240) + "...")}`;
                      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(summaryText)}`;
                      const emailSubject = `My Learning Progress on GyanSetu AI!`;
                      const emailBody = encodeURIComponent(summaryText);
                      const emailUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

                      return (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4 bg-amber-50/50 border border-amber-100 rounded-2xl p-4 overflow-hidden"
                          id="share-panel"
                        >
                          <div className="flex items-center justify-between border-b border-amber-100 pb-2 mb-3">
                            <h5 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                              <Share2 className="w-4 h-4 text-amber-600" /> Share Progress Card (प्रगति पत्र शेयर करें)
                            </h5>
                            <button 
                              onClick={() => setShowSharePanel(false)}
                              className="text-amber-700 hover:text-amber-950 text-[10px] font-bold cursor-pointer hover:underline"
                            >
                              Close
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Live Preview Area */}
                            <div className="bg-white border border-amber-200/60 rounded-xl p-3 shadow-sm font-mono text-[10px] text-slate-700 leading-normal whitespace-pre-wrap select-all relative group">
                              <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">Live Preview</div>
                              {summaryText}
                            </div>

                            {/* Quick Actions Area */}
                            <div className="flex flex-col justify-between gap-3">
                              <div>
                                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                                  Share your learning statistics and earned medals with parents, teachers, or friends to inspire them!
                                </p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <a 
                                    href={whatsappUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-center shadow-sm hover:scale-[1.02] active:scale-95"
                                  >
                                    WhatsApp
                                  </a>
                                  <a 
                                    href={twitterUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-center shadow-sm hover:scale-[1.02] active:scale-95"
                                  >
                                    Twitter (X)
                                  </a>
                                  <a 
                                    href={telegramUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-center shadow-sm hover:scale-[1.02] active:scale-95"
                                  >
                                    Telegram
                                  </a>
                                  <a 
                                    href={emailUrl}
                                    className="bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition text-center shadow-sm hover:scale-[1.02] active:scale-95"
                                  >
                                    Email
                                  </a>
                                </div>
                              </div>

                              <button
                                onClick={handleCopy}
                                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                                  shareCopied 
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                                    : "bg-amber-600 hover:bg-amber-700 text-white border-amber-500 hover:shadow-md hover:scale-[1.01] active:scale-95"
                                }`}
                                id="btn-copy-share-summary"
                              >
                                {shareCopied ? (
                                  <>
                                    <Check className="w-4 h-4" /> Copied Successfully!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" /> Copy Progress Card Text
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`border rounded-2xl p-4 flex gap-3 items-center relative overflow-hidden transition-all duration-300 ${
                          badge.earned
                            ? `${badge.bgLight} border-slate-200 shadow-sm hover:shadow-md scale-[1.01]`
                            : "bg-slate-50/50 border-slate-100 opacity-65"
                        }`}
                        id={`badge-${badge.id}`}
                      >
                        {/* Subtle glow for earned badges */}
                        {badge.earned && (
                          <div className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-gradient-to-br ${badge.color} opacity-10 blur-xl`}></div>
                        )}

                        {/* Medal Circle Container */}
                        <div
                          className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                            badge.earned
                              ? `bg-gradient-to-br ${badge.color} text-white shadow-md shadow-amber-200/50`
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {renderBadgeIcon(badge.icon, "w-6 h-6")}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className={`text-xs font-black truncate ${badge.earned ? "text-slate-800" : "text-slate-400"}`}>
                              {profile.language === "Hindi" ? badge.hindiName : badge.name}
                            </h5>
                            {badge.earned ? (
                              <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold">Unlocked</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">Locked</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                            {profile.language === "Hindi" ? badge.hindiDescription : badge.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Quiz Logs Listing */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 overflow-y-auto max-h-[250px]">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" /> Complete Activity & History Logs
                  </h4>

                  {quizHistory.length === 0 ? (
                    <p className="text-slate-400 text-xs italic">Koi previous quiz activity nahi mili.</p>
                  ) : (
                    <div className="space-y-2">
                      {quizHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-sm hover:bg-slate-100/50 transition"
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{item.topic} Practice Test</span>
                            <span className="text-[10px] text-slate-400">{item.date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
                              Score: {item.score} / {item.total}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              item.score === item.total
                                ? "bg-emerald-100 text-emerald-800"
                                : item.score > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}>
                              {item.score === item.total ? "Mastered 👑" : "Reviewed 👍"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Daily Study Nudge Banner Reset Option (if dismissed) */}
                {dismissedReminder && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => {
                        setDismissedReminder(false);
                        localStorage.setItem("gyansetu_dismiss_reminder", "false");
                      }}
                      className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-sm"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Show Daily Study Reminder Banner again
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </main>

      </div>

      {/* MODAL / PROFILE SETUP POPUP OVERLAY */}
      <AnimatePresence>
        {(showProfileSetup || !profile.name) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-5 h-5 text-amber-600" /> Student Profile settings
                </h3>
                {profile.name && (
                  <button
                    onClick={() => setShowProfileSetup(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                
                {/* Student Name */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Aapka Naam (Student Name):</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>

                {/* Class / Grade Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Class / Grade Select Karein:</label>
                  <select
                    value={profile.grade}
                    onChange={(e) => setProfile(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 outline-none transition"
                  >
                    <option value="Class 5">Class 5 (Grade 5)</option>
                    <option value="Class 6">Class 6 (Grade 6)</option>
                    <option value="Class 7">Class 7 (Grade 7)</option>
                    <option value="Class 8">Class 8 (Grade 8)</option>
                    <option value="Class 9">Class 9 (Grade 9)</option>
                  </select>
                </div>

                {/* Primary Language Preference */}
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Bhasha ki Preference (Language):</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Hindi", "Hinglish", "English"] as const).map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setProfile(prev => ({ ...prev, language: lang }))}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all duration-200 ${
                          profile.language === lang
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save action */}
                <button
                  type="button"
                  onClick={() => setShowProfileSetup(false)}
                  disabled={!profile.name.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition p-3 rounded-xl text-white font-bold text-sm shadow mt-2"
                >
                  Save Profile 🎯
                </button>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
