"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Plus, Star, Edit3, Trash2, Download, FileText,
  LogOut, ChevronDown, Paperclip, Send, Copy, Volume2,
  Image as ImageIcon, Check, Crown, Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image" | "pdf";
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
  size: number;
}

const PROMPTS = [
  "Me ajuda a organizar minha semana",
  "Preciso criar um documento profissional",
  "Analisa esse arquivo pra mim",
  "Me orienta sobre minha carreira",
  "Cria uma imagem pra mim",
  "Preciso de ajuda com um problema",
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      const u = data.session.user;
      setUser({
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.email || "Usuário",
        avatar: u.user_metadata?.avatar_url || "",
        plan: "free",
      });
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
        id: m.id, role: m.role,
        content: m.content.startsWith("__IMAGE__") ? m.content.replace("__IMAGE__", "") : m.content,
        type: m.content.startsWith("__IMAGE__") ? "image" : "text",
        imageUrl: m.content.startsWith("__IMAGE__") ? m.content.replace("__IMAGE__", "") : undefined,
      })));
    }
  };

  const selectConversation = (id: string) => {
    setActiveConv(id);
    loadMessages(id);
    setSidebarOpen(false);
    setConvMenu(null);
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
          const base64 = result.split(",")[1];
          newFiles.push({
            name: file.name,
            type: isImage ? "image" : "document",
            preview: isImage ? result : undefined,
            data: base64,
            mediaType: file.type,
            size: file.size,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setFiles((p) => [...p, ...newFiles]);
  };

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

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
      convId = data.conversation.id;
      setConversations((p) => [data.conversation, ...p]);
      setActiveConv(convId);
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, files: [...files] };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setFiles([]);
    setLoading(true);

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

    // Detectar se precisa gerar imagem
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

    // Chat normal
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
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setSpeaking(null);
      audio.play();
    } catch { setSpeaking(null); }
  };

  const exportPDF = async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    const res = await fetch(`/api/messages?conversationId=${convId}`);
    const data = await res.json();
    const content = data.messages?.map((m: { role: string; content: string }) => `${m.role === "user" ? "Você" : "Pya"}: ${m.content}`).join("\n\n") || "";
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
    setDeleteConfirm(null);
    setDeleteInput("");
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); }
  };

  const favorites = conversations.filter((c) => c.favorited);
  const regular = conversations.filter((c) => !c.favorited);

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--fundo)", overflow: "hidden", fontFamily: "var(--fonte)" }}>

      {/* OVERLAY SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(2px)" }}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed", left: 0, top: 0, bottom: 0, width: 300,
              background: "var(--fundo-2)", borderRight: "1px solid var(--borda)",
              display: "flex", flexDirection: "column", zIndex: 50, overflowY: "auto",
            }}
          >
            {/* Sidebar Header */}
            <div style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--borda)" }}>
              <img src="/pya001.png" alt="Pya" style={{ height: 32, objectFit: "contain" }} />
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "var(--texto-2)", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Nova conversa */}
            <div style={{ padding: "12px 12px 8px" }}>
              <button onClick={newConversation} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                background: "var(--laranja-suave)", border: "1px solid rgba(249,115,20,0.2)",
                borderRadius: 10, color: "var(--laranja)", cursor: "pointer", fontSize: 13, fontFamily: "var(--fonte)", fontWeight: 500,
              }}>
                <Plus size={16} /> Nova conversa
              </button>
            </div>

            {/* Conversas */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
              {favorites.length > 0 && (
                <>
                  <div style={{ padding: "8px 8px 4px", fontSize: 10, color: "var(--texto-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Favoritos</div>
                  {favorites.map((c) => <ConvItem key={c.id} c={c} active={activeConv === c.id} onSelect={selectConversation} onMenu={setConvMenu} menuOpen={convMenu === c.id} onFavorite={toggleFavorite} onRename={(id, t) => { setRenaming(id); setRenameVal(t); setConvMenu(null); }} onDelete={(id) => { setDeleteConfirm(id); setConvMenu(null); }} onExport={exportPDF} renaming={renaming === c.id} renameVal={renameVal} setRenameVal={setRenameVal} doRename={renameConv} />)}
                  <div style={{ height: 1, background: "var(--borda)", margin: "8px 0" }} />
                </>
              )}
              {regular.length > 0 && (
                <>
                  {favorites.length > 0 && <div style={{ padding: "4px 8px", fontSize: 10, color: "var(--texto-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Conversas</div>}
                  {regular.map((c) => <ConvItem key={c.id} c={c} active={activeConv === c.id} onSelect={selectConversation} onMenu={setConvMenu} menuOpen={convMenu === c.id} onFavorite={toggleFavorite} onRename={(id, t) => { setRenaming(id); setRenameVal(t); setConvMenu(null); }} onDelete={(id) => { setDeleteConfirm(id); setConvMenu(null); }} onExport={exportPDF} renaming={renaming === c.id} renameVal={renameVal} setRenameVal={setRenameVal} doRename={renameConv} />)}
                </>
              )}
              {conversations.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--texto-3)", fontSize: 13 }}>Nenhuma conversa ainda</div>
              )}
            </div>

            {/* Planos divider */}
            <div style={{ height: 1, background: "var(--borda)", margin: "0 12px" }} />

            {/* Planos section */}
            <div style={{ padding: "12px 12px 0" }}>
              <button onClick={() => setShowPlans(true)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "var(--fundo-3)", border: "1px solid var(--borda)",
                borderRadius: 10, cursor: "pointer", fontFamily: "var(--fonte)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Crown size={14} color="var(--laranja)" />
                  <span style={{ fontSize: 13, color: "var(--texto)" }}>Assinatura</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--texto-2)", background: "var(--fundo-4)", padding: "2px 8px", borderRadius: 20 }}>
                  {user?.plan === "premium" ? "Pya Plus" : "Gratuito"}
                </span>
              </button>
            </div>

            {/* User section */}
            <div style={{ padding: "10px 12px 16px" }}>
              <div style={{ padding: "12px 14px", background: "var(--fundo-3)", borderRadius: 10, border: "1px solid var(--borda)" }}>
                <button onClick={() => setShowDeleteAccount(true)} style={{
                  display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
                  color: "var(--vermelho)", fontSize: 12, cursor: "pointer", padding: "0 0 8px", fontFamily: "var(--fonte)",
                }}>
                  Excluir conta
                </button>
                <div style={{ fontSize: 12, color: "var(--texto-2)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--texto-3)" }}>
                    {user?.plan === "premium" ? "Pya Plus ✦" : "Plano gratuito"}
                  </span>
                  <button onClick={signOut} style={{
                    display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
                    color: "var(--texto-2)", cursor: "pointer", fontSize: 12, fontFamily: "var(--fonte)",
                  }}>
                    <LogOut size={12} /> Sair
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* HEADER */}
        <header style={{
          height: 56, display: "flex", alignItems: "center", padding: "0 16px",
          borderBottom: "1px solid var(--borda)", background: "var(--fundo-2)", flexShrink: 0,
          gap: 12,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "var(--texto-2)", cursor: "pointer", padding: 4, display: "flex" }}>
            <Menu size={20} />
          </button>
          <img src="/pya001.png" alt="Pya" style={{ height: 28, objectFit: "contain" }} />
        </header>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 40 }}>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <img src="/pya001.png" alt="Pya" style={{ height: 64, objectFit: "contain", marginBottom: 16, opacity: 0.9 }} />
                <p style={{ color: "var(--texto-2)", fontSize: 14 }}>Como posso te ajudar hoje?</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => sendMessage(p)} style={{
                    padding: "14px 16px", background: "var(--fundo-2)", border: "1px solid var(--borda)",
                    borderRadius: 12, color: "var(--texto-2)", cursor: "pointer", fontSize: 13,
                    textAlign: "left", fontFamily: "var(--fonte)", transition: "all 0.2s",
                    lineHeight: 1.4,
                  }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(249,115,20,0.3)"; (e.target as HTMLButtonElement).style.color = "var(--texto)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "var(--borda)"; (e.target as HTMLButtonElement).style.color = "var(--texto-2)"; }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {/* File previews */}
                  {msg.files && msg.files.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      {msg.files.map((f, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                          background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 8,
                          fontSize: 11, color: "var(--texto-2)",
                        }}>
                          {f.type === "image" && f.preview ? (
                            <img src={f.preview} style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                          ) : (
                            <FileText size={12} />
                          )}
                          {f.name.length > 16 ? f.name.slice(0, 14) + "…" : f.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.type === "image" && msg.imageUrl ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <img src="/pya002.png" alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                      </div>
                      <img
                        src={msg.imageUrl} alt="Imagem gerada"
                        onClick={() => setImageModal(msg.imageUrl!)}
                        style={{ maxWidth: 400, borderRadius: 12, cursor: "pointer", border: "1px solid var(--borda)" }}
                      />
                      <button onClick={() => { const a = document.createElement("a"); a.href = msg.imageUrl!; a.download = `pya-image-${Date.now()}.png`; a.target = "_blank"; a.click(); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--borda)", borderRadius: 8, padding: "6px 12px", color: "var(--texto-2)", cursor: "pointer", fontSize: 12, fontFamily: "var(--fonte)" }}>
                        <Download size={12} /> Baixar imagem
                      </button>
                    </div>
                  ) : (
                    <div style={{ maxWidth: "85%" }}>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <img src="/pya002.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                        </div>
                      )}
                      <div style={{
                        padding: "12px 16px",
                        background: msg.role === "user" ? "var(--laranja)" : "var(--fundo-2)",
                        border: msg.role === "user" ? "none" : "1px solid var(--borda)",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        color: msg.role === "user" ? "#fff" : "var(--texto)",
                        fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {msg.content}
                      </div>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <ActionBtn onClick={() => copyMessage(msg.id, msg.content)} icon={copied === msg.id ? <Check size={12} /> : <Copy size={12} />} label={copied === msg.id ? "Copiado" : "Copiar"} />
                          <ActionBtn onClick={() => speakMessage(msg.id, msg.content)} icon={<Volume2 size={12} />} label={speaking === msg.id ? "Falando…" : "Ouvir"} active={speaking === msg.id} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* TYPING INDICATOR */}
              {loading && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                    <div style={{
                      width: 48, height: 48, background: "var(--fundo-3)", border: "1px solid var(--borda)",
                      borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}>
                      <motion.img
                        src="/pya002.png" alt=""
                        style={{ width: 28, height: 28, objectFit: "contain" }}
                        animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <motion.div
                      style={{
                        position: "absolute", bottom: -2, right: -2, width: 10, height: 10,
                        borderRadius: "50%", background: "var(--laranja)",
                      }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </div>
                  <div style={{ paddingTop: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--texto-3)", fontFamily: "var(--mono)", letterSpacing: 0.5 }}>
                      pya está executando
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div style={{ padding: "12px 16px 20px", background: "var(--fundo)", borderTop: "1px solid var(--borda)", flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              background: "var(--fundo-2)", border: "1px solid var(--borda)", borderRadius: 16,
              transition: "border-color 0.2s",
            }}
              onFocus={() => {}}
            >
              {/* File previews inside input */}
              {files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 12px 0" }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      position: "relative", display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 8px 4px 6px", background: "var(--fundo-3)", border: "1px solid var(--borda)",
                      borderRadius: 8, fontSize: 11, color: "var(--texto-2)", maxWidth: 160,
                    }}>
                      {f.type === "image" && f.preview ? (
                        <img src={f.preview} style={{ width: 20, height: 20, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <FileText size={12} style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name.length > 14 ? f.name.slice(0, 12) + "…" : f.name}
                      </span>
                      <button onClick={() => removeFile(i)} style={{
                        background: "none", border: "none", color: "var(--texto-3)", cursor: "pointer",
                        padding: 0, display: "flex", flexShrink: 0, marginLeft: 2,
                      }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", padding: "8px 8px 8px 12px", gap: 8 }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none", resize: "none",
                    color: "var(--texto)", fontSize: 14, fontFamily: "var(--fonte)", lineHeight: 1.6,
                    padding: "4px 0", minHeight: 28, maxHeight: 160, overflowY: "auto",
                    caretColor: "var(--laranja)",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" style={{ display: "none" }} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "none", border: "none", color: files.length >= 7 ? "var(--texto-3)" : "var(--texto-2)",
                    cursor: files.length >= 7 ? "not-allowed" : "pointer", borderRadius: 8,
                  }}>
                    <Paperclip size={16} />
                  </button>
                  {(input.trim() || files.length > 0) && (
                    <motion.button
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      onClick={() => sendMessage()}
                      disabled={loading}
                      style={{
                        width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                        background: loading ? "var(--fundo-4)" : "var(--laranja)", border: "none",
                        borderRadius: 8, color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                      }}
                    >
                      <Send size={14} />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            <p style={{ textAlign: "center", fontSize: 10, color: "var(--texto-3)", marginTop: 8 }}>
              Enter para quebrar linha • Pya pode cometer erros
            </p>
          </div>
        </div>
      </div>

      {/* MODAL IMAGEM */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setImageModal(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
              <img src={imageModal} alt="" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, display: "block" }} />
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
                <button onClick={() => { const a = document.createElement("a"); a.href = imageModal; a.download = `pya-${Date.now()}.png`; a.target = "_blank"; a.click(); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--laranja)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "var(--fonte)" }}>
                  <Download size={14} /> Baixar imagem
                </button>
                <button onClick={() => setImageModal(null)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 8, color: "var(--texto-2)", cursor: "pointer", fontSize: 13, fontFamily: "var(--fonte)" }}>
                  <X size={14} /> Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DELETE CONVERSA */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: "var(--fundo-2)", border: "1px solid var(--borda)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--texto)", marginBottom: 8 }}>Excluir conversa</h3>
              <p style={{ fontSize: 13, color: "var(--texto-2)", marginBottom: 16, lineHeight: 1.5 }}>
                Digite <strong style={{ color: "var(--vermelho)" }}>excluir</strong> para confirmar. Esta ação não pode ser desfeita.
              </p>
              <input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="excluir"
                style={{ width: "100%", padding: "10px 14px", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 10, color: "var(--texto)", fontSize: 14, fontFamily: "var(--fonte)", outline: "none", marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setDeleteConfirm(null); setDeleteInput(""); }}
                  style={{ flex: 1, padding: "10px", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 10, color: "var(--texto-2)", cursor: "pointer", fontSize: 14, fontFamily: "var(--fonte)" }}>
                  Cancelar
                </button>
                <button onClick={() => deleteInput === "excluir" && deleteConv(deleteConfirm)} disabled={deleteInput !== "excluir"}
                  style={{ flex: 1, padding: "10px", background: deleteInput === "excluir" ? "var(--vermelho)" : "var(--fundo-4)", border: "none", borderRadius: 10, color: deleteInput === "excluir" ? "#fff" : "var(--texto-3)", cursor: deleteInput === "excluir" ? "pointer" : "not-allowed", fontSize: 14, fontFamily: "var(--fonte)", fontWeight: 500 }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: "var(--fundo-2)", border: "1px solid var(--borda)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--vermelho)", marginBottom: 8 }}>Excluir conta</h3>
              <p style={{ fontSize: 13, color: "var(--texto-2)", marginBottom: 16, lineHeight: 1.5 }}>
                Todos os seus dados serão apagados permanentemente. Digite <strong style={{ color: "var(--vermelho)" }}>excluir minha conta</strong> para confirmar.
              </p>
              <input value={deleteAccountInput} onChange={(e) => setDeleteAccountInput(e.target.value)}
                placeholder="excluir minha conta"
                style={{ width: "100%", padding: "10px 14px", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 10, color: "var(--texto)", fontSize: 14, fontFamily: "var(--fonte)", outline: "none", marginBottom: 16 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowDeleteAccount(false); setDeleteAccountInput(""); }}
                  style={{ flex: 1, padding: "10px", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 10, color: "var(--texto-2)", cursor: "pointer", fontSize: 14, fontFamily: "var(--fonte)" }}>
                  Cancelar
                </button>
                <button onClick={() => deleteAccountInput === "excluir minha conta" && deleteAccount()} disabled={deleteAccountInput !== "excluir minha conta"}
                  style={{ flex: 1, padding: "10px", background: deleteAccountInput === "excluir minha conta" ? "var(--vermelho)" : "var(--fundo-4)", border: "none", borderRadius: 10, color: deleteAccountInput === "excluir minha conta" ? "#fff" : "var(--texto-3)", cursor: deleteAccountInput === "excluir minha conta" ? "pointer" : "not-allowed", fontSize: 14, fontFamily: "var(--fonte)", fontWeight: 500 }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPlans(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--fundo-2)", border: "1px solid var(--borda)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--texto)" }}>Escolha seu plano</h3>
                <button onClick={() => setShowPlans(false)} style={{ background: "none", border: "none", color: "var(--texto-2)", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {/* Gratuito */}
                <div style={{ flex: 1, padding: "20px 16px", background: "var(--fundo-3)", border: user?.plan === "free" ? "1px solid var(--laranja)" : "1px solid var(--borda)", borderRadius: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--texto-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Gratuito</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--texto)", marginBottom: 16 }}>R$0</div>
                  {["Chat limitado", "Sem geração de imagem", "Sem voz", "Sem PDF"].map((f) => (
                    <div key={f} style={{ fontSize: 12, color: "var(--texto-3)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={10} color="var(--texto-3)" /> {f}
                    </div>
                  ))}
                  {user?.plan === "free" && <div style={{ marginTop: 16, fontSize: 11, color: "var(--laranja)", textAlign: "center" }}>Plano atual</div>}
                </div>
                {/* Plus */}
                <div style={{ flex: 1, padding: "20px 16px", background: "linear-gradient(135deg, rgba(249,115,20,0.1) 0%, var(--fundo-3) 100%)", border: user?.plan === "premium" ? "1px solid var(--laranja)" : "1px solid rgba(249,115,20,0.3)", borderRadius: 14, position: "relative" }}>
                  <div style={{ position: "absolute", top: -10, right: 12, background: "var(--laranja)", borderRadius: 20, padding: "2px 10px", fontSize: 10, color: "#fff", fontWeight: 600 }}>MELHOR</div>
                  <div style={{ fontSize: 12, color: "var(--laranja)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Pya Plus</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--texto)", marginBottom: 4 }}>R$47<span style={{ fontSize: 13, fontWeight: 400, color: "var(--texto-2)" }}>/mês</span></div>
                  <div style={{ fontSize: 11, color: "var(--texto-3)", marginBottom: 12 }}>Em breve</div>
                  {["Chat ilimitado", "Geração de imagens", "Voz — Sage", "Geração de PDF", "Análise de documentos"].map((f) => (
                    <div key={f} style={{ fontSize: 12, color: "var(--texto-2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={10} color="var(--laranja)" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// COMPONENTES AUXILIARES
function ConvItem({ c, active, onSelect, onMenu, menuOpen, onFavorite, onRename, onDelete, onExport, renaming, renameVal, setRenameVal, doRename }: {
  c: Conversation; active: boolean; onSelect: (id: string) => void; onMenu: (id: string | null) => void;
  menuOpen: boolean; onFavorite: (id: string, f: boolean) => void; onRename: (id: string, t: string) => void;
  onDelete: (id: string) => void; onExport: (id: string) => void;
  renaming: boolean; renameVal: string; setRenameVal: (v: string) => void; doRename: (id: string) => void;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 2 }}>
      {renaming ? (
        <div style={{ padding: "4px 8px" }}>
          <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doRename(c.id); if (e.key === "Escape") doRename(c.id); }}
            onBlur={() => doRename(c.id)}
            style={{ width: "100%", padding: "6px 10px", background: "var(--fundo-3)", border: "1px solid var(--laranja)", borderRadius: 8, color: "var(--texto)", fontSize: 13, fontFamily: "var(--fonte)", outline: "none" }} />
        </div>
      ) : (
        <div
          onClick={() => onSelect(c.id)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
            borderRadius: 8, cursor: "pointer", background: active ? "var(--laranja-suave)" : "transparent",
            border: active ? "1px solid rgba(249,115,20,0.2)" : "1px solid transparent",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "var(--fundo-3)"; }}
          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
            {c.favorited && <Star size={10} color="var(--laranja)" fill="var(--laranja)" style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: 13, color: active ? "var(--laranja)" : "var(--texto-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.title}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onMenu(menuOpen ? null : c.id); }}
            style={{ background: "none", border: "none", color: "var(--texto-3)", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      )}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ position: "absolute", right: 0, top: "100%", background: "var(--fundo-3)", border: "1px solid var(--borda)", borderRadius: 10, zIndex: 10, minWidth: 160, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            {[
              { icon: <Star size={12} />, label: c.favorited ? "Desfavoritar" : "Favoritar", action: () => { onFavorite(c.id, c.favorited); onMenu(null); } },
              { icon: <Edit3 size={12} />, label: "Renomear", action: () => onRename(c.id, c.title) },
              { icon: <Download size={12} />, label: "Exportar PDF", action: () => { onExport(c.id); onMenu(null); } },
              { icon: <Trash2 size={12} />, label: "Excluir", action: () => onDelete(c.id), danger: true },
            ].map((item) => (
              <button key={item.label} onClick={item.action} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px",
                background: "none", border: "none", color: item.danger ? "var(--vermelho)" : "var(--texto-2)",
                cursor: "pointer", fontSize: 13, fontFamily: "var(--fonte)", textAlign: "left",
              }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "var(--fundo-4)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "none"}
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

function ActionBtn({ onClick, icon, label, active }: { onClick: () => void; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
      background: "none", border: "1px solid var(--borda)", borderRadius: 6,
      color: active ? "var(--laranja)" : "var(--texto-3)", cursor: "pointer",
      fontSize: 11, fontFamily: "var(--fonte)", transition: "all 0.15s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--laranja)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--laranja)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--borda)"; (e.currentTarget as HTMLButtonElement).style.color = active ? "var(--laranja)" : "var(--texto-3)"; }}
    >
      {icon} {label}
    </button>
  );
}