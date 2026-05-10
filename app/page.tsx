"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const terminalLines = [
  { cmd: "npm run dev", word: "INTELIGÊNCIA" },
  { cmd: "git commit -m \"feat: pya v1.0\"", word: "PRECISÃO" },
  { cmd: "npx create-next-app@latest", word: "EXECUÇÃO" },
  { cmd: "add db push --linked", word: "INOVAÇÃO" },
  { cmd: "host xd --forward-to desk", word: "EXCELÊNCIA" },
  { cmd: "pya api run --model master", word: "AUTONOMIA" },
  { cmd: "git push origin main", word: "EVOLUÇÃO" },
];

const actionCards = ["Crie um projeto", "Aprenda com a Pya", "Execute tarefas", "Muito mais"];

function NeuralWaves() {
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.15 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {[...Array(6)].map((_, i) => (
        <motion.path key={i}
          d={`M${-100 + i * 120},${200 + i * 80} Q${400 + i * 60},${100 + i * 40} ${800 + i * 50},${300 + i * 60} T${1600 + i * 30},${200 + i * 50}`}
          stroke={i % 2 === 0 ? "#F97316" : "#6366f1"} strokeWidth="1.5" fill="none"
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.5, 0] }}
          transition={{ duration: 5 + i * 1.2, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

function TypewriterText({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const t = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 45);
      return () => clearTimeout(t);
    } else if (index === text.length && text.length > 0) {
      const t = setTimeout(onDone, 1800);
      return () => clearTimeout(t);
    }
  }, [index, text, onDone]);

  return <span>{displayed}<span style={{ opacity: index < text.length ? 1 : 0 }}>▌</span></span>;
}

function TerminalSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typing, setTyping] = useState(true);

  const handleDone = () => {
    setTyping(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % terminalLines.length);
      setTyping(true);
    }, 400);
  };

  const line = terminalLines[currentIndex];

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      border: "1.5px solid #F9731640",
      padding: "14px 20px",
      width: "100%",
      maxWidth: 520,
      boxShadow: "0 4px 24px #F9731615",
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}>
      {/* LOGO ANIMADA */}
      <motion.div
        animate={{
          rotate: 360,
          x: [0, 6, -6, 4, -4, 0],
          y: [0, -6, 4, -4, 6, 0],
        }}
        transition={{
          rotate: { duration: 5, repeat: Infinity, ease: "linear" },
          x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ flexShrink: 0 }}
      >
        <Image src="/pya002.png" alt="Pya" width={52} height={52} style={{ borderRadius: "50%" }} />
      </motion.div>

      {/* DIVISOR */}
      <div style={{ width: 1, height: 36, background: "#F9731640", flexShrink: 0 }} />

      {/* TEXTO TYPEWRITER */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        fontWeight: 700,
        color: "#F97316",
        flex: 1,
        minHeight: 20,
      }}>
        {typing && (
          <TypewriterText
            key={currentIndex}
            text={`> ${line.cmd}  //  ${line.word}`}
            onDone={handleDone}
          />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleAcesso = () => router.push("/login");
  const handleEnviar = () => router.push("/login");

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
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 28px",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}>
        {/* LOGO ESQUERDA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image src="/pya002.png" alt="Pya" width={38} height={38} style={{ borderRadius: "50%" }} />
          </motion.div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {["P", "Y", "A"].map((letter, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#F97316",
                  letterSpacing: 1,
                  lineHeight: 1,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </div>

        {/* BOTÃO DIREITA */}
        <motion.button
          onClick={handleAcesso}
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

      {/* CONTEÚDO */}
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
        {/* LOGO */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src="/pya001.png" alt="Pya" width={220} height={220} priority style={{ borderRadius: 20 }} />
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

        {/* INPUT */}
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
            onClick={handleEnviar}
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
              onClick={handleAcesso}
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

        {/* TERMINAL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ width: "100%", maxWidth: 520, display: "flex", justifyContent: "center" }}
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