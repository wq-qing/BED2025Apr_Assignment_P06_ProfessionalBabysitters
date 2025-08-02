// derive userId from query string
function getUserIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("userId") || "user123";
}
const userId = getUserIdFromQuery();

async function fetchNotifications() {
  try {
    const res = await fetch(`/notifications?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = document.getElementById("notificationsList");
    list.innerHTML = "";

    // update unread badge
    const unreadItems = data.filter(n => !n.isRead);
    document.getElementById("unreadBadge").textContent = unreadItems.length;

    if (data.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No notifications.";
      list.appendChild(li);
      return;
    }

    data.forEach(n => {
      const li = document.createElement("li");
      if (n.isRead) li.classList.add("read");

      const timestamp = new Date(n.createdAt).toLocaleString();
      const textSpan = document.createElement("span");
      textSpan.textContent = `${n.message} (${timestamp})`;
      li.appendChild(textSpan);

      if (!n.isRead) {
        const btn = document.createElement("button");
        btn.textContent = "Mark as read";
        btn.style.marginLeft = "8px";
        btn.onclick = async () => {
          try {
            await fetch("/notifications/mark-read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: n.id }),
            });
            fetchNotifications();
          } catch (err) {
            console.error("Failed to mark as read:", err);
          }
        };
        li.appendChild(btn);
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    const list = document.getElementById("notificationsList");
    list.innerHTML = "";
    const li = document.createElement("li");
    li.textContent = "Failed to load notifications.";
    list.appendChild(li);
  }
}

// initial load and periodic refresh
document.addEventListener("DOMContentLoaded", () => {
  fetchNotifications();
  setInterval(fetchNotifications, 30000);
});