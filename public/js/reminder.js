// reminder.js
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

  createForm.onsubmit = async e=>{
    e.preventDefault();
    const payload = {
      MedName:      createForm.createMedName.value.trim(),
      MedDosage:    createForm.createDosage.value.trim(),
      ReminderTime: createForm.createTime.value,
      Frequency:    createForm.createFrequency.value
    };
    const res = await fetch('/api/reminders', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(res.ok){
      const { ReminderID } = await res.json();
      // append new row immediately
      const row = document.createElement('tr');
      row.dataset.id = ReminderID;
      row.innerHTML = `
        <td>${payload.MedName}</td>
        <td>${payload.MedDosage}</td>
        <td>${formatTime(payload.ReminderTime)}</td>
        <td>${payload.Frequency}</td>
        <td>
          <button class="btn edit-reminder-btn">Edit</button>
          <button class="btn btn-danger delete-reminder-btn">Delete</button>
        </td>`;
      tableBody.appendChild(row);
      bindEdit();
      bindDelete();
      closeModals();
    } else {
      alert('Failed to add reminder');
    }
  };

  // Edit existing reminder
  editForm.onsubmit = async e=>{
    e.preventDefault();
    const id = editForm.dataset.id;
    const payload = {
      MedName:      editForm.editMedName.value.trim(),
      MedDosage:    editForm.editDosage.value.trim(),
      ReminderTime: editForm.editTime.value,
      Frequency:    editForm.editFrequency.value
    };
    await fetch(`/api/reminders/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    closeModals();
    loadReminders();
  };

  loadReminders();
});
