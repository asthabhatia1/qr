// Core logic for Image -> QR generator

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("image-input");
  const uploadArea = document.getElementById("upload-area");
  const previewBox = document.getElementById("preview-box");
  const qrContainer = document.getElementById("qrcode");
  const downloadBtn = document.getElementById("download-btn");
  const urlInput = document.getElementById("pdf-url");
  const urlGenerateBtn = document.getElementById("url-generate-btn");

  let qrInstance = null;
  let lastDataUrl = null;

  function createQR(dataUrl) {
    qrContainer.innerHTML = "";

    try {
      qrInstance = new QRCode(qrContainer, {
        text: dataUrl,
        width: 220,
        height: 220,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (err) {
      console.error("Failed to create QR:", err);
      qrContainer.innerHTML =
        '<span class="preview-placeholder">The content is too large for a QR code. Use the URL option below after uploading your PDF to cloud storage.</span>';
      downloadBtn.disabled = true;
      return;
    }

    // Enable download once canvas is drawn
    setTimeout(() => {
      const canvas = qrContainer.querySelector("canvas");
      downloadBtn.disabled = !canvas;
    }, 150);
  }

  function resetPreview() {
    previewBox.innerHTML =
      '<span class="preview-placeholder">PDF info will appear here</span>';
  }

  function resetQR() {
    qrContainer.innerHTML =
      '<span class="preview-placeholder">QR for your PDF will appear here</span>';
    downloadBtn.disabled = true;
  }

  function handleFile(file) {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file (.pdf).");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target.result; // data:application/pdf;base64,....
      lastDataUrl = dataUrl;

      // Show basic PDF info instead of a visual preview
      previewBox.innerHTML = "";
      const info = document.createElement("div");
      info.className = "pdf-info";
      info.innerHTML = `
        <div class="pdf-icon">📄</div>
        <div class="pdf-meta">
          <div class="pdf-name">${file.name}</div>
          <div class="pdf-size">${(file.size / 1024).toFixed(1)} KB</div>
        </div>
      `;
      previewBox.appendChild(info);

      // Try to encode the PDF data URL directly into the QR.
      // NOTE: QR codes have strict capacity limits; small PDFs will work best.
      createQR(dataUrl);
    };

    reader.onerror = () => {
      alert("Something went wrong while reading the PDF file.");
    };

    reader.readAsDataURL(file);
  }

  function handleUrlGenerate() {
    const url = (urlInput.value || "").trim();
    if (!url) {
      alert("Please paste a link to your PDF.");
      return;
    }
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Only http/https URLs are allowed.");
      }
    } catch (e) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    // Simple preview using the URL
    previewBox.innerHTML = "";
    const info = document.createElement("div");
    info.className = "pdf-info";
    info.innerHTML = `
      <div class="pdf-icon">🔗</div>
      <div class="pdf-meta">
        <div class="pdf-name">Linked PDF</div>
        <div class="pdf-size">${url}</div>
      </div>
    `;
    previewBox.appendChild(info);

    // For URLs, QR payload is just the URL string (very small and reliable)
    lastDataUrl = url;
    createQR(url);
  }

  // File input change
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    handleFile(file);
  });

  // Drag & drop
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove("drag-over");
    });
  });

  uploadArea.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (!dt || !dt.files || !dt.files.length) return;
    const file = dt.files[0];
    handleFile(file);
  });

  // URL generate button
  if (urlGenerateBtn) {
    urlGenerateBtn.addEventListener("click", handleUrlGenerate);
  }

  // Download QR as PNG
  downloadBtn.addEventListener("click", () => {
    const canvas = qrContainer.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "image-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  // Initial
  resetPreview();
  resetQR();
});


