// documents.js
document.addEventListener('DOMContentLoaded', () => {
  const viewModal    = document.getElementById('viewDocModal');
  const viewButtons  = document.querySelectorAll('.view-doc-btn');
  const closeButton  = viewModal?.querySelector('.close');

  if (!viewModal || viewButtons.length === 0) return;

  // Open on any View button
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewModal.style.display = 'flex';
    });
  });

  // Close on ×
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      viewModal.style.display = 'none';
    });
  }

  // Close when clicking outside the modal content
  window.addEventListener('click', e => {
    if (e.target === viewModal) {
      viewModal.style.display = 'none';
    }
  });
});
