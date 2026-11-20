/*
  IMPORTANT: Replace the URL below with your deployed Google Apps Script Web App URL.
  Deploy Apps Script as: Execute as Me | Who has access: Anyone.
*/
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHGKorM040u00_9oFSVe7dGO5bNhkyvBvBd2NR3SvDHcF0pdMiROxWC6diPoJ2g_eDiA/exec";
const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("formMessage");

document.querySelectorAll('input[type="file"]').forEach(input => {
  input.addEventListener("change", () => {
    const label = input.closest(".upload-box").querySelector(".file-name");
    label.textContent = input.files[0] ? input.files[0].name : "Choose file";
  });
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = `form-message show ${type}`;
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  if (!GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/macros/s/")) {
    showMessage("Setup required: add your deployed Google Apps Script Web App URL in script.js.", "error");
    return;
  }

  const photo = form.elements.photo.files[0];
  const signature = form.elements.signature.files[0];
  if (!photo || !signature) return showMessage("Please select both photograph and signature.", "error");
  if (photo.size > 2 * 1024 * 1024) return showMessage("Photograph must be 2 MB or smaller.", "error");
  if (signature.size > 1 * 1024 * 1024) return showMessage("Signature must be 1 MB or smaller.", "error");
  if (!["image/jpeg", "image/png"].includes(photo.type) || !["image/jpeg", "image/png"].includes(signature.type)) {
    return showMessage("Only JPG, JPEG and PNG image files are accepted.", "error");
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";
  showMessage("Preparing your registration. Please keep this page open.", "success");

  try {
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.photo; delete data.signature; delete data.consent;
    data.photo = {name: photo.name, mimeType: photo.type, base64: await fileToBase64(photo)};
    data.signature = {name: signature.name, mimeType: signature.type, base64: await fileToBase64(signature)};
    data.consent = true;
    data.clientSubmittedAt = new Date().toISOString();

    /*
      Apps Script web apps do not provide a dependable browser-readable CORS response
      to GitHub Pages. text/plain avoids a preflight; no-cors sends the request but
      intentionally makes the response opaque. The backend records the submission.
    */
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify(data)
    });

    form.reset();
    document.querySelectorAll(".file-name").forEach(el => el.textContent = "Choose file");
    showMessage("Your submission request has been sent. Please contact Nootech Computer Centre at +91-9853895452 to confirm that your registration was received.", "success");
  } catch (error) {
    showMessage(`Submission could not be sent: ${error.message}. Please try again or contact the centre.`, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit Registration <span>→</span>';
  }
});
