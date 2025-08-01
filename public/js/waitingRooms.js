async function loadRooms() {
  const res = await fetch('/api/openRooms');
  const rooms = await res.json();
  const ul = document.getElementById('roomList');
  if (!rooms.length) ul.innerHTML = '<li>No rooms available.</li>';
  rooms.forEach(id => {
    const li = document.createElement('li');
    li.innerHTML = `Room ${id} <button onclick="join('${id}')">Join</button>`;
    ul.append(li);
  });
}
function join(id) { window.location.href = `/room/${id}`; }
window.onload = loadRooms;