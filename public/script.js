const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const themeToggle = document.getElementById("theme-toggle");

let chatHistory = [];

// Tambah pesan ke UI
function appendMessage(sender, text, isMarkdown = false) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (sender === "bot" && isMarkdown) {
    msg.innerHTML = marked.parse(text);
    msg.querySelectorAll("pre code").forEach((block) => {
      if (window.hljs) hljs.highlightElement(block);
    });
  } else {
    const formatted = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    msg.innerHTML = formatted.replace(/\n/g, "<br>");
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Tambah indikator loading (titik-titik kayak WA)
function showTypingIndicator() {
  const msg = document.createElement("div");
  msg.classList.add("message", "bot", "typing");
  msg.innerHTML = `<span></span><span></span><span></span>`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  chatHistory.push({ role: "user", text: userMessage });
  userInput.value = "";
  const typing = showTypingIndicator();

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });

    const data = await response.json();
    if (typing) typing.remove();

    if (data.success) {
      appendMessage("bot", data.data, true);

      chatHistory.push({ role: "model", text: data.data });
    } else {
      appendMessage("bot", "⚠️ " + (data.message || "Gagal menerima respon"));
    }
  } catch (err) {
    if (typing) typing.remove();
    appendMessage("bot", "❌ Error: " + err.message);
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

// --- Attachment menu ---
const attachBtn = document.getElementById("attach-btn");
const attachMenu = document.getElementById("attach-menu");
const imageInput = document.getElementById("image-input");
const docInput = document.getElementById("doc-input");
const chooseImage = document.getElementById("choose-image");
const chooseDoc = document.getElementById("choose-doc");

// Styling tombol menu hijau soft
chooseImage.style.color = "#3CB371"; // hijau soft
chooseDoc.style.color = "#3CB371";

// Show/hide menu
attachBtn.addEventListener("click", () => {
  attachMenu.style.display =
    attachMenu.style.display === "none" ? "flex" : "none";

  // posisi di atas tombol
  const rect = attachBtn.getBoundingClientRect();
  attachMenu.style.position = "absolute";
  attachMenu.style.left = rect.left + "px";
  attachMenu.style.top = rect.top - attachMenu.offsetHeight - 5 + "px";
});

// Pilih Gambar
chooseImage.addEventListener("click", () => {
  imageInput.click();
  attachMenu.style.display = "none";
});

// Pilih Dokumen
chooseDoc.addEventListener("click", () => {
  docInput.click();
  attachMenu.style.display = "none";
});

// --- Upload gambar ---
imageInput.addEventListener("change", async () => {
  if (imageInput.files.length === 0) return;
  const file = imageInput.files[0];

  // --- tampilkan gambar dulu ---
  const imgMsg = document.createElement("div");
  imgMsg.classList.add("message", "user"); // user atau bot, tergantung style
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = "Gambar yang dikirim";
  img.style.maxWidth = "200px";
  img.style.borderRadius = "8px";
  imgMsg.appendChild(img);
  chatBox.appendChild(imgMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // --- indikator AI mengetik (blink-blink) ---
  const typing = document.createElement("div");
  typing.classList.add("message", "bot", "typing");
  typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  // --- kirim ke server ---
  const formData = new FormData();
  formData.append("image", file);
  formData.append("prompt", "Jelaskan gambar ini");

  try {
    const res = await fetch("/api/jelasingambar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    // hapus indikator typing
    typing.remove();

    if (data.success) {
      // tampilkan hasil penjelasan AI
      appendMessage("bot", data.result);
    } else {
      appendMessage("bot", "⚠️ " + (data.error || "Gagal mengirim gambar"));
    }
  } catch (err) {
    typing.remove();
    appendMessage("bot", "❌ Error: " + err.message);
  }
});

// --- Upload dokumen ---
// --- Upload dokumen ---
docInput.addEventListener("change", async () => {
  if (docInput.files.length === 0) return;
  const file = docInput.files[0];

  // --- tampilkan info dokumen di chat (sebelum dikirim) ---
  const docMsg = document.createElement("div");
  docMsg.classList.add("message", "user");

  const fileInfo = document.createElement("div");
  fileInfo.style.display = "inline-block";
  fileInfo.style.background = "#e8f5e9"; // hijau lembut
  fileInfo.style.border = "1px solid #a5d6a7";
  fileInfo.style.padding = "10px";
  fileInfo.style.borderRadius = "8px";
  fileInfo.style.fontSize = "14px";
  fileInfo.style.color = "#2e7d32";

  // ikon dokumen (emoji PDF)
  const icon = document.createElement("span");
  icon.textContent = "📄 ";
  icon.style.marginRight = "6px";

  const name = document.createElement("strong");
  name.textContent = file.name;

  const type = document.createElement("div");
  type.textContent = `Tipe file: ${file.type || "tidak diketahui"}`;
  type.style.fontSize = "12px";
  type.style.color = "#555";

  fileInfo.appendChild(icon);
  fileInfo.appendChild(name);
  fileInfo.appendChild(document.createElement("br"));
  fileInfo.appendChild(type);
  docMsg.appendChild(fileInfo);
  chatBox.appendChild(docMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // tampilkan status "AI sedang menganalisis..."
  const typing = document.createElement("div");
  typing.classList.add("message", "bot", "typing");
  typing.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  // --- kirim dokumen ke server ---
  const formData = new FormData();
  formData.append("document", file);
  formData.append("prompt", "Jelaskan isi dokumen ini");

  try {
    const res = await fetch("/api/jelasdokumen", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    typing.remove();

    if (data.success) {
      appendMessage("bot", data.result);
    } else {
      appendMessage("bot", "⚠️ " + (data.error || "Gagal mengirim dokumen"));
    }
  } catch (err) {
    typing.remove();
    appendMessage("bot", "❌ Error: " + err.message);
  }
});

// --- Loader “AI sedang mengetik…” animasi ---
function showTypingIndicator() {
  const msg = document.createElement("div");
  msg.classList.add("message", "bot", "typing");
  msg.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
