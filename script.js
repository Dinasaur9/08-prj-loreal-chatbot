/* ===== Config ===== */
// Paste your deployed Cloudflare Worker URL here (it ends in .workers.dev)
const WORKER_URL = "https://loreal-beauty-advisor-api.dina-seoudii.workers.dev/";

/* ===== DOM elements ===== */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

/* ===== System prompt ===== */
const systemPrompt = `You are the L'Oréal Smart Routine & Product Advisor, a friendly and knowledgeable beauty assistant.

Your job:
- Help users discover and understand L'Oréal products across makeup, skincare, haircare, and fragrance (including L'Oréal group brands such as L'Oréal Paris, Lancôme, Kiehl's, La Roche-Posay, CeraVe, Maybelline, Garnier, NYX, Redken, Kérastase, and YSL Beauty).
- Build personalized routines and recommendations based on the user's skin type, hair type, concerns, preferences, and budget. Ask a short follow-up question when you need more details.
- Answer general beauty questions (ingredients, how to layer products, what a serum vs. a moisturizer does, etc.).

Rules:
- Only answer questions about L'Oréal products, beauty routines, recommendations, and closely related beauty topics.
- If a question is unrelated (for example: math homework, coding, politics, sports, other general knowledge), politely decline in one or two sentences and steer the conversation back to beauty, e.g. "I'm here to help with L'Oréal products and beauty routines — is there anything about your skincare, makeup, haircare, or fragrance I can help with?"
- Do not invent products. If you're not sure a specific product exists, say so and suggest a well-known alternative.
- You are not a doctor. For serious skin conditions, recommend seeing a dermatologist.
- Remember details the user shares in this conversation (like their name, skin type, or past questions) and use them naturally.
- Keep answers warm, clear, and concise. Use short paragraphs or lists, and a light touch of emoji.
- Write in plain text only. Do not use Markdown formatting such as ** or #; for lists, start lines with a number or a dash.`;

/* ===== Conversation history (LevelUp) ===== */
const messages = [{ role: "system", content: systemPrompt }];

/* ===== Helpers ===== */
function addMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${sender}`;
  bubble.textContent = text; // textContent avoids injecting HTML
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function showLatestQuestion(text) {
  latestQuestion.innerHTML = "<strong>You asked:</strong>";
  latestQuestion.append(document.createTextNode(text));
  latestQuestion.hidden = false;
}

/* ===== Initial greeting ===== */
addMessage(
  "👋 Bonjour! I'm your L'Oréal beauty advisor. Ask me about products, or tell me your skin or hair type and I'll build you a routine.",
  "ai"
);

/* ===== Handle form submit ===== */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // Show the user's message and latest question
  addMessage(question, "user");
  showLatestQuestion(question);
  messages.push({ role: "user", content: question });

  userInput.value = "";
  sendBtn.disabled = true;
  const loading = addMessage("Thinking…", "ai loading");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    loading.remove();
    addMessage(reply, "ai");
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    loading.remove();
    addMessage(
      "Sorry, something went wrong reaching the advisor. Please try again in a moment.",
      "ai error"
    );
    // Remove the unanswered question so history stays consistent
    messages.pop();
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
