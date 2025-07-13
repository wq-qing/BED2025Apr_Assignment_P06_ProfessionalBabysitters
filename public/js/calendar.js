// calendar.js

function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3400);
}

document.addEventListener("DOMContentLoaded", async () => {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  const selectDate = document.getElementById("selectDate");
  const toStep2 = document.getElementById("toStep2");

  const backToStep1 = document.getElementById("backToStep1");
  const timeSlots = document.getElementById("timeSlots");

  const backToStep2 = document.getElementById("backToStep2");
  const confirmationDetails = document.getElementById("confirmationDetails");
  const doctorSelect = document.getElementById("doctor");
  const confirmBtn = document.getElementById("confirmBtn");

  const sumDoctor = document.getElementById("sumDoctor");
  const sumDate = document.getElementById("sumDate");
  const sumTime = document.getElementById("sumTime");
  const changeTimingBtn = document.getElementById("changeTimingBtn");
  const backToStep4 = document.getElementById("backToStep2From4");

  const viewAppointmentsBtn = document.getElementById("viewAppointmentsBtn");

  let selectedDate = "", selectedTime = "";

  const todayStr = new Date().toISOString().split("T")[0];
  selectDate.min = todayStr;
  selectDate.addEventListener("change", () => {
    if (selectDate.value < todayStr) {
      showToast(`Please select ${todayStr} onwards`);
      selectDate.value = todayStr;
    }
    toStep2.disabled = !selectDate.value;
  });

  // ✅ [Fix] Check if DB still has an appointment before allowing booking
  try {
    const res = await fetch("http://localhost:4000/api/appointments");
    if (res.ok) {
      localStorage.setItem("hasAppointment", "true");
    } else {
      localStorage.removeItem("hasAppointment");
    }
  } catch {
    localStorage.removeItem("hasAppointment");
  }

  toStep2.addEventListener("click", () => {
    if (localStorage.getItem("hasAppointment") === "true") {
      showToast("You already have an existing appointment.");
      return;
    }

    selectedDate = selectDate.value;
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    generateTimeSlots();
  });

  backToStep1.addEventListener("click", () => {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
  });

  function generateTimeSlots() {
    timeSlots.innerHTML = "";

    const now = new Date();
    if (selectedDate === todayStr && now.getHours() >= 18) {
      showToast("Clinic Has Closed, Please Book Tomorrow Time Slot");
      return;
    }

    const start = 9, end = 18, lunch = 12;
    const cutoff = new Date(now.getTime() + 15 * 60 * 1000);

    for (let h = start; h < end; h++) {
      if (h === lunch) continue;
      for (let m = 0; m < 60; m += 15) {
        const mm = String(m).padStart(2, "0");
        const slotDt = new Date(`${selectedDate}T${String(h).padStart(2, "0")}:${mm}:00`);
        const isPast = selectedDate === todayStr && slotDt < cutoff;

        const btn = document.createElement("button");
        const hour12 = h % 12 || 12;
        const suf = h < 12 ? "am" : "pm";
        btn.textContent = `${hour12}:${mm} ${suf}`;
        if (isPast) btn.classList.add("past");

        btn.addEventListener("click", () => {
          if (isPast) {
            let next = new Date(cutoff);
            const Q = 15 * 60 * 1000;
            next = new Date(Math.ceil(next.getTime() / Q) * Q);
            const nh = next.getHours() % 12 || 12;
            const nm = String(next.getMinutes()).padStart(2, "0");
            const ns = next.getHours() < 12 ? "am" : "pm";
            showToast(`Please select ${nh}:${nm} ${ns} onwards`);
            return;
          }

          if (localStorage.getItem("hasAppointment") === "true") {
            showToast("You already have an existing appointment.");
            return;
          }

          selectedTime = btn.textContent;
          step2.classList.add("hidden");
          step3.classList.remove("hidden");
          confirmationDetails.textContent =
            `Your appointment is on ${selectedDate} at ${selectedTime}`;
        });

        timeSlots.appendChild(btn);
      }
    }
  }

  backToStep2.addEventListener("click", () => {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  confirmBtn.addEventListener("click", async () => {
    const doctor = doctorSelect.value;
    const dObj = new Date(selectedDate);
    const full = dObj.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });

    const [tp, suf] = selectedTime.split(" ");
    let [h12, mn] = tp.split(":");
    h12 = parseInt(h12, 10);
    const h24 = suf === "pm" ? (h12 % 12) + 12 : h12 % 12;
    const startDt = new Date(`${selectedDate}T${String(h24).padStart(2, "0")}:${mn}:00`);
    const endDt = new Date(startDt.getTime() + 14 * 60000);

    try {
      const res = await fetch("http://localhost:4000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          startTime: startDt.toISOString().split("T")[1].slice(0, 8),
          endTime: endDt.toISOString().split("T")[1].slice(0, 8),
          doctor
        })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const { id } = await res.json();
      showToast(`Saved (ID ${id})`);
      localStorage.setItem("hasAppointment", "true");
    } catch (err) {
      console.error(err);
      showToast("Failed to save appointment");
      return;
    }

    displaySummary(doctor, startDt, endDt);
  });

  function displaySummary(doctor, startDt, endDt) {
    const fmt = dt => {
      let h = dt.getHours() % 12 || 12, m = dt.getMinutes();
      const s = dt.getHours() < 12 ? "am" : "pm";
      return m === 0 ? `${h}${s}` : `${h}:${String(m).padStart(2, "0")}${s}`;
    };

    const fullDate = startDt.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });

    sumDoctor.textContent = doctor;
    sumDate.textContent = fullDate;
    sumTime.textContent = `${fmt(startDt)} - ${fmt(endDt)}`;

    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    step4.classList.remove("hidden");
  }

  viewAppointmentsBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("http://localhost:4000/api/appointments");
      if (!res.ok) throw new Error("Failed to load appointment");
      const appt = await res.json();

      const doctor = appt.Doctor;
      const date = appt.Date;
      const cleanTime = t => t.slice(0, 8);
      const startDt = new Date(`${date}T${cleanTime(appt.StartTime)}`);
      const endDt = new Date(`${date}T${cleanTime(appt.EndTime)}`);

      displaySummary(doctor, startDt, endDt);
    } catch (err) {
      console.error(err);
      showToast("No appointment found or failed to load");
    }
  });

  changeTimingBtn.addEventListener("click", () => {
    step4.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  backToStep4.addEventListener("click", () => {
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });
});
