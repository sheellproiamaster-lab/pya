"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const terminalLines = [
  { type: "cmd", text: "npm run dev" },
  { type: "word", text: "Inteligência" },
  { type: "cmd", text: "git push origin main" },
  { type: "word", text: "Precisão" },
  { type: "cmd", text: "npx create-next-app@latest" },
  { type: "word", text: "Execução" },
  { type: "cmd", text: "supabase db push" },
  { type: "word", text: "Inovação" },
  { type: "cmd", text: "stripe listen --forward-to localhost" },
  { type: "word", text: "Excelência" },
];

const actionCards = ["Crie um projeto", "Aprenda com a Pya", "Execute tarefas", "Muito mais"];

function NeuralWaves() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.15 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {[...Array(6)].map((_, i) => (
        <motion.path key={i} d={`M${-100 + i * 120},${200 + i * 80} Q${400 + i * 60},${100 + i * 40} ${800 + i * 50},${300 + i * 60} T${1600 + i * 30},${200 + i * 50}`} stroke={i % 2 === 0 ? "#F97316" : "#6366f1"} strokeWidth="1.5" fill="none"
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 5 + i * 1.2, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

function TerminalSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % terminalLines.length);
        setVisible(true);
      }, 600);
    }, 2500);
    return () => clearInterval(cycle);
  }, []);

  const line = terminalLines[currentIndex];

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1.5px solid #F9731640",
      padding: "14px 28px",
      width: "100%",
      maxWidth: 520,
      boxShadow: "0 4px 24px #F9731615",
      display: "flex",
      alignItems: "center",
      gap: 20,
      justifyContent: "center",
    }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
        <Image src="/pya002.png" alt="Pya" width={40} height={40} style={{ borderRadius: "50%" }} />
      </motion.div>

      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: "'Courier New', monospace",
              fontWeight: 800,
              fontSize: line.type === "word" ? 16 : 14,
              color: "#F97316",
              letterSpacing: line.type === "word" ? 3 : 0.5,
              textTransform: line.type === "word" ? "uppercase" : "none",
            }}
          >
            {line.type === "cmd" ? `> ${line.text}` : `// ${line.text}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");

  return (
    <main style={{
      height: "100vh",
      background: "#FAF0E6",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <NeuralWaves />

      {/* HEADER */}
      <header style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "14px 28px",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 28px #F9731680" }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: "linear-gradient(135deg, #F97316, #ea580c)",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 26px",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 20px #F9731650",
            letterSpacing: 0.5,
          }}
        >
          Acessar
        </motion.button>
      </header>

      {/* CONTEÚDO CENTRAL */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "0 24px",
        position: "relative",
        zIndex: 10,
      }}>
        {/* LOGO FLUTUANDO */}
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
          <Image src="/pya001.png" alt="Pya" width={180} height={180} priority style={{ borderRadius: 20 }} />
        </motion.div>

        {/* SLOGAN */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 15, fontStyle: "italic", color: "#555", fontFamily: "'Georgia', serif", textAlign: "center", margin: 0 }}
        >
          uma agente de execução criada para sempre ajudar
        </motion.p>

        {/* CAIXA DE TEXTO */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            borderRadius: 999,
            border: "1.5px solid #F9731660",
            padding: "10px 16px",
            width: "100%",
            maxWidth: 460,
            boxShadow: "0 4px 20px #F9731615",
            gap: 10,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Crie sua conta e conheça a Pya"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#333", fontFamily: "'Georgia', serif" }}
          />
          <motion.button
            whileHover={{ scale: 1.08, boxShadow: "0 0 16px #F9731670" }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: "linear-gradient(135deg, #F97316, #ea580c)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "8px 20px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 2px 10px #F9731640",
            }}
          >
            Enviar
          </motion.button>
        </motion.div>

        {/* CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}
        >
          {actionCards.map((card, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, borderColor: "#F97316", color: "#F97316" }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "#fff",
                border: "1.5px solid #e5d5c5",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#555",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'Georgia', serif",
              }}
            >
              {card}
            </motion.button>
          ))}
        </motion.div>

        {/* TERMINAL HORIZONTAL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ width: "100%", maxWidth: 460, display: "flex", justifyContent: "center" }}
        >
          <TerminalSection />
        </motion.div>
      </div>

      {/* RODAPÉ */}
      <footer style={{
        textAlign: "center",
        padding: "10px",
        fontSize: 11,
        color: "#aaa",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
        fontFamily: "'Georgia', serif",
      }}>
        Desenvolvida por Michel Macedo Holding · Pya 2026
      </footer>
    </main>
  );
}