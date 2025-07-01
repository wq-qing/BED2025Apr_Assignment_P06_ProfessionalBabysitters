document.addEventListener('DOMContentLoaded', () => {

  const rescheduleModal = document.getElementById('rescheduleModal');
  if (!rescheduleModal) return;

  const rescheduleBtns = document.querySelectorAll('.reschedule-appointment-btn');
  const closeBtn       = rescheduleModal.querySelector('.close');
  const rescheduleForm = document.getElementById('rescheduleForm');

  rescheduleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rescheduleModal.style.display = 'flex';
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      rescheduleModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === rescheduleModal) {
      rescheduleModal.style.display = 'none';
    }
  });

  if (rescheduleForm) {
    rescheduleForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Appointment rescheduled!');
      rescheduleModal.style.display = 'none';
    });
  }
});
