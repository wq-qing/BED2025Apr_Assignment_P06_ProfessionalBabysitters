document.addEventListener('DOMContentLoaded', () => {
  const container      = document.getElementById('profileContainer');
  const toggleBtn      = document.getElementById('toggleEditBtn');
  const saveBtn        = document.getElementById('saveBtn');
  const cancelBtn      = document.getElementById('cancelBtn');

  const nameInput      = document.getElementById('nameInput');
  const nameDisplay    = document.getElementById('nameDisplay');
  const usernameInput  = document.getElementById('usernameInput');
  const usernameDisplay= document.getElementById('usernameDisplay');
  const emailInput     = document.getElementById('emailInput');
  const emailDisplay   = document.getElementById('emailDisplay');
  const phoneInput     = document.getElementById('phoneInput');
  const phoneDisplay   = document.getElementById('phoneDisplay');

  toggleBtn.addEventListener('click', () => {
    container.classList.add('editing');
  });

  cancelBtn.addEventListener('click', () => {
    container.classList.remove('editing');
  });

  saveBtn.addEventListener('click', () => {
    // Copy inputs back into the display spans
    nameDisplay.textContent      = nameInput.value;
    usernameDisplay.textContent  = usernameInput.value;
    emailDisplay.textContent     = emailInput.value;
    phoneDisplay.textContent     = phoneInput.value;

    container.classList.remove('editing');
    alert('Profile updated!');
  });
});