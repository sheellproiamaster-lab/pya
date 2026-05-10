"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

const TERMOS = `TERMOS DE USO — PYA

1. A Pya é uma plataforma de inteligência artificial destinada a auxiliar pessoas e empresas na resolução de problemas, execução de tarefas e orientação estratégica.

2. O acesso é realizado mediante autenticação via conta Google. Você é responsável pela segurança e uso da sua conta.

3. O conteúdo gerado tem caráter informativo e orientativo. Decisões de natureza médica, jurídica ou financeira devem ser validadas por profissionais habilitados.

4. É vedado utilizar a Pya para fins ilícitos, discriminatórios ou que violem direitos de terceiros.

5. PLANOS E REEMBOLSO: Planos pagos podem ser cancelados a qualquer momento. Ao cancelar, o acesso permanece ativo até o fim do período contratado. Reembolsos são analisados em até 7 dias corridos mediante solicitação pelo suporte. Contato: (61) 99309-6532 ou sheellproiamaster@gmail.com.

6. A Pya reserva-se o direito de encerrar o acesso de usuários que violem estes termos.

7. Estes termos podem ser atualizados. O uso continuado implica aceitação das versões vigentes.`;

const PRIVACIDADE = `POLÍTICA DE PRIVACIDADE — PYA

Conforme a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018):

1. Coletamos apenas os dados necessários: nome e e-mail fornecidos via autenticação Google.

2. Suas conversas podem ser armazenadas para fins de melhoria do serviço e personalização da experiência.

3. Seus dados não são vendidos, compartilhados ou cedidos a terceiros sem seu consentimento, exceto quando exigido por lei.

4. Você tem direito de acessar, corrigir ou solicitar a exclusão dos seus dados a qualquer momento.

5. Utilizamos medidas técnicas de segurança para proteger suas informações contra acesso não autorizado.

6. Dúvidas ou solicitações: (61) 99309-6532 ou sheellproiamaster@gmail.com.`;

function Modal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 520, width: "100%", maxHeight: "80vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
        >
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#f1f1f1", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#555" }}>
            ×
          </button>
          <h2 style={{ color: "#F97316", fontFamily: "'Courier New', monospace", fontSize: 15, fontWeight: 900, marginBottom: 16 }}>{title}</h2>
          <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, whiteSpace: "pre-line", fontFamily: "'Georgia', serif" }}>{content}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NeuralBg() {
  const waves = [
    { d: "M0,200 Q360,100 720,250 T1440,200", color: "#F97316", width: 1.5, dur: 4, delay: 0 },
    { d: "M0,400 Q400,250 800,400 T1440,350", color: "#6366f1", width: 1, dur: 5, delay: 0.5 },
    { d: "M0,600 Q300,450 700,580 T1440,520", color: "#06b6d4", width: 1, dur: 6, delay: 1 },
    { d: "M0,150 Q500,50 900,180 T1440,120", color: "#ec4899", width: 0.8, dur: 7, delay: 1.5 },
    { d: "M0,750 Q350,620 750,700 T1440,680", color: "#8b5cf6", width: 1, dur: 5.5, delay: 2 },
  ];
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.2 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {waves.map((w, i) => (
        <motion.path key={i} d={w.d} stroke={w.color} strokeWidth={w.width} fill="none"
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: w.dur, repeat: Infinity, delay: w.delay, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

export default function Login() {
  const [modal, setModal] = useState<null | "termos" | "privacidade">(null);

  return (
    <main style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
      background: "#FAF0E6",
      backgroundImage: `linear-gradient(rgba(249,115,22,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.06) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
    }}>
      <NeuralBg />

      {modal === "termos" && <Modal title="Termos de Uso" content={TERMOS} onClose={() => setModal(null)} />}
      {modal === "privacidade" && <Modal title="Política de Privacidade" content={PRIVACIDADE} onClose={() => setModal(null)} />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          borderRadius: 24, padding: "40px 48px",
          border: "1.5px solid #F9731630",
          boxShadow: "0 8px 40px #F9731420",
          maxWidth: 420, width: "100%",
        }}
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
          <Image src="/pya002.png" alt="Pya" width={100} height={100} style={{ borderRadius: "50%", boxShadow: "0 4px 24px #F9731440" }} />
        </motion.div>

        <div style={{ display: "flex", gap: 10 }}>
          {["P", "Y", "A"].map((letter, i) => (
            <motion.div key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              style={{ width: 48, height: 48, background: "#fff", border: "2px solid #F9731660", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px #F9731420" }}
            >
              <span style={{ fontSize: 22, fontWeight: 900, color: "#F97316", fontFamily: "'Courier New', monospace" }}>{letter}</span>
            </motion.div>
          ))}
        </div>

        <p style={{ fontSize: 13, fontStyle: "italic", color: "#666", fontFamily: "'Georgia', serif", textAlign: "center", margin: 0 }}>
          uma agente de execução criada para sempre ajudar
        </p>

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 28px #F9731660" }}
          whileTap={{ scale: 0.97 }}
          style={{ background: "linear-gradient(135deg, #F97316, #ea580c)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 36px", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px #F9731650", display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Entrar com Google
        </motion.button>

        <div style={{ background: "#F97316", borderRadius: 12, padding: "12px 20px", textAlign: "center", width: "100%" }}>
          <p style={{ color: "#fff", fontSize: 11, margin: 0, lineHeight: 1.7, fontFamily: "'Georgia', serif" }}>
            Ao acessar e usar a Pya você concorda com os{" "}
            <button onClick={() => setModal("termos")} style={{ color: "#fff", fontWeight: 800, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>
              Termos de Uso
            </button>
            {" "}e a{" "}
            <button onClick={() => setModal("privacidade")} style={{ color: "#fff", fontWeight: 800, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 11 }}>
              Política de Privacidade
            </button>
          </p>
        </div>

        <p style={{ color: "#aaa", fontSize: 10, fontFamily: "'Georgia', serif", margin: 0 }}>Pya © 2026</p>
      </motion.div>
    </main>
  );
}