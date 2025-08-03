// public/js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  const container       = document.getElementById("profileContainer");
  const toggleBtn       = document.getElementById("toggleEditBtn");
  const saveBtn         = document.getElementById("saveBtn");
  const cancelBtn       = document.getElementById("cancelBtn");

  const nameInput       = document.getElementById("nameInput");
  const nameDisplay     = document.getElementById("nameDisplay");
  const usernameInput   = document.getElementById("usernameInput");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const emailInput      = document.getElementById("emailInput");
  const emailDisplay    = document.getElementById("emailDisplay");
  const phoneInput      = document.getElementById("phoneInput");
  const phoneDisplay    = document.getElementById("phoneDisplay");

  toggleBtn.addEventListener("click", () => {
    container.classList.add("editing");
  });
  cancelBtn.addEventListener("click", () => {
    container.classList.remove("editing");
  });

  saveBtn.addEventListener("click", () => {
    nameDisplay.textContent     = nameInput.value;
    usernameDisplay.textContent = usernameInput.value;
    emailDisplay.textContent    = emailInput.value;
    phoneDisplay.textContent    = phoneInput.value;
    container.classList.remove("editing");
    alert("Profile updated!");
  });

  async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) return console.warn("No auth token");
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to load profile", res.status);
        return;
      }
      const p = await res.json();
      nameDisplay.textContent     = p.Name || "";
      usernameDisplay.textContent = p.Username || "";
      emailDisplay.textContent    = p.Email || "";
      // phone not in your current schema; left blank unless you store it elsewhere
      phoneDisplay.textContent    = p.Phone || "-";

      nameInput.value     = p.Name || "";
      usernameInput.value = p.Username || "";
      emailInput.value    = p.Email || "";
      phoneInput.value    = p.Phone || "";
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }

  loadProfile();
});
