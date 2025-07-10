// Shared across all pages
const page = location.pathname;

if (page.includes("index.html")) {
  const dateInput = document.getElementById("selectDate");
  const nextBtn = document.getElementById("nextToTime");

  dateInput.addEventListener("change", () => {
    nextBtn.disabled = !dateInput.value;
  });

  nextBtn.addEventListener("click", () => {
    localStorage.setItem("selectedDate", dateInput.value);
    location.href = "time.html";
  });
}

if (page.includes("time.html")) {
  const container = document.getElementById("timeSlots");
  const date = localStorage.getItem("selectedDate");
  if (!date) location.href = "index.html";

  function generateSlots() {
    const start = 9;
    const end = 18;
    const skip = [12];
    for (let h = start; h < end; h++) {
      if (skip.includes(h)) continue;
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, "0");
        const min = m.toString().padStart(2, "0");
        const timeStr = `${hour}:${min}`;
        const btn = document.createElement("button");
        btn.textContent = timeStr;
        btn.onclick = () => {
          localStorage.setItem("selectedTime", timeStr);
          location.href = "confirm.html";
        };
        container.appendChild(btn);
      }
    }
  }
  generateSlots();
}

if (page.includes("confirm.html")) {
  const date = localStorage.getItem("selectedDate");
  const time = localStorage.getItem("selectedTime");
  const doctorSelect = document.getElementById("doctor");
  const details = document.getElementById("confirmationDetails");

  if (!date || !time) location.href = "index.html";

  details.textContent = `Your appointment is on ${date} at ${time}`;

  document.getElementById("confirmBtn").addEventListener("click", () => {
    const doctor = doctorSelect.value;
    alert(`Appointment confirmed with ${doctor} on ${date} at ${time}`);
    localStorage.clear();
    location.href = "index.html";
  });
}
