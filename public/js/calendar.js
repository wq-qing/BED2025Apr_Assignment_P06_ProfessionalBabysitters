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
  // DOM nodes
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
  const confirmBtn = document.getElementById("confirmBtn");

  const sumDoctor = document.getElementById("sumDoctor");
  const sumDate = document.getElementById("sumDate");
  const sumTime = document.getElementById("sumTime");
  const changeTimingBtn = document.getElementById("changeTimingBtn");
  const changeDateBtn = document.getElementById("changeDateBtn");
  const deleteBtn = document.getElementById("deleteAppointmentBtn");
  const backToStep4 = document.getElementById("backToStep2From4");
  const viewAppointmentsBtn = document.getElementById("viewAppointmentsBtn");
  const doctorList = document.getElementById("doctorList");

  let selectedDate = "";
  let selectedTime = "";
  let appointmentId = null;
  let isEditing = false;
  let selectedDoctorName = null;
  let existingAppointmentsForDateAndDoctor = [];
  let allAppointments = [];

  // keep original loaded appointment values so change timing restores correctly
  let originalDate = "";
  let originalStartTime = "";
  let originalEndTime = "";

  // Prevent past date
  const todayStr = new Date().toISOString().split("T")[0];
  selectDate.min = todayStr;
  selectDate.addEventListener("change", () => {
    if (selectDate.value < todayStr) {
      showToast(`Please select ${todayStr} onwards`, true);
      selectDate.value = todayStr;
    }
    toStep2.disabled = !selectDate.value;
  });

  // Doctor picker
  confirmBtn.disabled = true;
  doctorList?.querySelectorAll(".doctor-option").forEach(el => {
    el.addEventListener("click", async () => {
      doctorList.querySelectorAll(".doctor-option").forEach(e => e.classList.remove("selected"));
      el.classList.add("selected");
      selectedDoctorName = el.dataset.name;
      confirmBtn.disabled = false;
      if (selectedDate) {
        await generateTimeSlots(); // refresh conflicts for current doctor/date
      }
    });
  });

  // session user
  const userID = sessionStorage.getItem("userID");
  if (!userID) {
    showToast("User not logged in.", true);
    return;
  }

  let isDoctor = false;

  // show inline message for user-not-found or doctor-blocked
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
    step1.appendChild(msg);
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
    msg.textContent = "Doctors are not allowed to book or view appointments.";
    step1.appendChild(msg);
  }

  // block doctors visually like user-not-found (no early return)
  if (userID.startsWith("D")) {
    isDoctor = true;
    showDoctorBlockedMessage();
    toStep2.disabled = true;
    viewAppointmentsBtn.disabled = true;
  }

  // fetch all appointments for this user; returns { error: 'NO_USER' } if user missing
  async function fetchUserAppointments() {
    try {
      const res = await fetch(`/api/appointments?userID=${encodeURIComponent(userID)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404 && data.error === "User not present") {
          return { error: "NO_USER" };
        }
        throw new Error("Failed to fetch appointments");
      }
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // Step 1 → Step 2 (new appointment or continuing edit after change date)
  toStep2.addEventListener("click", async () => {
    if (isDoctor) {
      showDoctorBlockedMessage();
      showToast("Doctors are not allowed to book or view appointments", true);
      return;
    }

    selectedDate = selectDate.value;
    if (!selectedDate) {
      showToast("Please pick a date", true);
      return;
    }

    const fetched = await fetchUserAppointments();
    if (fetched && fetched.error === "NO_USER") {
      showToast("User not present", true);
      showUserNotFoundMessage();
      return;
    }
    allAppointments = fetched;
    existingAppointmentsForDateAndDoctor = allAppointments;

    if (!(isEditing && appointmentId)) {
      appointmentId = null;
      isEditing = false;
      originalDate = "";
      originalStartTime = "";
      originalEndTime = "";
    } else {
      originalDate = selectedDate;
    }

    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    await generateTimeSlots();
  });

  backToStep1.addEventListener("click", () => {
    step2.classList.add("hidden");
    step1.classList.remove("hidden");
  });

  // Conflict detection
  function slotConflicts(doctor, date, slotStart24) {
    const toMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const slotStartMin = toMinutes(slotStart24);
    const slotEndMin = slotStartMin + 15;
    return existingAppointmentsForDateAndDoctor.some(appt => {
      if (appt.Doctor !== doctor) return false;
      const apptDate = new Date(appt.Date).toISOString().split("T")[0];
      if (apptDate !== date) return false;
      const apptStartMin = toMinutes(appt.StartTime);
      const apptEndMin = toMinutes(appt.EndTime);
      return slotStartMin < apptEndMin && slotEndMin > apptStartMin;
    });
  }

  // Generate time slots
  async function generateTimeSlots() {
    timeSlots.innerHTML = "";
    const now = new Date();
    if (selectedDate === todayStr && now.getHours() >= 18) {
      showToast("Clinic Has Closed, Please Book Tomorrow Time Slot", true);
      return;
    }
    const start = 9, end = 18, lunch = 12;
    const cutoff = new Date(now.getTime() + 15 * 60000);

    for (let h = start; h < end; h++) {
      if (h === lunch) continue;
      for (let m = 0; m < 60; m += 15) {
        const mm = String(m).padStart(2, "0");
        const time24 = `${String(h).padStart(2,"0")}:${mm}`;
        const btn = document.createElement("button");
        btn.textContent = formatTime(time24);
        const slotDt = new Date(`${selectedDate}T${time24}:00`);

        let isConflict = false;
        if (selectedDoctorName && slotConflicts(selectedDoctorName, selectedDate, time24)) {
          isConflict = true;
        }

        if (selectedDate === todayStr && slotDt < cutoff) {
          btn.classList.add("past");
          btn.disabled = true;
          btn.title = "Past time";
        }

        if (isConflict) {
          btn.classList.add("booked");
          btn.disabled = true;
          btn.title = "Already booked";
        }

        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          selectedTime = btn.textContent;
          if (!isEditing) {
            appointmentId = null;
          }
          step2.classList.add("hidden");
          step3.classList.remove("hidden");
          confirmationDetails.textContent =
            `Your appointment is on ${selectedDate} at ${selectedTime}`;
        });
        timeSlots.appendChild(btn);
      }
    }
  }

  // View existing appointments grouped by date & doctor
  viewAppointmentsBtn.addEventListener("click", async () => {
    if (isDoctor) {
      showDoctorBlockedMessage();
      showToast("Doctors are not allowed to book or view appointments", true);
      return;
    }

    const fetched = await fetchUserAppointments();
    if (fetched && fetched.error === "NO_USER") {
      showToast("User not present", true);
      showUserNotFoundMessage();
      return;
    }
    allAppointments = fetched;
    if (!allAppointments.length) {
      showToast("No appointments found", true);
      return;
    }

    const listContainer = document.createElement("div");
    listContainer.id = "existingAppointmentsList";
    listContainer.style.marginTop = "1rem";

    const grouped = {};
    allAppointments.forEach(appt => {
      const dateKey = new Date(appt.Date).toISOString().split("T")[0];
      const doctorKey = appt.Doctor;
      grouped[dateKey] ||= {};
      grouped[dateKey][doctorKey] ||= [];
      grouped[dateKey][doctorKey].push(appt);
    });

    for (const dateKey of Object.keys(grouped).sort()) {
      const dateHeader = document.createElement("h3");
      dateHeader.textContent = new Date(dateKey).toLocaleDateString("en-US", {
        weekday:"short", month:"short", day:"numeric", year:"numeric"
      });
      listContainer.appendChild(dateHeader);

      for (const doctorKey of Object.keys(grouped[dateKey])) {
        const docHeader = document.createElement("p");
        docHeader.innerHTML = `<strong>Doctor:</strong> ${doctorKey}`;
        listContainer.appendChild(docHeader);

        const ul = document.createElement("ul");
        grouped[dateKey][doctorKey].forEach(appt => {
          const li = document.createElement("li");
          const start = formatTime(appt.StartTime);
          const end = formatTime(appt.EndTime);
          li.textContent = `${start} - ${end}`;
          li.style.cursor = "pointer";
          li.style.marginBottom = "4px";
          li.addEventListener("click", () => {
            appointmentId = appt.AppointmentID;
            isEditing = true;
            selectedDoctorName = appt.Doctor;
            confirmBtn.disabled = false;

            originalDate = new Date(appt.Date).toISOString().split("T")[0];
            selectedDate = originalDate;
            originalStartTime = appt.StartTime;
            originalEndTime = appt.EndTime;

            existingAppointmentsForDateAndDoctor = allAppointments;

            const startDt = new Date(`${originalDate}T${originalStartTime}:00`);
            const endDt = new Date(`${originalDate}T${originalEndTime}:00`);

            doctorList.querySelectorAll(".doctor-option").forEach(el => {
              el.classList.toggle("selected", el.dataset.name === selectedDoctorName);
            });

            displaySummary(appt.Doctor, startDt, endDt);
          });
          ul.appendChild(li);
        });
        listContainer.appendChild(ul);
      }
    }

    const existing = document.getElementById("existingAppointmentsList");
    if (existing) existing.replaceWith(listContainer);
    else step1.appendChild(listContainer);
  });

  // Navigation back from step3
  backToStep2.addEventListener("click", () => {
    step3.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  // Confirm create/update
  confirmBtn.addEventListener("click", async () => {
    if (!selectedDoctorName) {
      showToast("Please pick a doctor", true);
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast("Missing date or time", true);
      return;
    }
    if (!userID) {
      showToast("User not logged in.", true);
      return;
    }

    const time24 = convertTo24h(selectedTime);
    const [h24, mn] = time24.split(":");
    const startDt = new Date(`${selectedDate}T${h24}:${mn}:00`);
    const endDt = new Date(startDt.getTime() + 14 * 60000);
    const hhmm = dt => dt.toTimeString().slice(0,5);

    try {
      let url, method;
      if (appointmentId && isEditing) {
        url = `/api/appointments/${appointmentId}`;
        method = "PUT";
      } else {
        url = "/api/appointments";
        method = "POST";
      }
      const payload = {
        userID,
        date: selectedDate,
        startTime: hhmm(startDt),
        endTime: hhmm(endDt),
        doctor: selectedDoctorName
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          showToast("Time slot already booked", true);
          return;
        }
        if (res.status === 404 && data.error === "User not present") {
          showToast("User not present", true);
          showUserNotFoundMessage();
          return;
        }
        showToast(data.error || "Failed to save appointment", true);
        console.error("Appointment error:", res.status, data);
        return;
      }
      if (!appointmentId || !isEditing) appointmentId = data.id;
      showToast(method === "POST" ? `Saved (ID ${data.id})` : "Appointment updated");
      localStorage.setItem("hasAppointment", "true");
      displaySummary(selectedDoctorName, startDt, endDt);
      isEditing = true;
      originalDate = selectedDate;
      originalStartTime = hhmm(startDt);
      originalEndTime = hhmm(endDt);
    } catch (err) {
      console.error(err);
      showToast("Failed to save appointment", true);
    }
  });

  function displaySummary(doctor, startDt, endDt) {
    const fmt12 = dt => formatTime(
      `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
    );
    sumDoctor.textContent = doctor;
    sumDate.textContent = startDt.toLocaleDateString("en-US", {
      weekday:"long", month:"long", day:"numeric", year:"numeric"
    });
    sumTime.textContent = `${fmt12(startDt)} - ${fmt12(endDt)}`;
    step1.classList.add("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    step4.classList.remove("hidden");
  }

  // Delete appointment
  deleteBtn.addEventListener("click", async () => {
    if (!appointmentId) {
      showToast("No appointment to delete", true);
      return;
    }
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Appointment deleted");
      localStorage.removeItem("hasAppointment");
      appointmentId = null;
      isEditing = false;
      originalDate = "";
      originalStartTime = "";
      originalEndTime = "";
      step4.classList.add("hidden");
      step1.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete appointment", true);
    }
  });

  // Change timing - keep editing context, restore slot page
  changeTimingBtn.addEventListener("click", async () => {
    step4.classList.add("hidden");
    step2.classList.remove("hidden");
    if (originalDate) {
      selectedDate = originalDate;
      allAppointments = await fetchUserAppointments();
      existingAppointmentsForDateAndDoctor = allAppointments;
      await generateTimeSlots();
    }
  });

  // Change date - go back to picking date but stay in edit mode
  changeDateBtn.addEventListener("click", () => {
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
    // editing context preserved: appointmentId & isEditing & originalDate will update when user selects new date and clicks Next
  });

  // Back from summary clears edit context (new appointment next)
  backToStep4.addEventListener("click", () => {
    appointmentId = null;
    isEditing = false;
    originalDate = "";
    originalStartTime = "";
    originalEndTime = "";
    step4.classList.add("hidden");
    step1.classList.remove("hidden");
  });
});
