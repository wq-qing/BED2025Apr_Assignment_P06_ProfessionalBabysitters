document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#remindersTable tbody");
  const editModal = document.getElementById("editReminderModal");
  const createModal = document.getElementById("createReminderModal");
  const editForm = document.getElementById("editReminderForm");
  const createForm = document.getElementById("createReminderForm");
  const closeButtons = document.querySelectorAll(".modal .close");
  const addBtn = document.getElementById("addReminderBtn");

  // show/hide modals
  function openModal(m) {
    if (m) m.style.display = "flex";
  }
  function closeModals() {
    document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
  }
  closeButtons.forEach((btn) => btn.addEventListener("click", closeModals));
  window.addEventListener("click", (e) => e.target.classList.contains("modal") && closeModals());

  // Utils
  function formatTime(t) {
    if (!t) return "";
    let [h, m] = t.split(":").map((x) => +x);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function timeTo24(str) {
    if (!str) return "";
    let [t, ampm] = str.split(" ");
    let [h, m] = t.split(":").map((x) => +x);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  // Toast / inline messages
  function showToast(msg, isError = false) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => t.classList.remove("show"), 3000);
    setTimeout(() => t.remove(), 3400);
    if (isError) {
      t.style.background = "#d9534f";
      t.style.color = "white";
    } else {
      t.style.background = "#5cb85c";
      t.style.color = "white";
    }
  }
  function showUserNotFoundMessage() {
    if (document.getElementById("userNotFoundMsg")) return;
    const msg = document.createElement("div");
    msg.id = "userNotFoundMsg";
    msg.style.background = "#fde2e2";
    msg.style.border = "1px solid #d9534f";
    msg.style.padding = "10px";
    msg.style.marginTop = "10px";
    msg.style.borderRadius = "4px";
    msg.textContent = "User not present. Please register or use a valid user.";
    tableBody.closest(".container")?.prepend(msg);
  }
  function showDoctorBlockedMessage() {
    if (document.getElementById("doctorBlockedMsg")) return;
    const msg = document.createElement("div");
    msg.id = "doctorBlockedMsg";
    msg.style.background = "#fde2e2";
    msg.style.border = "1px solid #d9534f";
    msg.style.padding = "10px";
    msg.style.marginTop = "10px";
    msg.style.borderRadius = "4px";
    msg.textContent = "Doctors are not allowed to manage reminders.";
    tableBody.closest(".container")?.prepend(msg);
  }

  // Load reminders for current session userID
  async function loadReminders() {
    const userID = sessionStorage.getItem("userID");
    const container = tableBody;

    if (!userID) {
      container.innerHTML = `<tr><td colspan="5">User not logged in.</td></tr>`;
      return;
    }

    if (userID.startsWith("D")) {
      container.innerHTML = `<tr><td colspan="5">Doctors are not allowed.</td></tr>`;
      showDoctorBlockedMessage();
      return;
    }

    try {
      const res = await fetch(`/api/reminders/${encodeURIComponent(userID)}`);
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      // user not present case from API
      if (!res.ok && data && data.error && data.error.toLowerCase().includes("user")) {
        showToast("User not present", true);
        showUserNotFoundMessage();
        container.innerHTML = `<tr><td colspan="5">User not present.</td></tr>`;
        return;
      }

      if (!res.ok) {
        throw new Error(text || "Failed to fetch");
      }

      const reminders = Array.isArray(data) ? data : [];

      if (!reminders.length) {
        container.innerHTML = `<tr><td colspan="5">No reminders found.</td></tr>`;
        document.getElementById("userNotFoundMsg")?.remove();
        return;
      }


      container.innerHTML = ""; // clear

      reminders.forEach((r) => {
        const row = document.createElement("tr");
        row.dataset.id = r.ReminderID;
        row.innerHTML = `
          <td>${r.MedName}</td>
          <td>${r.MedDosage}</td>
          <td>${formatTime(r.ReminderTime)}</td>
          <td>${r.Frequency}</td>
          <td>
            <button class="btn edit-reminder-btn">Edit</button>
            <button class="btn btn-danger delete-reminder-btn">Delete</button>
          </td>`;
        container.appendChild(row);
      });

      bindEdit();
      bindDelete();
    } catch (err) {
      console.error("Reminder fetch failed:", err);
      container.innerHTML = `<tr><td colspan="5">Error loading reminders.</td></tr>`;
    }
  }

  // Editing
  function bindEdit() {
    document.querySelectorAll(".edit-reminder-btn").forEach((btn) => {
      btn.onclick = () => {
        const row = btn.closest("tr");
        const [name, dosage, time, freq] = [...row.children].slice(0, 4).map((td) => td.textContent);
        if (!editForm) return;
        editForm.editMedName.value = name;
        editForm.editDosage.value = dosage;
        editForm.editTime.value = timeTo24(time);
        editForm.editFrequency.value = freq;
        editForm.dataset.id = row.dataset.id;
        openModal(editModal);
      };
    });
  }

  // Deleting
  function bindDelete() {
    document.querySelectorAll(".delete-reminder-btn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Delete this reminder?")) return;
        const id = btn.closest("tr")?.dataset.id;
        const userID = sessionStorage.getItem("userID");
        if (!id) return;
        if (!userID) {
          alert("User not logged in.");
          return;
        }
        if (userID.startsWith("D")) {
          showToast("Doctors are not allowed.", true);
          showDoctorBlockedMessage();
          return;
        }
        const res = await fetch(`/api/reminders/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("Delete failed:", text);
          if (res.status === 404 && text.toLowerCase().includes("user")) {
            showToast("User not present", true);
            showUserNotFoundMessage();
          }
        }
        await loadReminders();
      };
    });
  }

  // Add new reminder button
  addBtn.onclick = () => {
    if (!createForm) return;
    createForm.reset();
    openModal(createModal);
  };

  // Submit handlers with logging for debugging
  if (createForm) {
    createForm.onsubmit = async (e) => {
      e.preventDefault();
      console.log("Create form submitted");
      const userID = sessionStorage.getItem("userID");
      if (!userID) {
        alert("User not logged in.");
        return;
      }
      if (userID.startsWith("D")) {
        showToast("Doctors are not allowed.", true);
        showDoctorBlockedMessage();
        return;
      }

      const payload = {
        userID: userID,
        MedName: createForm.createMedName.value.trim(),
        MedDosage: createForm.createDosage.value.trim(),
        ReminderTime: createForm.createTime.value,
        Frequency: createForm.createFrequency.value,
      };

      try {
        const res = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        if (res.ok) {
          closeModals();
          await loadReminders();
        } else {
          console.error("Create failed:", text);
          if (res.status === 404 && data && data.error && data.error.toLowerCase().includes("user")) {
            showToast("User not present", true);
            showUserNotFoundMessage();
          }
        }
      } catch (err) {
        console.error("Create error:", err);
      }
    };
  } else {
    console.error("createForm element missing");
  }

  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      console.log("Edit form submitted");
      const userID = sessionStorage.getItem("userID");
      if (!userID) {
        alert("User not logged in.");
        return;
      }
      if (userID.startsWith("D")) {
        showToast("Doctors are not allowed.", true);
        showDoctorBlockedMessage();
        return;
      }
      const id = editForm.dataset.id;
      if (!id) {
        console.error("No reminder ID on edit form");
        return;
      }

      const payload = {
        userID: userID,
        MedName: editForm.editMedName.value.trim(),
        MedDosage: editForm.editDosage.value.trim(),
        ReminderTime: editForm.editTime.value,
        Frequency: editForm.editFrequency.value,
      };

      try {
        const res = await fetch(`/api/reminders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }

        if (res.ok) {
          closeModals();
          await loadReminders();
        } else {
          console.error("Update failed:", text);
          if (res.status === 404 && data && data.error && data.error.toLowerCase().includes("user")) {
            showToast("User not present", true);
            showUserNotFoundMessage();
          }
        }
      } catch (err) {
        console.error("Update error:", err);
      }
    };
  } else {
    console.error("editForm element missing");
  }

  // initial load
  loadReminders();
});
