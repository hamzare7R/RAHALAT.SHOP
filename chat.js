(() => {
  "use strict";

  const WORKER_URL = "https://rahalat-ai.hamzareggaoui63.workers.dev";
  const $ = (id) => document.getElementById(id);
  const root = document.createElement("div");
  root.id = "rahChat";
  root.innerHTML = `
    <button class="rah-chat-launch" id="rahChatLaunch" type="button" aria-label="Open Rahalat AI chat">
      <span class="rah-chat-launch-icon" aria-hidden="true">✦</span><span class="rah-chat-launch-label">Rahalat AI</span>
    </button>
    <section class="rah-chat-panel" id="rahChatPanel" aria-label="Rahalat AI shopping assistant" hidden>
      <header class="rah-chat-head">
        <div class="rah-chat-brand"><span class="rah-chat-avatar">✦</span><div><strong>Rahalat AI</strong><small data-chat-subtitle>Your outdoor shopping assistant</small></div></div>
        <div class="rah-chat-actions">
          <button type="button" id="rahChatLang" aria-label="Change chat language">AR</button>
          <button type="button" id="rahChatClose" aria-label="Close chat">×</button>
        </div>
      </header>
      <div class="rah-chat-messages" id="rahChatMessages" aria-live="polite"></div>
      <div class="rah-chat-suggestions" id="rahChatSuggestions">
        <button type="button" data-prompt="Help me choose camping gear">Camping gear</button>
        <button type="button" data-prompt="I need hiking essentials">Hiking essentials</button>
        <button type="button" data-prompt="Recommend gear for a beach trip">Beach trip</button>
      </div>
      <form class="rah-chat-form" id="rahChatForm">
        <input id="rahChatInput" type="text" maxlength="700" autocomplete="off" placeholder="Ask about outdoor gear..." aria-label="Your message">
        <button type="submit" id="rahChatSend" aria-label="Send message">➤</button>
      </form>
      <p class="rah-chat-note" data-chat-note>Product prices and delivery are confirmed on AliExpress.</p>
    </section>`;
  document.body.appendChild(root);

  const panel = $("rahChatPanel");
  const messagesEl = $("rahChatMessages");
  const input = $("rahChatInput");
  const form = $("rahChatForm");
  let lang = document.documentElement.lang === "ar" ? "ar" : "en";
  let history = [];
  let busy = false;

  const labels = {
    en: {
      subtitle: "Your outdoor shopping assistant",
      note: "Product prices and delivery are confirmed on AliExpress.",
      placeholder: "Ask about outdoor gear...",
      welcome: "Hi! I'm Rahalat AI. Tell me about your trip or the gear you're looking for, and I'll help you explore our catalog.",
      error: "Sorry, I couldn't connect right now. Please try again in a moment.",
      thinking: "Finding the best matches...",
      suggestions: ["Camping gear", "Hiking essentials", "Beach trip"],
    },
    ar: {
      subtitle: "مساعدك لاختيار معدات الرحلات",
      note: "الثمن والتوصيل كيتحددو فصفحة المنتج على AliExpress.",
      placeholder: "سولني على معدات الرحلات...",
      welcome: "مرحبا! أنا Rahalat AI. قول ليا شنو نوع الرحلة أو المعدات اللي كتقلب عليها، ونعاونك تختار من المنتجات المتوفرة فالمتجر.",
      error: "سمح ليا، ما قدرتش نتصل بالمساعد دابا. عاود المحاولة من بعد شوية.",
      thinking: "كنقلب على المنتجات المناسبة...",
      suggestions: ["معدات التخييم", "مستلزمات المشي", "رحلة للشاطئ"],
    },
  };

  function setLanguage(next) {
    lang = next;
    const ar = lang === "ar";
    panel.dir = ar ? "rtl" : "ltr";
    $("rahChatLang").textContent = ar ? "EN" : "AR";
    root.querySelector("[data-chat-subtitle]").textContent = labels[lang].subtitle;
    root.querySelector("[data-chat-note]").textContent = labels[lang].note;
    input.placeholder = labels[lang].placeholder;
    const buttons = $("rahChatSuggestions").querySelectorAll("button");
    buttons.forEach((button, i) => {
      button.textContent = labels[lang].suggestions[i];
      button.dataset.prompt = labels[lang].suggestions[i];
    });
  }

  function addMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.className = "rah-chat-bubble " + (role === "user" ? "is-user" : "is-ai");
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function getProducts() {
    return (window.RAHALAT_PRODUCTS || []).map((p) => ({
      name: p.name,
      category: p.category,
      description: p.description,
      url: p.url,
    }));
  }

  async function send(text) {
    const clean = text.trim();
    if (!clean || busy) return;
    busy = true;
    $("rahChatSend").disabled = true;
    addMessage("user", clean);
    history.push({ role: "user", content: clean });
    input.value = "";
    const typing = addMessage("assistant", labels[lang].thinking);

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-8), products: getProducts() }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || "Request failed");
      typing.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply });
      history = history.slice(-8);
    } catch (error) {
      typing.textContent = labels[lang].error;
      history.pop();
    } finally {
      busy = false;
      $("rahChatSend").disabled = false;
      input.focus();
    }
  }

  $("rahChatLaunch").addEventListener("click", () => {
    panel.hidden = false;
    $("rahChatLaunch").hidden = true;
    if (!messagesEl.children.length) addMessage("assistant", labels[lang].welcome);
    input.focus();
  });
  $("rahChatClose").addEventListener("click", () => {
    panel.hidden = true;
    $("rahChatLaunch").hidden = false;
  });
  $("rahChatLang").addEventListener("click", () => setLanguage(lang === "ar" ? "en" : "ar"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    send(input.value);
  });
  $("rahChatSuggestions").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-prompt]");
    if (button) send(button.dataset.prompt);
  });

  setLanguage(lang);
})();
