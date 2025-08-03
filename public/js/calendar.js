
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3400);
}

// ── Helpers to convert between 24h and 12h formats ───────────────
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
    hours = String(parseInt(hours, 10) + 12);
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }
  return `${hours.padStart(2, "0")}:${minutes}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  // ── Cache DOM nodes ───────────────────────────────────────────────
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  const selectDate = document.getElementById("selectDate");
  const toStep2     = document.getElementById("toStep2");

  const backToStep1 = document.getElementById("backToStep1");
  const timeSlots   = document.getElementById("timeSlots");

  const backToStep2         = document.getElementById("backToStep2");
  const confirmationDetails = document.getElementById("confirmationDetails");
  // note: doctorSelect can be removed if no longer used in HTML
  const doctorSelect        = document.getElementById("doctor");
  const confirmBtn          = document.getElementById("confirmBtn");

  const sumDoctor          = document.getElementById("sumDoctor");
  const sumDate            = document.getElementById("sumDate");
  const sumTime            = document.getElementById("sumTime");
  const changeTimingBtn    = document.getElementById("changeTimingBtn");
  const changeDateBtn      = document.getElementById("changeDateBtn");
  const deleteBtn          = document.getElementById("deleteAppointmentBtn");
  const backToStep4        = document.getElementById("backToStep2From4");
  const viewAppointmentsBtn = document.getElementById("viewAppointmentsBtn");

  let selectedDate   = "";
  let selectedTime   = "";
  let appointmentId  = null;
  let selectedDoctorName = null;

  // ── Setup custom doctor‑picker ───────────────────────────────────
  confirmBtn.disabled = true;  // start disabled until doctor is chosen
  const doctorList = document.getElementById("doctorList");
  doctorList.querySelectorAll(".doctor-option").forEach(el => {
    el.addEventListener("click", () => {
      // clear previous selection
      doctorList.querySelectorAll(".doctor-option")
        .forEach(e => e.classList.remove("selected"));
      // mark this one
      el.classList.add("selected");
      // store its name
      selectedDoctorName = el.dataset.name;
      // enable Confirm
      confirmBtn.disabled = false;
    });
  });

  // ── Prevent past dates ────────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  selectDate.min = todayStr;
  selectDate.addEventListener("change", () => {
    if (selectDate.value < todayStr) {
      showToast(`Please select ${todayStr} onwards`);
      selectDate.value = todayStr;
    }
    toStep2.disabled = !selectDate.value;
  });

  // ── On load: check if there's already an appointment in DB ─────────
  try {
    const res = await fetch("http://localhost:3000/api/appointments");
    if (res.ok) localStorage.setItem("hasAppointment", "true");
    else       localStorage.removeItem("hasAppointment");
  } catch {
    localStorage.removeItem("hasAppointment");
  }

  // ── Step 1 → Step 2 ──────────────────────────────────────────────
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

  // ── Generate 15‑min time buttons ──────────────────────────────────
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
        const time24 = `${String(h).padStart(2,"0")}:${mm}`;
        const btn = document.createElement("button");
        btn.textContent = formatTime(time24);
        const slotDt = new Date(`${selectedDate}T${time24}:00`);
        if (selectedDate === todayStr && slotDt < cutoff) {
          btn.classList.add("past");
        }
        btn.addEventListener("click", () => {
          if (selectedDate === todayStr && slotDt < cutoff) {
            let next = new Date(cutoff);
            const Q = 15 * 60 * 1000;
            next = new Date(Math.ceil(next.getTime()/Q)*Q);
            const nh = String(next.getHours()).padStart(2,"0");
            const nm = String(next.getMinutes()).padStart(2,"0");
            showToast(`Please select ${formatTime(`${nh}:${nm}`)} onwards`);
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

  // ── Step 2 → Step 3 ──────────────────────────────────────────────
  backToStep2.addEventListener("click", () => {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  // ── Step 3 → Create or Update + Summary ─────────────────────────
  confirmBtn.addEventListener("click", async () => {
    const doctor = selectedDoctorName;  // use your new picker
    const time24 = convertTo24h(selectedTime);
    const [h24, mn] = time24.split(":");
    const startDt = new Date(`${selectedDate}T${h24}:${mn}:00`);
    const endDt   = new Date(startDt.getTime() + 14*60000);
    const hhmm = dt => dt.toTimeString().slice(0,5); // HH:MM

    try {
      let url, method;
      if (appointmentId) {
        // UPDATE existing
        url = `http://localhost:3000/api/appointments/${appointmentId}`;
        method = "PUT";
      } else {
        // CREATE new
        url = "http://localhost:3000/api/appointments";
        method = "POST";
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          date:      selectedDate,
          startTime: hhmm(startDt),
          endTime:   hhmm(endDt),
          doctor
        })
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (!appointmentId) appointmentId = data.id;
      showToast(method === "POST"
        ? `Saved (ID ${data.id})`
        : "Appointment updated"
      );
      localStorage.setItem("hasAppointment", "true");
    } catch (err) {
      console.error(err);
      showToast("Failed to save appointment");
      return;
    }
    displaySummary(doctor, startDt, endDt);
  });

  // ── Render summary ───────────────────────────────────────────────
  function displaySummary(doctor, startDt, endDt) {
    const fmt12 = dt => formatTime(
      `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
    );
    sumDoctor.textContent = doctor;
    sumDate.textContent   = startDt.toLocaleDateString("en-US", {
      weekday:"long", month:"long", day:"numeric", year:"numeric"
    });
    sumTime.textContent   = `${fmt12(startDt)} - ${fmt12(endDt)}`;
    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    step4.classList.remove("hidden");
  }

  // ── View (GET) + Summary ─────────────────────────────────────────
  viewAppointmentsBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("http://localhost:3000/api/appointments");
      if (!res.ok) throw new Error("No appointment");
      const appt = await res.json();
      appointmentId = appt.AppointmentID;
      const isoDate = appt.Date.split("T")[0];
      const clean   = t => t.split(".")[0];
      const startStr= clean(appt.StartTime);
      const endStr  = clean(appt.EndTime);
      const startDt = new Date(`${isoDate}T${startStr}`);
      const endDt   = new Date(`${isoDate}T${endStr}`);
      if (isNaN(startDt) || isNaN(endDt)) {
        showToast("Invalid time format from server.");
        return;
      }
      // set the picker to match the fetched doctor
      selectedDoctorName = appt.Doctor;
      doctorList.querySelectorAll(".doctor-option").forEach(el => {
        el.classList.toggle("selected", el.dataset.name === selectedDoctorName);
      });
      confirmBtn.disabled = false;
      displaySummary(appt.Doctor, startDt, endDt);
    } catch (err) {
      console.error(err);
      showToast("No appointment found or made");
    }
  });

  // ── Delete (DELETE) ───────────────────────────────────────────────
  deleteBtn.addEventListener("click", async () => {
    if (!appointmentId) {
      showToast("No appointment to delete");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/appointments/${appointmentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      showToast("Appointment deleted");
      localStorage.removeItem("hasAppointment");
      appointmentId = null;
      step4.classList.add("hidden");
      step1.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete appointment");
    }
  });

  // ── Change Timing & Date & Back Handlers ─────────────────────────
  changeTimingBtn.addEventListener("click", () => {
    localStorage.removeItem("hasAppointment");
    step4.classList.add("hidden");
    step2.classList.remove("hidden");
  });
  changeDateBtn.addEventListener("click", () => {
    localStorage.removeItem("hasAppointment");
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });
  backToStep4.addEventListener("click", () => {
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });

});