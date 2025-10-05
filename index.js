import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({ storage: multer.memoryStorage() });

///endpoint promptext///

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Messages harus berupa array percakapan!",
    });
  }

  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // mapping array FE -> format Gemini
    const contents = messages.map((msg) => ({
      role: msg.role || "user",
      parts: [{ text: msg.text }],
    }));

    const aiResponse = await model.generateContent({ contents });

    res.status(200).json({
      success: true,
      data: aiResponse.response.text(),
      message: "Berhasil ditanggapi oleh Google Gemini Flash!",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      data: null,
      message: e.message || "Ada masalah di server!",
    });
  }
});

///endpoint gambar///

app.post("/api/jelasingambar", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBase64 = req.file.buffer.toString("base64");
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const resp = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const resultText = resp.response.text(); // Ambil hasil dari AI
    res.json({ success: true, result: resultText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

///endpoint dokumen///

app.post("/api/jelasdokumen", upload.single("document"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) {
      return res.json({ success: false, error: "Dokumen tidak ditemukan" });
    }

    // Konversi dokumen jadi base64
    const fileBase64 = file.buffer.toString("base64");

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Panggil model Gemini
    const resp = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt || "Jelaskan isi dokumen ini:" },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: fileBase64,
              },
            },
          ],
        },
      ],
    });

    // Ambil teks hasil dari Gemini
    const resultText = resp.response.text();

    res.json({ success: true, result: resultText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => {
  console.log(
    "🚀 Chatbot Gemini  Ai created by Ridhotuta jalan di http://localhost:3000"
  );
});
