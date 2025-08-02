async function loadRooms() {
      const container = document.getElementById('list');
      container.innerHTML = '<div class="empty">Loading available rooms...</div>';

      try {
        const res = await fetch('/api/openRooms');
        if (!res.ok) {
          const body = await res.text();
          container.innerHTML = `<div class="empty">Error loading rooms: ${res.status} ${body}</div>`;
          return;
        }
        const rooms = await res.json();
        if (!Array.isArray(rooms) || rooms.length === 0) {
          container.innerHTML = '<div class="empty">No rooms available right now.</div>';
          return;
        }

        container.innerHTML = ''; // clear

        rooms.forEach(item => {
          const roomId = typeof item === 'string' ? item : item.roomId;
          const doctorName = (typeof item === 'object' && item.doctorName) ? item.doctorName : null;

          const card = document.createElement('div');
          card.className = 'card';

          const info = document.createElement('div');
          info.className = 'room-info';

          const nameEl = document.createElement('p');
          nameEl.className = 'doctor-name';
          nameEl.textContent = doctorName || `Room ${roomId}`;

          const metaEl = document.createElement('div');
          metaEl.className = 'meta';
          metaEl.innerHTML = `ID: <span class="pill">${roomId}</span>`;

          info.append(nameEl, metaEl);

          const actions = document.createElement('div');
          actions.className = 'actions';
          const joinBtn = document.createElement('button');
          joinBtn.className = 'primary';
          joinBtn.textContent = 'Join';
          joinBtn.onclick = async () => { fetch(`/rooms/${roomId}/join`, { method: 'PUT' }); window.location.href = `/room/${roomId}`;};
          actions.append(joinBtn);
          card.append(info, actions);
          container.appendChild(card);
        });
      } catch (err) {
        console.error('loadRooms error', err);
        container.innerHTML = `<div class="empty">Unable to load rooms. Is the backend running?</div>`;
      }
    }

    document.getElementById('refreshBtn')?.addEventListener('click', loadRooms);
    window.addEventListener('DOMContentLoaded', loadRooms);