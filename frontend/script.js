const form = document.getElementById("promptForm");
const promptInput = document.getElementById("prompt");
const tripIdInput = document.getElementById("tripId");
const serviceUrlInput = document.getElementById("serviceUrl");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const languageBadge = document.getElementById("languageBadge");
const summaryEl = document.getElementById("summary");
const suggestionsEl = document.getElementById("suggestions");

function setStatus(message, isError = false) {
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function renderSuggestions(data) {
  languageBadge.textContent = data.languageCode || "en-IN";
  summaryEl.textContent = data.summary || "";
  suggestionsEl.innerHTML = "";

  for (const item of data.suggestions || []) {
    const li = document.createElement("li");

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    const title = document.createElement("span");
    title.textContent = item.title;
    const type = document.createElement("span");
    type.className = "type-tag";
    type.textContent = item.type;
    titleRow.append(title, type);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = item.description;

    li.append(titleRow, desc);

    if (item.estimatedCost != null) {
      const cost = document.createElement("div");
      cost.className = "cost";
      cost.textContent = `~ ${item.estimatedCost}`;
      li.append(cost);
    }

    suggestionsEl.append(li);
  }

  resultEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  resultEl.hidden = true;
  submitBtn.disabled = true;
  setStatus("Thinking…");

  const baseUrl = serviceUrlInput.value.trim().replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/api/v1/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: promptInput.value.trim(),
        trip_id: tripIdInput.value.trim() || null,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${body}`);
    }

    const data = await response.json();
    setStatus("");
    renderSuggestions(data);
  } catch (err) {
    setStatus(`Request failed: ${err.message}`, true);
  } finally {
    submitBtn.disabled = false;
  }
});
