// reminders.js
document.addEventListener('DOMContentLoaded', () => {
  const editModal    = document.getElementById('editReminderModal');
  const editButtons  = document.querySelectorAll('.edit-reminder-btn');
  const closeButton  = editModal?.querySelector('.close');
  const editForm     = document.getElementById('editReminderForm');

  if (!editModal || editButtons.length === 0) return;

  // Open on any Edit button
  editButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      editModal.style.display = 'flex';
    });
  });

  // Close on ×
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      editModal.style.display = 'none';
    });
  }

  // Close when clicking outside modal content
  window.addEventListener('click', e => {
    if (e.target === editModal) {
      editModal.style.display = 'none';
    }
  });

  // Form submission
  if (editForm) {
    editForm.addEventListener('submit', e => {
      e.preventDefault();
      // grab your inputs here if needed, e.g.
      // const name = document.getElementById('editMedName').value;
      alert('Reminder updated successfully!');
      editModal.style.display = 'none';
    });
  }
});
