// helpers
function getUserIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("userId") || "user123";
}

const userId = getUserIdFromQuery();
let isLoading = false;

async function fetchNotifications() {
  if (isLoading) return;
  isLoading = true;
  try {
    const res = await fetch(`/notifications?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = document.querySelector("#notificationsList");
    list.innerHTML = "";

    if (data.length === 0) {
      list.textContent = "No notifications.";
      return;
    }

    // count unread
    const unreadCount = data.filter(n => !n.isRead).length;
    const badge = document.querySelector("#unreadBadge");
    if (badge) badge.textContent = unreadCount;

    // optionally show a "mark all" if any unread
    const markAllContainer = document.querySelector("#markAllContainer");
    if (markAllContainer) {
      markAllContainer.innerHTML = "";
      if (unreadCount > 0) {
        const allBtn = document.createElement("button");
        allBtn.textContent = "Mark all as read";
        allBtn.onclick = async () => {
          await Promise.all(
            data
              .filter(n => !n.isRead)
              .map(n =>
                fetch("/notifications/mark-read", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: n.id }),
                })
              )
          );
          fetchNotifications();
        };
        markAllContainer.appendChild(allBtn);
      }
    }

    data.forEach(n => {
      const li = document.createElement("li");
      li.style.marginBottom = "8px";
      const timestamp = new Date(n.createdAt).toLocaleString();
      li.textContent = `${n.message} (${timestamp}) `;

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
      } else {
        li.style.opacity = "0.6";
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    const list = document.querySelector("#notificationsList");
    list.innerHTML = "Failed to load notifications.";
  } finally {
    isLoading = false;
  }
}

// auto-refresh every 30 seconds
document.addEventListener("DOMContentLoaded", () => {
  fetchNotifications();
  setInterval(fetchNotifications, 30000);
});

