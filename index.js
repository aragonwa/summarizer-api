let available = false;

async function checkSupport() {
  if (!("Summarizer" in self)) {
    document.getElementById("status").textContent =
      "❌ Summarizer API not supported in this browser.";
    return;
  }

  const state = await Summarizer.availability();
  if (state === "unavailable") {
    document.getElementById("status").textContent =
      "❌ Summarizer unavailable on this device.";
    return;
  }

  document.getElementById("status").textContent =
    "✅ Summarizer API available!";
  available = true;
}

checkSupport();

function updateProgress(percent) {
  const container = document.getElementById("progressContainer");
  const bar = document.getElementById("progressBar");

  container.style.display = "block";
  bar.style.width = percent + "%";
}

function hideProgress() {
  document.getElementById("progressContainer").style.display = "none";
  document.getElementById("progressBar").style.width = "0%";
}

function showSpinner() {
  document.getElementById("spinner").style.display = "block";
}

function hideSpinner() {
  document.getElementById("spinner").style.display = "none";
}
function disableButtons() {
  document.querySelectorAll("button").forEach(btn => {
    btn.disabled = true;
    btn.classList.add("disabled"); // optional styling
  });
}

function enableButtons() {
  document.querySelectorAll("button").forEach(btn => {
    btn.disabled = false;
    btn.classList.remove("disabled");
  });
}
async function runSummary(type) {
  console.log("Running summarization of type:", type);
  if (!available) {
    alert("Summarizer API not supported on this browser.");
    return;
  }

  const text = document.getElementById("inputText").value.trim();
  if (!text) {
    document.getElementById("summary").textContent = "Please enter text.";
    return;
  }

  const output = document.getElementById("summary");
  output.textContent = "";

  hideProgress();
  hideSpinner();
  disableButtons();
  let summarizer;

  try {
    // Create Summarizer with progress events
    summarizer = await Summarizer.create(
      { type, format: "plain-text", length: "medium", lang: "en" },
      {
        onstatechange: (state) => {
          if (state === "initializing") updateProgress(10);
          if (state === "model-fetch") updateProgress(40);
          if (state === "model-compile") updateProgress(75);
          if (state === "ready") hideProgress();
        }
      }
    );

    // 🔄 Show spinner during actual summarization
    showSpinner();

    // const summary = await summarizer.summarize(text);
    // ⚡ STREAMING SUMMARY
    const stream = await summarizer.summarizeStreaming(text);

    for await (const chunk of stream) {
      // Each "chunk" is a piece of the generated text
      console.log("Received chunk:", chunk);
      output.textContent += chunk;
    }

    hideSpinner();
    // output.textContent = summary;

  } catch (err) {
    hideSpinner();
    hideProgress();
    output.textContent = "⚠️ Error: " + err.message;
  } finally {
    if (summarizer) summarizer.destroy();
    enableButtons();
  }
}