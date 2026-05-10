"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Plus, Star, Edit3, Trash2, Download, FileText,
  LogOut, ChevronDown, Paperclip, Send, Copy, Volume2,
  Check, Crown, Mic
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image";
  imageUrl?: string;
  files?: FilePreview[];
}

interface Conversation {
  id: string;
  title: string;
  favorited: boolean;
  updated_at: string;
}

interface FilePreview {
  name: string;
  type: "image" | "document";
  preview?: string;
  data: string;
  mediaType: string;
}

const PROMPTS = [
  "Me ajuda a organizar minha semana",
  "Preciso criar um documento profissional",
  "Analisa esse arquivo pra mim",
  "Me orienta sobre minha carreira",
  "Cria uma imagem pra mim",
  "Preciso de ajuda com um problema",
];

const FONT = "'Courier New', 'JetBrains Mono', monospace";

const S = {
  fundo:         "#FAF0E6",
  fundo2:        "#F5EAE0",
  fundo3:        "#EDE0D0",
  laranja:       "#F97316",
  laranjaEscuro: "#ea580c",
  laranjaFraco:  "rgba(249,115,22,0.10)",
  borda:         "rgba(249,115,22,0.18)",
  texto:         "#2d1a0a",
  texto2:        "#8B6240",
  texto3:        "#C4965A",
  branco:        "#ffffff",
  vermelho:      "#dc2626",
  verde:         "#16a34a",
};

export default function ChatPage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string; avatar: string; plan: string } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [convMenu, setConvMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteAccountInput, setDeleteAccountInput] = useState("");
  const [showPlans, setShowPlans] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      const u = data.session.user;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Usuário";
      setUser({ id: u.id, email: u.email || "", name, avatar: u.user_metadata?.avatar_url || "", plan: "free" });
      loadConversations(u.id);
    });
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadConversations = async (userId: string) => {
    const res = await fetch(`/api/conversations?userId=${userId}`);
    const data = await res.json();
    if (data.conversations) setConversations(data.conversations);
  };

  const loadMessages = async (convId: string) => {
    const res = await fetch(`/api/messages?conversationId=${convId}`);
    const data = await res.json();
    if (data.messages) {
      setMessages(data.messages.map((m: { id: string; role: "user" | "assistant"; content: string }) => ({
        id: m.id,
        role: m.role,
        content: m.content.startsWith("__IMAGE__") ? m.content.replace("__IMAGE__", "") : m.content,
        type: m.content.startsWith("__IMAGE__") ? "image" : "text",
        imageUrl: m.content.startsWith("__IMAGE__") ? m.content.replace("__IMAGE__", "") : undefined,
      })));
    }
  };

  const selectConversation = (id: string) => {
    setActiveConv(id); loadMessages(id); setSidebarOpen(false); setConvMenu(null);
  };

  const newConversation = async () => {
    if (!user) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, title: "Nova conversa" }),
    });
    const data = await res.json();
    if (data.conversation) {
      setConversations((p) => [data.conversation, ...p]);
      setActiveConv(data.conversation.id);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  const handleFiles = async (selected: FileList) => {
    if (files.length + selected.length > 7) { alert("Máximo 7 arquivos"); return; }
    const newFiles: FilePreview[] = [];
    for (const file of Array.from(selected)) {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newFiles.push({
            name: file.name,
            type: isImage ? "image" : "document",
            preview: isImage ? result : undefined,
            data: result.split(",")[1],
            mediaType: file.type,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setFiles((p) => [...p, ...newFiles]);
  };

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content && files.length === 0) return;
    if (!user) return;

    let convId = activeConv;
    if (!convId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, title: content.slice(0, 50) || "Nova conversa" }),
      });
      const data = await res.json();
      if (!data.conversation) return;
      convId = data.conversation.id;
      setConversations((p) => [data.conversation, ...p]);
      setActiveConv(convId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, files: [...files] };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setFiles([]);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, userId: user.id, role: "user", content }),
    });

    if (conversations.find((c) => c.id === convId)?.title === "Nova conversa") {
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: convId, title: content.slice(0, 50) }),
      });
      setConversations((p) => p.map((c) => c.id === convId ? { ...c, title: content.slice(0, 50) } : c));
    }

    const isImageRequest = /gera|cria|faz|desenha|ilustra/i.test(content) && /imagem|foto|figura|arte|desenho|ilustração/i.test(content);

    if (isImageRequest) {
      try {
        const imgRes = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: content }),
        });
        const imgData = await imgRes.json();
        if (imgData.url) {
          const assistantMsg: Message = { id: Date.now().toString(), role: "assistant", content: imgData.url, type: "image", imageUrl: imgData.url };
          setMessages((p) => [...p, assistantMsg]);
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: convId, userId: user.id, role: "assistant", content: `__IMAGE__${imgData.url}` }),
          });
        }
      } catch {}
      setLoading(false);
      return;
    }

    try {
      const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          files: userMsg.files?.map((f) => ({ type: f.type, data: f.data, mediaType: f.mediaType, name: f.name })),
        }),
      });
      const chatData = await chatRes.json();
      const reply = chatData.response?.content?.[0]?.text || "Não consegui processar sua mensagem.";
      const assistantMsg: Message = { id: Date.now().toString(), role: "assistant", content: reply };
      setMessages((p) => [...p, assistantMsg]);
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, userId: user.id, role: "assistant", content: reply }),
      });
    } catch {}
    setLoading(false);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const speakMessage = async (id: string, text: string) => {
    setSpeaking(id);
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setSpeaking(null);
      audio.play();
    } catch { setSpeaking(null); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string).split(",")[1];
          const res = await fetch("/api/stt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio: base64 }) });
          const data = await res.json();
          if (data.text) setInput(data.text);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
    } catch {}
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const exportPDF = async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    const res = await fetch(`/api/messages?conversationId=${convId}`);
    const data = await res.json();
    const content = data.messages?.map((m: { role: string; content: string }) =>
      `${m.role === "user" ? user?.name || "Você" : "Pya"}: ${m.content}`
    ).join("\n\n") || "";
    const pdfRes = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: conv?.title || "Conversa", content }),
    });
    const blob = await pdfRes.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pya-${Date.now()}.pdf`; a.click();
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, favorited: !current }),
    });
    setConversations((p) => p.map((c) => c.id === id ? { ...c, favorited: !current } : c));
  };

  const renameConv = async (id: string) => {
    await fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: renameVal }),
    });
    setConversations((p) => p.map((c) => c.id === id ? { ...c, title: renameVal } : c));
    setRenaming(null);
  };

  const deleteConv = async (id: string) => {
    await fetch("/api/conversations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConversations((p) => p.filter((c) => c.id !== id));
    if (activeConv === id) { setActiveConv(null); setMessages([]); }
    setDeleteConfirm(null); setDeleteInput("");
  };

  const deleteAccount = async () => {
    if (!user) return;
    await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const favorites = conversations.filter((c) => c.favorited);
  const regular = conversations.filter((c) => !c.favorited);

  return (
    <div style={{ display: "flex", height: "100vh", background: S.fundo, overflow: "hidden", fontFamily: FONT }}>

      {/* OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(45,26,10,0.35)", zIndex: 40, backdropFilter: "blur(3px)" }}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{
              position: "fixed", left: 0, top: 0, bottom: 0, width: 280,
              background: S.fundo2,
              borderRight: `1px solid ${S.borda}`,
              display: "flex", flexDirection: "column", zIndex: 50,
              boxShadow: "4px 0 24px rgba(45,26,10,0.12)",
            }}
          >
            {/* Logo */}
            <div style={{ padding: "16px 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${S.borda}` }}>
              <img src="/pya001.png" alt="Pya" style={{ height: 28, objectFit: "contain" }} />
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: S.texto3, cursor: "pointer", display: "flex" }}>
                <X size={17} />
              </button>
            </div>

            {/* Nova conversa */}
            <div style={{ padding: "10px 10px 6px" }}>
              <button
                onClick={newConversation}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 14px", background: S.laranja, border: "none",
                  borderRadius: 10, color: "#fff", cursor: "pointer",
                  fontSize: 12, fontFamily: FONT, fontWeight: 700,
                  boxShadow: "0 2px 10px rgba(249,115,22,0.3)",
                }}
              >
                <Plus size={14} /> Nova conversa
              </button>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
              {favorites.length > 0 && (
                <>
                  <div style={{
                    padding: "10px 10px 5px",
                    fontSize: 9, color: S.texto3,
                    fontFamily: FONT, letterSpacing: 2,
                    textTransform: "uppercase", fontWeight: 700,
                  }}>
                    Favoritos
                  </div>
                  {favorites.map((c) => (
                    <ConvItem key={c.id} c={c} active={activeConv === c.id}
                      onSelect={selectConversation} onMenu={setConvMenu} menuOpen={convMenu === c.id}
                      onFavorite={toggleFavorite}
                      onRename={(id, t) => { setRenaming(id); setRenameVal(t); setConvMenu(null); }}
                      onDelete={(id) => { setDeleteConfirm(id); setConvMenu(null); }}
                      onExport={exportPDF}
                      renaming={renaming === c.id} renameVal={renameVal}
                      setRenameVal={setRenameVal} doRename={renameConv}
                    />
                  ))}
                  <div style={{ height: 1, background: S.borda, margin: "6px 4px" }} />
                </>
              )}

              {regular.length > 0 && (
                <div style={{
                  padding: "10px 10px 5px",
                  fontSize: 9, color: S.texto3,
                  fontFamily: FONT, letterSpacing: 2,
                  textTransform: "uppercase", fontWeight: 700,
                }}>
                  Conversas
                </div>
              )}

              {regular.map((c) => (
                <ConvItem key={c.id} c={c} active={activeConv === c.id}
                  onSelect={selectConversation} onMenu={setConvMenu} menuOpen={convMenu === c.id}
                  onFavorite={toggleFavorite}
                  onRename={(id, t) => { setRenaming(id); setRenameVal(t); setConvMenu(null); }}
                  onDelete={(id) => { setDeleteConfirm(id); setConvMenu(null); }}
                  onExport={exportPDF}
                  renaming={renaming === c.id} renameVal={renameVal}
                  setRenameVal={setRenameVal} doRename={renameConv}
                />
              ))}

              {conversations.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: S.texto3, fontSize: 12, fontFamily: FONT }}>
                  Nenhuma conversa ainda
                </div>
              )}
            </div>

            <div style={{ height: 1, background: S.borda, margin: "0 10px" }} />

            {/* Assinatura */}
            <div style={{ padding: "10px 10px 0" }}>
              <button
                onClick={() => setShowPlans(true)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: "10px 14px",
                  background: S.fundo3, border: `1px solid ${S.borda}`,
                  borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Crown size={13} color={S.laranja} />
                  <span style={{ fontSize: 12, color: S.texto, fontWeight: 600 }}>Assinatura</span>
                </div>
                <span style={{
                  fontSize: 10, color: S.texto2, background: S.fundo2,
                  padding: "2px 8px", borderRadius: 20, border: `1px solid ${S.borda}`,
                }}>
                  {user?.plan === "premium" ? "Pya Plus" : "Gratuito"}
                </span>
              </button>
            </div>

            {/* Usuário */}
            <div style={{ padding: "8px 10px 16px" }}>
              <div style={{ padding: "12px 14px", background: S.fundo3, borderRadius: 10, border: `1px solid ${S.borda}` }}>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: S.vermelho, fontSize: 11, cursor: "pointer", padding: "0 0 6px", fontFamily: FONT }}
                >
                  Excluir conta
                </button>
                <div style={{ fontSize: 11, color: S.texto2, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: S.texto3 }}>{user?.name}</span>
                  <button
                    onClick={signOut}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: S.texto2, cursor: "pointer", fontSize: 11, fontFamily: FONT }}
                  >
                    <LogOut size={11} /> Sair
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>

        {/* HEADER */}
        <header style={{
          height: 52, display: "flex", alignItems: "center",
          padding: "0 16px", borderBottom: `1px solid ${S.borda}`,
          background: S.fundo2, flexShrink: 0, gap: 10,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: S.texto2, cursor: "pointer", display: "flex" }}>
            <Menu size={19} />
          </button>
          <img src="/pya001.png" alt="Pya" style={{ height: 26, objectFit: "contain" }} />
          {user && (
            <span style={{ fontSize: 11, color: S.texto3, marginLeft: "auto", fontFamily: FONT }}>
              {user.name}
            </span>
          )}
        </header>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 12px" }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth: 660, margin: "0 auto", paddingTop: 40 }}>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <img src="/pya001.png" alt="Pya" style={{ height: 100, objectFit: "contain", marginBottom: 18 }} />
                <p style={{ color: S.laranja, fontSize: 15, fontFamily: FONT, fontWeight: 700, letterSpacing: 0.5 }}>
                  &gt;_ Como posso te ajudar hoje?
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    style={{
                      padding: "13px 15px", background: S.fundo2,
                      border: `1px solid ${S.borda}`, borderRadius: 12,
                      color: S.texto2, cursor: "pointer", fontSize: 12,
                      textAlign: "left", fontFamily: FONT, lineHeight: 1.5,
                      transition: "all 0.18s", fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = S.laranja;
                      e.currentTarget.style.color = S.laranja;
                      e.currentTarget.style.background = S.fundo3;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = S.borda;
                      e.currentTarget.style.color = S.texto2;
                      e.currentTarget.style.background = S.fundo2;
                    }}
                  >
                    {"// "}{p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.files && msg.files.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.files.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 6, fontSize: 10, color: S.texto2, fontFamily: FONT }}>
                          {f.type === "image" && f.preview
                            ? <img src={f.preview} style={{ width: 18, height: 18, borderRadius: 3, objectFit: "cover" }} />
                            : <FileText size={11} />}
                          {f.name.length > 14 ? f.name.slice(0, 12) + "…" : f.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === "image" && msg.imageUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <img src="/pya002.png" style={{ width: 20, height: 20, objectFit: "contain" }} />
                        <span style={{ fontSize: 11, color: S.texto3, fontFamily: FONT, fontWeight: 600 }}>Pya Imagem</span>
                      </div>
                      <img
                        src={msg.imageUrl} alt="Imagem gerada"
                        onClick={() => setImageModal(msg.imageUrl!)}
                        style={{ maxWidth: 540, borderRadius: 12, cursor: "pointer", border: `1px solid ${S.borda}`, boxShadow: "0 4px 20px rgba(45,26,10,0.1)" }}
                      />
                      <button
                        onClick={() => { const a = document.createElement("a"); a.href = msg.imageUrl!; a.download = `pya-${Date.now()}.png`; a.target = "_blank"; a.click(); }}
                        style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${S.borda}`, borderRadius: 7, padding: "5px 10px", color: S.texto2, cursor: "pointer", fontSize: 11, fontFamily: FONT }}
                      >
                        <Download size={11} /> Baixar imagem
                      </button>
                    </div>
                  ) : (
                    <div style={{ maxWidth: "85%" }}>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <img src="/pya002.png" style={{ width: 18, height: 18, objectFit: "contain" }} />
                          <span style={{ fontSize: 11, color: S.texto3, fontFamily: FONT, fontWeight: 600 }}>Pya</span>
                        </div>
                      )}
                      <div style={{
                        padding: "12px 16px",
                        background: msg.role === "user" ? S.laranja : S.fundo2,
                        border: msg.role === "user" ? "none" : `1px solid ${S.borda}`,
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        color: msg.role === "user" ? "#fff" : S.texto,
                        fontSize: 13, lineHeight: 1.75,
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                        fontFamily: FONT,
                        fontWeight: msg.role === "user" ? 600 : 400,
                        boxShadow: msg.role === "user" ? "0 2px 12px rgba(249,115,22,0.25)" : "none",
                      }}>
                        {msg.content}
                      </div>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          <Btn
                            onClick={() => copyMessage(msg.id, msg.content)}
                            icon={copied === msg.id ? <Check size={11} /> : <Copy size={11} />}
                            label={copied === msg.id ? "Copiado" : "Copiar"}
                          />
                          <Btn
                            onClick={() => speakMessage(msg.id, msg.content)}
                            icon={<Volume2 size={11} />}
                            label={speaking === msg.id ? "Falando..." : "Ouvir"}
                            active={speaking === msg.id}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, background: S.fundo2,
                    border: `1px solid ${S.borda}`, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <motion.img
                      src="/pya002.png"
                      style={{ width: 24, height: 24, objectFit: "contain" }}
                      animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: S.texto3, fontFamily: FONT }}>Processando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{ padding: "10px 16px 18px", background: S.fundo, borderTop: `1px solid ${S.borda}`, flexShrink: 0 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ background: S.fundo2, border: `1px solid ${S.borda}`, borderRadius: 16, boxShadow: "0 2px 12px rgba(45,26,10,0.06)" }}>
              {files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 10px 0" }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 5, padding: "3px 7px 3px 5px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 7, fontSize: 10, color: S.texto2, fontFamily: FONT }}>
                      {f.type === "image" && f.preview
                        ? <img src={f.preview} style={{ width: 18, height: 18, borderRadius: 3, objectFit: "cover" }} />
                        : <FileText size={11} />}
                      <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                      <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: S.texto3, cursor: "pointer", padding: 0, display: "flex" }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", padding: "8px 8px 8px 14px", gap: 6 }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    resize: "none", color: S.texto, fontSize: 13,
                    fontFamily: FONT, lineHeight: 1.65, padding: "3px 0",
                    minHeight: 26, maxHeight: 150, overflowY: "auto",
                    caretColor: S.laranja,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <input
                    ref={fileInputRef} type="file" multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: S.texto3, cursor: "pointer" }}
                  >
                    <Paperclip size={15} />
                  </button>
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    style={{
                      width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                      background: recording ? S.laranja : "none", border: "none",
                      color: recording ? "#fff" : S.texto3, cursor: "pointer", borderRadius: 7,
                    }}
                  >
                    <Mic size={15} />
                  </button>
                  <AnimatePresence>
                    {(input.trim() || files.length > 0) && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        onClick={() => sendMessage()}
                        disabled={loading}
                        style={{
                          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                          background: loading ? S.fundo3 : S.laranja, border: "none",
                          borderRadius: 8, color: "#fff",
                          cursor: loading ? "not-allowed" : "pointer",
                          boxShadow: loading ? "none" : "0 2px 8px rgba(249,115,22,0.35)",
                        }}
                      >
                        <Send size={13} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL IMAGEM */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setImageModal(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(45,26,10,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          >
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()}>
              <img src={imageModal} alt="" style={{ maxWidth: "90vw", maxHeight: "78vh", borderRadius: 12, display: "block", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }} />
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => { const a = document.createElement("a"); a.href = imageModal; a.download = `pya-${Date.now()}.png`; a.target = "_blank"; a.click(); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 18px", background: S.laranja, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}
                >
                  <Download size={13} /> Baixar
                </button>
                <button
                  onClick={() => setImageModal(null)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 18px", background: S.fundo2, border: `1px solid ${S.borda}`, borderRadius: 8, color: S.texto2, cursor: "pointer", fontSize: 12, fontFamily: FONT }}
                >
                  <X size={13} /> Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DELETE CONVERSA */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(45,26,10,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }}
              style={{ background: S.fundo2, border: `1px solid ${S.borda}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, fontFamily: FONT }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.texto, marginBottom: 8 }}>Excluir conversa</h3>
              <p style={{ fontSize: 12, color: S.texto2, marginBottom: 14, lineHeight: 1.6 }}>
                Digite <strong style={{ color: S.vermelho }}>excluir</strong> para confirmar.
              </p>
              <input
                value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="excluir"
                style={{ width: "100%", padding: "9px 12px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 8, color: S.texto, fontSize: 13, fontFamily: FONT, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setDeleteConfirm(null); setDeleteInput(""); }}
                  style={{ flex: 1, padding: "9px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 8, color: S.texto2, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
                  Cancelar
                </button>
                <button onClick={() => deleteInput === "excluir" && deleteConv(deleteConfirm)} disabled={deleteInput !== "excluir"}
                  style={{ flex: 1, padding: "9px", background: deleteInput === "excluir" ? S.vermelho : S.fundo3, border: "none", borderRadius: 8, color: deleteInput === "excluir" ? "#fff" : S.texto3, cursor: deleteInput === "excluir" ? "pointer" : "not-allowed", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DELETE ACCOUNT */}
      <AnimatePresence>
        {showDeleteAccount && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(45,26,10,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }}
              style={{ background: S.fundo2, border: `1px solid ${S.borda}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, fontFamily: FONT }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, color: S.vermelho, marginBottom: 8 }}>Excluir conta</h3>
              <p style={{ fontSize: 12, color: S.texto2, marginBottom: 14, lineHeight: 1.6 }}>
                Digite <strong style={{ color: S.vermelho }}>excluir minha conta</strong> para confirmar. Tudo será apagado permanentemente.
              </p>
              <input
                value={deleteAccountInput} onChange={(e) => setDeleteAccountInput(e.target.value)} placeholder="excluir minha conta"
                style={{ width: "100%", padding: "9px 12px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 8, color: S.texto, fontSize: 13, fontFamily: FONT, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowDeleteAccount(false); setDeleteAccountInput(""); }}
                  style={{ flex: 1, padding: "9px", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 8, color: S.texto2, cursor: "pointer", fontSize: 12, fontFamily: FONT }}>
                  Cancelar
                </button>
                <button onClick={() => deleteAccountInput === "excluir minha conta" && deleteAccount()} disabled={deleteAccountInput !== "excluir minha conta"}
                  style={{ flex: 1, padding: "9px", background: deleteAccountInput === "excluir minha conta" ? S.vermelho : S.fundo3, border: "none", borderRadius: 8, color: deleteAccountInput === "excluir minha conta" ? "#fff" : S.texto3, cursor: deleteAccountInput === "excluir minha conta" ? "pointer" : "not-allowed", fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>
                  Excluir tudo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PLANOS */}
      <AnimatePresence>
        {showPlans && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPlans(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(45,26,10,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: S.fundo2, border: `1px solid ${S.borda}`, borderRadius: 16, padding: 26, width: "100%", maxWidth: 460, fontFamily: FONT }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: S.texto }}>Planos</h3>
                <button onClick={() => setShowPlans(false)} style={{ background: "none", border: "none", color: S.texto2, cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {/* Gratuito */}
                <div style={{ flex: 1, padding: "20px 16px", background: S.fundo3, border: user?.plan === "free" ? `2px solid ${S.laranja}` : `1px solid ${S.borda}`, borderRadius: 14 }}>
                  <div style={{ fontSize: 10, color: S.texto3, marginBottom: 4, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Gratuito</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: S.texto, marginBottom: 16 }}>R$0</div>
                  {["Chat limitado", "Sem geração de imagens", "Sem voz", "Sem exportar PDF"].map((f) => (
                    <div key={f} style={{ fontSize: 12, color: S.texto3, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={9} /> {f}
                    </div>
                  ))}
                  {user?.plan === "free" && (
                    <div style={{ marginTop: 16, fontSize: 11, color: S.laranja, fontWeight: 700 }}>Plano atual</div>
                  )}
                </div>

                {/* Plus */}
                <div style={{ flex: 1, padding: "20px 16px", background: S.laranjaFraco, border: `1px solid ${S.borda}`, borderRadius: 14, position: "relative" }}>
                  <div style={{ position: "absolute", top: -10, right: 12, background: S.laranja, borderRadius: 20, padding: "2px 10px", fontSize: 9, color: "#fff", fontWeight: 700, letterSpacing: 1 }}>
                    EM BREVE
                  </div>
                  <div style={{ fontSize: 10, color: S.laranja, marginBottom: 4, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>Pya Plus</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: S.texto, marginBottom: 2 }}>
                    R$89,99
                    <span style={{ fontSize: 12, fontWeight: 400, color: S.texto3 }}>/mês</span>
                  </div>
                  <div style={{ fontSize: 10, color: S.texto3, marginBottom: 14 }}>Em breve</div>
                  {["Chat ilimitado", "Geração de imagens", "Voz Sage", "Exportar PDF", "Análise de documentos"].map((f) => (
                    <div key={f} style={{ fontSize: 12, color: S.texto2, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={9} color={S.laranja} /> {f}
                    </div>
                  ))}
                  <button
                    onClick={() => alert("Pagamento em breve! Aguarde o lançamento do Pya Plus.")}
                    style={{
                      marginTop: 14, width: "100%", padding: "10px",
                      background: S.laranja, border: "none", borderRadius: 9,
                      color: "#fff", cursor: "pointer", fontSize: 12,
                      fontFamily: FONT, fontWeight: 700,
                      boxShadow: "0 2px 10px rgba(249,115,22,0.3)",
                    }}
                  >
                    Assinar Pya Plus
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConvItem({
  c, active, onSelect, onMenu, menuOpen, onFavorite,
  onRename, onDelete, onExport, renaming, renameVal, setRenameVal, doRename,
}: {
  c: Conversation; active: boolean; onSelect: (id: string) => void;
  onMenu: (id: string | null) => void; menuOpen: boolean;
  onFavorite: (id: string, f: boolean) => void;
  onRename: (id: string, t: string) => void;
  onDelete: (id: string) => void; onExport: (id: string) => void;
  renaming: boolean; renameVal: string;
  setRenameVal: (v: string) => void; doRename: (id: string) => void;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 2 }}>
      {renaming ? (
        <div style={{ padding: "3px 6px" }}>
          <input
            autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") doRename(c.id); }}
            onBlur={() => doRename(c.id)}
            style={{ width: "100%", padding: "6px 10px", background: S.fundo3, border: `1px solid ${S.laranja}`, borderRadius: 7, color: S.texto, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      ) : (
        <div
          onClick={() => onSelect(c.id)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px", borderRadius: 9, cursor: "pointer",
            background: active ? S.laranja : "transparent",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = S.fundo3; }}
          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
            {c.favorited && <Star size={9} color={active ? "#fff" : S.laranja} fill={active ? "#fff" : S.laranja} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: 12, color: active ? "#fff" : S.texto2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FONT, fontWeight: active ? 700 : 400 }}>
              {c.title}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMenu(menuOpen ? null : c.id); }}
            style={{ background: "none", border: "none", color: active ? "rgba(255,255,255,0.7)" : S.texto3, cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
          >
            <ChevronDown size={11} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "absolute", right: 0, top: "100%", background: S.fundo3, border: `1px solid ${S.borda}`, borderRadius: 10, zIndex: 10, minWidth: 160, overflow: "hidden", boxShadow: "0 8px 24px rgba(45,26,10,0.15)" }}
          >
            {[
              { icon: <Star size={11} />, label: c.favorited ? "Desfavoritar" : "Favoritar", action: () => { onFavorite(c.id, c.favorited); onMenu(null); } },
              { icon: <Edit3 size={11} />, label: "Renomear", action: () => onRename(c.id, c.title) },
              { icon: <Download size={11} />, label: "Exportar PDF", action: () => { onExport(c.id); onMenu(null); } },
              { icon: <Trash2 size={11} />, label: "Excluir", action: () => onDelete(c.id), danger: true },
            ].map((item) => (
              <button
                key={item.label} onClick={item.action}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", background: "none", border: "none", color: item.danger ? S.vermelho : S.texto2, cursor: "pointer", fontSize: 12, fontFamily: FONT, textAlign: "left", fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget).style.background = S.fundo2}
                onMouseLeave={(e) => (e.currentTarget).style.background = "none"}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Btn({ onClick, icon, label, active }: { onClick: () => void; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "none", border: `1px solid ${S.borda}`, borderRadius: 6, color: active ? S.laranja : S.texto3, cursor: "pointer", fontSize: 11, fontFamily: FONT, transition: "all 0.15s", fontWeight: 500 }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.laranja; e.currentTarget.style.color = S.laranja; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.borda; e.currentTarget.style.color = active ? S.laranja : S.texto3; }}
    >
      {icon} {label}
    </button>
  );
}