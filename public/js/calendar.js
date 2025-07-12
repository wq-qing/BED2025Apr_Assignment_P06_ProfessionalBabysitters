// calendar.js

// --- Toast helper (3-second fade) ---
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => t.classList.remove("show"), 3000);
  setTimeout(() => t.remove(), 3400);
}

document.addEventListener("DOMContentLoaded", () => {
  // Step containers
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  // Step 1 elements
  const selectDate = document.getElementById("selectDate");
  const toStep2    = document.getElementById("toStep2");

  // Step 2 elements
  const backToStep1 = document.getElementById("backToStep1");
  const timeSlots   = document.getElementById("timeSlots");

  // Step 3 elements
  const backToStep2         = document.getElementById("backToStep2");
  const confirmationDetails = document.getElementById("confirmationDetails");
  const doctorSelect        = document.getElementById("doctor");
  const confirmBtn          = document.getElementById("confirmBtn");

  // Step 4 elements
  const sumDoctor        = document.getElementById("sumDoctor");
  const sumDate          = document.getElementById("sumDate");
  const sumTime          = document.getElementById("sumTime");
  const changeTimingBtn  = document.getElementById("changeTimingBtn");
  const backToStep4      = document.getElementById("backToStep2From4");

  let selectedDate = "", selectedTime = "";

  // Prevent past date and show toast
  const todayStr = new Date().toISOString().split("T")[0];
  selectDate.min = todayStr;
  selectDate.addEventListener("change", () => {
    if (selectDate.value < todayStr) {
      showToast(`Please select ${todayStr} onwards`);
      selectDate.value = todayStr;
    }
    toStep2.disabled = !selectDate.value;
  });

  // Step1 → Step2
  toStep2.addEventListener("click", () => {
    selectedDate = selectDate.value;
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    generateTimeSlots();
  });
  backToStep1.addEventListener("click", () => {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
  });

  // Build time slots with clinic-closed check & 15-minute lead-time blocking
  function generateTimeSlots() {
    timeSlots.innerHTML = "";

    const now = new Date();
    // If it's today and after 6pm, show closed message and bail
    if (selectedDate === todayStr && now.getHours() >= 18) {
      showToast("Clinic Has Closed, Please Book Tomorrow Time Slot");
      return;
    }

    const start  = 9, end = 18, lunch = 12;
    const cutoff = new Date(now.getTime() + 15 * 60 * 1000);

    for (let h = start; h < end; h++) {
      if (h === lunch) continue;
      for (let m = 0; m < 60; m += 15) {
        const mm     = String(m).padStart(2, "0");
        const slotDt = new Date(`${selectedDate}T${String(h).padStart(2,"0")}:${mm}:00`);
        const isPast = selectedDate === todayStr && slotDt < cutoff;

        const btn = document.createElement("button");
        const hour12 = h % 12 || 12;
        const suf    = h < 12 ? "am" : "pm";
        btn.textContent = `${hour12}:${mm} ${suf}`;
        if (isPast) btn.classList.add("past");

        btn.addEventListener("click", () => {
          if (isPast) {
            // compute next valid slot
            let next = new Date(cutoff);
            const Q = 15 * 60 * 1000;
            next = new Date(Math.ceil(next.getTime() / Q) * Q);
            const nh = next.getHours() % 12 || 12;
            const nm = String(next.getMinutes()).padStart(2, "0");
            const ns = next.getHours() < 12 ? "am" : "pm";
            showToast(`Please select ${nh}:${nm} ${ns} onwards`);
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

  // Step2 → Step3
  backToStep2.addEventListener("click", () => {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
  });
  confirmBtn.addEventListener("click", () => {
    const doctor = doctorSelect.value;
    const dObj   = new Date(selectedDate);
    const full   = dObj.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });

    // compute end time (+14min)
    const [tp, suf] = selectedTime.split(" ");
    let [h12, mn]   = tp.split(":");
    h12 = parseInt(h12,10);
    const h24 = suf === "pm" ? (h12 % 12) + 12 : h12 % 12;
    const startDt = new Date(`${selectedDate}T${String(h24).padStart(2,"0")}:${mn}:00`);
    const endDt   = new Date(startDt.getTime() + 14 * 60000);
    const fmt = dt => {
      let h = dt.getHours() % 12 || 12, m = dt.getMinutes();
      const s = dt.getHours() < 12 ? "am" : "pm";
      return m === 0 ? `${h}${s}` : `${h}:${String(m).padStart(2,"0")}${s}`;
    };

    sumDoctor.textContent = doctor;
    sumDate.textContent   = full;
    sumTime.textContent   = `${fmt(startDt)} - ${fmt(endDt)}`;

    step3.classList.add("hidden");
    step4.classList.remove("hidden");
  });

  // Step4 buttons
  changeTimingBtn.addEventListener("click", () => {
    step4.classList.add("hidden");
    step2.classList.remove("hidden");
  });
  backToStep4.addEventListener("click", () => {
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });
});
