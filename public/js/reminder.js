document.addEventListener('DOMContentLoaded', () => {
  const tableBody    = document.querySelector("#remindersTable tbody");
  const editModal    = document.getElementById('editReminderModal');
  const createModal  = document.getElementById('createReminderModal');
  const editForm     = document.getElementById('editReminderForm');
  const createForm   = document.getElementById('createReminderForm');
  const closeButtons = document.querySelectorAll('.modal .close');
  const addBtn       = document.getElementById('addReminderBtn');

  // show/hide modals
  function openModal(m){ m.style.display='flex'; }
  function closeModals(){ document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); }
  closeButtons.forEach(btn=>btn.addEventListener('click', closeModals));
  window.addEventListener('click', e => e.target.classList.contains('modal') && closeModals());

  async function loadReminders() {
  const userID = sessionStorage.getItem("userID");
  const container = document.querySelector("#remindersTable tbody");

  if (!userID) {
    container.innerHTML = `<tr><td colspan="5">User not logged in.</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`/api/reminders/${encodeURIComponent(userID)}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const reminders = await res.json();

    if (!Array.isArray(reminders) || reminders.length === 0) {
      container.innerHTML = `<tr><td colspan="5">No reminders set.</td></tr>`;
      return;
    }

    container.innerHTML = ""; // clear

    reminders.forEach(r => {
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

    // bind edit/delete as before...
  } catch (err) {
    console.error("Reminder fetch failed:", err);
    container.innerHTML = `<tr><td colspan="5">Error loading reminders.</td></tr>`;
  }
}

window.addEventListener("DOMContentLoaded", loadReminders);

  // load and render
  async function loadReminders(){
    const res = await fetch("/api/reminders");
    const data = await res.json();
    tableBody.innerHTML = '';
    data.forEach(r => {
      const row = document.createElement('tr');
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
      tableBody.appendChild(row);
    });
    bindEdit();
    bindDelete();
  }

  function formatTime(t){
    let [h,m] = t.split(':').map(x=>+x);
    const ampm = h>=12?'PM':'AM';
    h = h%12||12;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
  }

  function bindEdit(){
    document.querySelectorAll('.edit-reminder-btn').forEach(btn=>{
      btn.onclick = ()=>{
        const row = btn.closest('tr');
        const [name,dosage,time,freq] = [...row.children].slice(0,4).map(td=>td.textContent);
        editForm.editMedName.value     = name;
        editForm.editDosage.value     = dosage;
        editForm.editTime.value       = timeTo24(time);
        editForm.editFrequency.value  = freq;
        editForm.dataset.id           = row.dataset.id;
        openModal(editModal);
      };
    });
  }

  function bindDelete(){
    document.querySelectorAll('.delete-reminder-btn').forEach(btn=>{
      btn.onclick = async ()=>{
        if(!confirm('Delete this reminder?')) return;
        await fetch(`/api/reminders/${btn.closest('tr').dataset.id}`, { method:'DELETE' });
        loadReminders();
      };
    });
  }

  function timeTo24(str){
    let [t,ampm] = str.split(' ');
    let [h,m] = t.split(':').map(x=>+x);
    if(ampm==='PM'&&h<12)h+=12;
    if(ampm==='AM'&&h===12)h=0;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  }

  // Add new reminder
  addBtn.onclick = ()=>{
    createForm.reset();
    openModal(createModal);
  };

  createForm.onsubmit = async e => {
  e.preventDefault();
  const userID = sessionStorage.getItem("userID");
  if (!userID) {
    alert("User not logged in.");
    return;
  }
  
  const payload = {
    userID: userID,
    MedName: createForm.createMedName.value.trim(),
    MedDosage: createForm.createDosage.value.trim(),
    ReminderTime: createForm.createTime.value,
    Frequency: createForm.createFrequency.value
  };

  const res = await fetch("/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    // success handling (e.g., reload list)
  } else {
    console.error("Create failed:", await res.text());
  }
};


editForm.onsubmit = async e => {
  e.preventDefault();
  const userID = sessionStorage.getItem("userID");
  if (!userID) {
    alert("User not logged in.");
    return;
  }
  const id = editForm.dataset.id; // or however you store ReminderID

  const payload = {
    userID: userID,
    MedName: editForm.editMedName.value.trim(),
    MedDosage: editForm.editDosage.value.trim(),
    ReminderTime: editForm.editTime.value,
    Frequency: editForm.editFrequency.value
  };

  const res = await fetch(`/api/reminders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    // success handling
  } else {
    console.error("Update failed:", await res.text());
  }
}});
