// public/js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  const container   = document.getElementById("profileContainer");
  const toggleBtn   = document.getElementById("toggleEditBtn");
  const saveBtn     = document.getElementById("saveBtn");
  const cancelBtn   = document.getElementById("cancelBtn");

  const nameInput   = document.getElementById("nameInput");
  const nameDisplay = document.getElementById("nameDisplay");
  const emailInput  = document.getElementById("emailInput");
  const emailDisplay = document.getElementById("emailDisplay");
  const roleInput   = document.getElementById("roleInput");
  const roleDisplay = document.getElementById("roleDisplay");
  
  // Switch between view/edit
  toggleBtn.addEventListener("click", () => {
    container.classList.add("editing");
  });
  cancelBtn.addEventListener("click", () => {
    container.classList.remove("editing");
  });

  // Save changes
  saveBtn.addEventListener("click", async () => {
    const userID = sessionStorage.getItem("userID");
    if (!userID) return alert("Not logged in!");

    // Send update to backend (optional, you can add API endpoint)
    try {
      const res = await fetch(`/api/profile/${userID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: nameInput.value,
          Email: emailInput.value,
          Role: roleInput.value,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      // Update UI
      nameDisplay.textContent = nameInput.value;
      emailDisplay.textContent = emailInput.value;
      roleDisplay.textContent = roleInput.value;
      container.classList.remove("editing");
      alert("Profile updated!");
    } catch (err) {
      alert("Error updating profile");
    }
  });

  // Load profile info
  async function loadProfile() {
    const userID = sessionStorage.getItem("userID");
    if (!userID) {
      alert("Please log in!");
      window.location.href = "/";
      return;
    }
    try {
      const res = await fetch(`/api/profile/${userID}`);
      if (!res.ok) throw new Error("Failed to load profile");

      const p = await res.json();
      nameDisplay.textContent  = p.Name || "";
      emailDisplay.textContent = p.Email || "";
      roleDisplay.textContent  = p.Role || "";

      nameInput.value  = p.Name || "";
      emailInput.value = p.Email || "";
      roleInput.value  = p.Role || "";
    } catch (err) {
      alert("Error loading profile");
    }
  }

  loadProfile();
});
