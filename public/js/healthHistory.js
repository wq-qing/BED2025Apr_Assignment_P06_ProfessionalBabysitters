// helper to decode JWT safely
function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

let editingId = null;
let selectedUserId = null;
const token = localStorage.getItem("token");
const user = getTokenPayload();
if (!token || !user?.userId) {
  alert("Not logged in or invalid session. Please login again.");
}

async function saveCondition() {
  const payload = {
    name: document.getElementById("conditionName").value,
    startDate: document.getElementById("startDate").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value,
  };

  if (user?.role === "Doctor") {
    payload.userId = selectedUserId;
    if (!payload.userId) return alert("Select a user first.");
  }

  const url = editingId
    ? `/api/conditions/${editingId}`
    : `/api/conditions`;

  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert(editingId ? "✅ Updated" : "✅ Saved");
    clearForm();
    await loadConditions();
  } else {
    const errText = await res.text();
    alert("❌ Failed to save condition: " + errText);
  }
}

function populateForm(cond) {
  document.getElementById("conditionName").value = cond.name;
  document.getElementById("startDate").value = cond.startDate?.split("T")[0] || '';
  document.getElementById("status").value = cond.status;
  document.getElementById("notes").value = cond.notes;
  editingId = cond.id;
  document.getElementById("cancelBtn").classList.remove("hidden");
}

function clearForm() {
  document.getElementById("conditionName").value = '';
  document.getElementById("startDate").value = '';
  document.getElementById("status").value = '';
  document.getElementById("notes").value = '';
  editingId = null;
  document.getElementById("cancelBtn").classList.add("hidden");
}

async function deleteCondition(id) {
  const res = await fetch(`/api/conditions/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (res.ok) {
    clearForm();
    await loadConditions();
  } else {
    alert("❌ Delete failed");
  }
}

async function loadConditions() {
  let url = "/api/conditions";
  if (user?.role === "Doctor" && selectedUserId) {
    url += `?userId=${encodeURIComponent(selectedUserId)}`;
  }
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error("Failed to load conditions", await res.text());
    return;
  }
  const data = await res.json();
  const list = document.getElementById("conditionList");
  list.innerHTML = "";

  data.forEach(cond => {
    const div = document.createElement("div");
    div.className = "p-4 bg-white rounded-xl shadow cursor-pointer";
    div.onclick = () => populateForm(cond);
    div.innerHTML = `
      <div>
        <p class="font-medium">${cond.name}</p>
        <p class="text-sm text-gray-600">${cond.status}</p>
        <p class="text-xs text-gray-400">${cond.startDate?.split('T')[0] || ''}</p>
        <p class="text-xs italic text-gray-500">${cond.notes || ''}</p>
      </div>
      <button onclick="event.stopPropagation(); deleteCondition('${cond.id}')" class="mt-2 text-sm px-3 py-1 bg-gray-200 rounded-xl">
        Delete
      </button>
    `;
    list.appendChild(div);
  });
}

async function loadUserDropdown() {
  if (user?.role !== "Doctor") return;

  document.getElementById("doctorUserSelect").classList.remove("hidden");

  const res = await fetch("/api/users", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) return;

  const users = await res.json();
  const selector = document.getElementById("userSelector");
  selector.innerHTML = `<option value="">Select a user...</option>`;

  users.forEach(u => {
    const option = document.createElement("option");
    option.value = u.Id;
    option.textContent = `${u.Name} (${u.Email})`;
    selector.appendChild(option);
  });

  selector.onchange = async (e) => {
    selectedUserId = e.target.value;
    await loadConditions();
  };
}

window.onload = async () => {
  document.getElementById("saveBtn").onclick = saveCondition;
  document.getElementById("cancelBtn").onclick = clearForm;
  await loadUserDropdown();
  await loadConditions();
};
