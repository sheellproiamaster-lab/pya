import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "title obrigatório" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "content obrigatório" }, { status: 400 });
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sora', sans-serif; background: #FDFAF5; color: #1a1a1a; }
  .header {
    background: linear-gradient(135deg, #F97314 0%, #ea580c 100%);
    padding: 48px 56px;
    min-height: 120px;
    display: flex;
    align-items: center;
  }
  .header h1 {
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.3;
  }
  .content {
    padding: 48px 56px;
    line-height: 1.8;
    font-size: 15px;
    color: #2d2d2d;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
</head>
<body>
  <div class="header"><h1>${title}</h1></div>
  <div class="content">${content}</div>
</body>
</html>`;

    const response = await axios.post(
      "https://api.pdfshift.io/v3/convert/pdf",
      { source: html, landscape: false, use_print: false },
      {
        auth: { username: "api", password: process.env.PDFSHIFT_API_KEY! },
        responseType: "arraybuffer",
      }
    );

    return new NextResponse(response.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pya-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}