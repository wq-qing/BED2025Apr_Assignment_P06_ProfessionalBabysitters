// --- Toast helper ---
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  // fade in
  requestAnimationFrame(() => t.classList.add("show"));
  // fade out after 3s
  setTimeout(() => t.classList.remove("show"), 3000);
  // remove from DOM after transition
  setTimeout(() => t.remove(), 3400);
}

// --- Main booking flow ---
document.addEventListener("DOMContentLoaded", () => {
  // Steps
  const step1 = document.getElementById("step1"),
        step2 = document.getElementById("step2"),
        step3 = document.getElementById("step3"),
        step4 = document.getElementById("step4");

  const selectDate      = document.getElementById("selectDate"),
        toStep2         = document.getElementById("toStep2"),
        backToStep1     = document.getElementById("backToStep1"),
        timeSlots       = document.getElementById("timeSlots"),
        backToStep2     = document.getElementById("backToStep2"),
        confirmationDetails = document.getElementById("confirmationDetails"),
        doctorSelect    = document.getElementById("doctor"),
        confirmBtn      = document.getElementById("confirmBtn"),
        sumDoctor       = document.getElementById("sumDoctor"),
        sumDate         = document.getElementById("sumDate"),
        sumTime         = document.getElementById("sumTime"),
        changeTimingBtn = document.getElementById("changeTimingBtn"),
        backToStep4     = document.getElementById("backToStep2From4");

  let selectedDate = "", selectedTime = "";

  // 1) Prevent past date + toast
  const todayStr = new Date().toISOString().split("T")[0];
  selectDate.min = todayStr;

  selectDate.addEventListener("change", () => {
    if (selectDate.value < todayStr) {
      showToast(`Please select ${todayStr} onwards`);
      selectDate.value = todayStr;
    }
    toStep2.disabled = !selectDate.value;
  });

  // 2) Date → Time
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

  // 3) Generate slots with 15-min lead + toast
  function generateTimeSlots() {
    timeSlots.innerHTML = "";
    const start = 9, end = 18, skip = 12;
    const now    = new Date();
    const cutoff = new Date(now.getTime() + 15*60*1000);

    for (let h = start; h < end; h++) {
      if (h === skip) continue;
      for (let m = 0; m < 60; m += 15) {
        const mm = String(m).padStart(2,"0");
        // build slot stamp
        const slotDt = new Date(`${selectedDate}T${String(h).padStart(2,"0")}:${mm}:00`);
        const isPast = selectedDate === todayStr && slotDt < cutoff;

        // button
        const btn = document.createElement("button");
        const hour12 = h%12 || 12;
        const suf = h<12 ? "am" : "pm";
        btn.textContent = `${hour12}:${mm} ${suf}`;
        if (isPast) btn.classList.add("past");

        btn.addEventListener("click", () => {
          if (isPast) {
            // next quarter
            let next = new Date(cutoff);
            const q = 15*60*1000;
            next = new Date(Math.ceil(next.getTime()/q)*q);
            const nh = next.getHours()%12||12;
            const nm = String(next.getMinutes()).padStart(2,"0");
            const ns = next.getHours()<12?"am":"pm";
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

  // 4) Time → Doctor
  backToStep2.addEventListener("click", () => {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  confirmBtn.addEventListener("click", () => {
    const doctor = doctorSelect.value;
    const dObj   = new Date(selectedDate);
    const full   = dObj.toLocaleDateString('en-US',{
      weekday:'long', month:'long', day:'numeric', year:'numeric'
    });

    // compute end time +14m
    const [tp, suf] = selectedTime.split(" ");
    let [h12, mn]  = tp.split(":");
    h12 = parseInt(h12,10);
    const h24 = suf==="pm"? (h12%12)+12 : h12%12;
    const startDt = new Date(`${selectedDate}T${String(h24).padStart(2,"0")}:${mn}:00`);
    const endDt   = new Date(startDt.getTime() + 14*60000);
    const fmt = dt => {
      let h = dt.getHours()%12||12, m = dt.getMinutes();
      const s = dt.getHours()<12?"am":"pm";
      return m===0?`${h}${s}`:`${h}:${String(m).padStart(2,"0")}${s}`;
    };

    sumDoctor.textContent = doctor;
    sumDate.textContent   = full;
    sumTime.textContent   = `${fmt(startDt)} - ${fmt(endDt)}`;

    step3.classList.add("hidden");
    step4.classList.remove("hidden");
  });

  // 5) Summary buttons
  changeTimingBtn.addEventListener("click", () => {
    step4.classList.add("hidden");
    step2.classList.remove("hidden");
  });
  backToStep4.addEventListener("click", () => {
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });
});
