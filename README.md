# 🎓 GyanSetu AI — Multilingual Adaptive Educational Tutor

<div align="center">

![GyanSetu AI](https://img.shields.io/badge/GyanSetu-AI%20Tutor-6C63FF?style=for-the-badge&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?style=for-the-badge&logo=google&logoColor=white)

**An adaptive multilingual educational tutor for students from diverse linguistic and educational backgrounds.**

</div>

## ✨ Features

- 🌐 **Multilingual Support** — Teaches in multiple Indian languages for inclusive learning
- 🤖 **AI-Powered Tutoring** — Uses Google Gemini for deep, personalized explanations
- 🎤 **Voice Input** — Microphone support for hands-free interaction
- 📊 **Adaptive Learning** — Adjusts to student level and understanding
- ⚡ **Real-time Responses** — Streaming answers with instant feedback
- 🎨 **Modern UI** — Built with React 19, Tailwind CSS, and smooth animations

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd gyansetu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```
   Then add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Backend | Express.js, Node.js |
| AI | Google Gemini API (`@google/genai`) |
| Build | Vite 6, esbuild |
| Animations | Motion (Framer Motion) |
| Charts | D3.js |

## 📁 Project Structure

```
gyansetu/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles
│   ├── types.ts         # TypeScript type definitions
│   └── components/      # Reusable UI components
├── server.ts            # Express backend server
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variable template
└── package.json         # Project dependencies
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run lint` | Type-check with TypeScript |
| `npm run preview` | Preview production build |

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | ✅ Yes |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<div align="center">
Made with ❤️ for students across India 🇮🇳
</div>
