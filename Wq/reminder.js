document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.querySelector("#remindersTable tbody");
  const editModal = document.getElementById('editReminderModal');
  const editForm = document.getElementById('editReminderForm');
  const closeButton = editModal?.querySelector('.close');

  try {
    const res = await fetch("http://localhost:3000/api/reminders");
    const data = await res.json();

    tableBody.innerHTML = "";

    data.forEach(reminder => {
      const row = document.createElement("tr");
      row.setAttribute("data-id", reminder.ReminderID);
      row.innerHTML = `
        <td>${reminder.MedName.trim()}</td>
        <td>${reminder.MedDosage.trim()}</td>
        <td>${formatTime(reminder.ReminderTime)}</td>
        <td>${reminder.Frequency || 'N/A'}</td>
        <td>
          <button class="btn edit-reminder-btn">Edit</button>
          <button class="btn btn-danger delete-reminder-btn">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    bindEditButtons();
    bindDeleteButtons();
  } catch (err) {
    console.error("Failed to load reminders:", err);
  }

  function formatTime(time24h) {
    const [hourStr, minuteStr] = time24h.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minuteStr} ${ampm}`;
  }

  function convertTo24h(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    if (modifier === "PM" && hours !== "12") {
      hours = String(parseInt(hours) + 12);
    }
    if (modifier === "AM" && hours === "12") {
      hours = "00";
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  function bindEditButtons() {
    const editButtons = document.querySelectorAll('.edit-reminder-btn');

    editButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const cells = row.querySelectorAll('td');

        document.getElementById('editMedName').value = cells[0].textContent.trim();
        document.getElementById('editDosage').value = cells[1].textContent.trim();
        document.getElementById('editTime').value = convertTo24h(cells[2].textContent.trim());
        document.getElementById('editFrequency').value = cells[3].textContent.trim().toLowerCase();

        editForm.setAttribute("data-reminder-id", row.getAttribute("data-id"));
        editModal.style.display = 'flex';
      });
    });

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        editModal.style.display = 'none';
      });
    }

    window.addEventListener('click', e => {
      if (e.target === editModal) {
        editModal.style.display = 'none';
      }
    });

    if (editForm) {
      editForm.addEventListener('submit', async e => {
        e.preventDefault();
        const id = editForm.getAttribute("data-reminder-id");

        const updatedReminder = {
          MedName: document.getElementById("editMedName").value.trim(),
          MedDosage: document.getElementById("editDosage").value.trim(),
          ReminderTime: document.getElementById("editTime").value,
          Frequency: document.getElementById("editFrequency").value
        };

        try {
          const res = await fetch(`http://localhost:3000/api/reminders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedReminder)
          });

          if (res.ok) {
            alert("Reminder updated successfully!");
            location.reload();
          } else {
            alert("Failed to update reminder.");
          }
        } catch (err) {
          console.error("Update failed:", err);
        }

        editModal.style.display = 'none';
      });
    }
  }

  function bindDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".delete-reminder-btn");

    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async () => {
        const row = btn.closest("tr");
        const id = row.getAttribute("data-id");

        if (!id) {
          console.error("Missing data-id for delete.");
          alert("Failed to find reminder ID.");
          return;
        }

        const confirmDelete = confirm("Are you sure you want to delete this reminder?");
        if (!confirmDelete) return;

        try {
          const res = await fetch(`http://localhost:3000/api/reminders/${id}`, {
            method: "DELETE"
          });

          if (res.ok) {
            alert("Reminder deleted successfully!");
            row.remove();
          } else {
            alert("Failed to delete reminder.");
          }
        } catch (err) {
          console.error("Delete failed:", err);
          alert("Error deleting reminder.");
        }
      });
    });
  }
});
