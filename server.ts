import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit for image uploads to handle high-res photos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup Gemini
const apiKey = process.env.GEMINI_API_KEY;

// Log initialization status
console.log(`Gemini API Initialized: ${apiKey ? 'YES' : 'NO'}`);

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

app.post("/api/analyze", async (req, res) => {
  console.log("Analysis request received");
  try {
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return res.status(500).json({ error: "API 키가 설정되지 않았습니다. 설정에서 API 키를 확인해주세요." });
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "이미지가 전송되지 않았습니다." });
    }

    // Extract base64 content
    const base64Data = image.split(",")[1] || image;
    const mimeType = image.split(";")[0]?.split(":")[1] || "image/jpeg";

    const prompt = `당신은 세계적인 퍼스널 컬러 분석 전문가입니다. 
제공된 이미지를 정밀 분석하여 사용자의 퍼스널 컬러와 스타일링 제안을 JSON 형식으로 답변해주세요.
한국어로 친절하고 전문적으로 설명해주어야 합니다.
단정적인 표현보다는 "사진상으로는", "현재 이미지 기준으로는" 등 조심스러운 표현을 섞어주세요.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disclaimer: { type: Type.STRING },
            summary: { type: Type.STRING },
            tone_direction: { type: Type.STRING },
            season_type: { type: Type.STRING },
            sub_type: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            analysis: {
              type: Type.OBJECT,
              properties: {
                skin_tone: { type: Type.STRING },
                brightness: { type: Type.STRING },
                saturation: { type: Type.STRING },
                contrast: { type: Type.STRING },
                overall_impression: { type: Type.STRING }
              },
              required: ["skin_tone", "brightness", "saturation", "contrast", "overall_impression"]
            },
            recommended_colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "hex", "reason"]
              }
            },
            avoid_colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "hex", "reason"]
              }
            },
            makeup_recommendations: {
              type: Type.OBJECT,
              properties: {
                lip: { type: Type.ARRAY, items: { type: Type.STRING } },
                blush: { type: Type.ARRAY, items: { type: Type.STRING } },
                eyeshadow: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["lip", "blush", "eyeshadow"]
            },
            hair_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            fashion_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            style_tip: { type: Type.STRING },
            photo_quality_note: { type: Type.STRING }
          },
          required: [
            "disclaimer", "summary", "tone_direction", "season_type", 
            "sub_type", "confidence", "analysis", "recommended_colors", 
            "avoid_colors", "makeup_recommendations", "hair_recommendations", 
            "fashion_recommendations", "style_tip", "photo_quality_note"
          ]
        }
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("Gemini로부터 응답을 받지 못했습니다.");
    }

    try {
      res.json(JSON.parse(text));
    } catch (parseError) {
      console.error("JSON Parse error:", text);
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(jsonStr));
    }
  } catch (error: any) {
    console.error("Analysis route error:", error);
    const message = error.message || "이미지 분석 중 오류가 발생했습니다.";
    res.status(500).json({ error: message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
