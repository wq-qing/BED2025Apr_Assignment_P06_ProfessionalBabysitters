const userId = "user123";

// Fetch and display wallet balance
async function fetchBalance() {
  const res = await fetch(`/wallet/balance?userId=${userId}`);
  const data = await res.json();
  document.querySelector("#walletBalance").textContent = parseFloat(data.balance).toFixed(2);
}

// Fetch and show last 3 transactions
async function fetchTransactions() {
  const res = await fetch(`/wallet/transactions?userId=${userId}`);
  const data = await res.json();
  const list = document.querySelector("#transactionList");
  list.innerHTML = "";

  console.log("📋 Fetched transactions:", data); // Debug

  data.forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `${tx.type.toUpperCase()} - $${tx.amount} - ${new Date(tx.timestamp).toLocaleString()}`;
    list.appendChild(li);
  });
}

// Handle top-up
document.querySelector("#topup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const cardNumber = document.querySelector("#cardNumber").value;
  const expiryDate = document.querySelector("#expiryDate").value;
  const cvv = document.querySelector("#cvv").value;
  const amount = document.querySelector("#topupAmount").value;

  const response = await fetch("/wallet/topup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, cardNumber, expiryDate, cvv, amount })
  });

  const data = await response.json();
  if (data.success) {
    alert(`Wallet topped up! New balance: $${data.newBalance}`);
    await fetchBalance();
    await fetchTransactions();
  } else {
    alert(data.error || "Top-up failed.");
  }
});

// Handle previous card
document.querySelector("#usePrevCardBtn").addEventListener("click", async () => {
  const res = await fetch(`/wallet/last-card?userId=${userId}`);
  const data = await res.json();

  if (data.cardNumber) {
    document.querySelector("#cardNumber").value = data.cardNumber;
    document.querySelector("#expiryDate").value = data.expiryDate;
    document.querySelector("#cvv").value = data.cvv;
    alert("Previous card loaded.");
  } else {
    alert(data.error || "No previous card found.");
  }
});

// Handle payment
document.querySelector("#pay-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.querySelector("#payAmount").value;

  const response = await fetch("/payment/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await response.json();
  if (data.success) {
    alert(`Payment successful! Remaining balance: $${data.remainingBalance}`);
    await fetchBalance();
    await fetchTransactions();
  } else {
    alert(data.message || "Payment failed.");
  }
});

// helper to get unread notification count
async function fetchUnreadCount() {
  const res = await fetch(`/notifications?userId=${userId}`);
  const data = await res.json();
  const unread = data.filter(n => n.isRead === 0 || n.isRead === false).length;
  document.querySelector("#unreadBadge").textContent = unread;
}

// open notifications page
document.querySelector("#viewNotificationsBtn").addEventListener("click", () => {
  window.location.href = "/notifications.html?userId=" + encodeURIComponent(userId);
});

// refresh unread count periodically
fetchUnreadCount();
setInterval(fetchUnreadCount, 30000); // every 30s
// On load
fetchBalance();
fetchTransactions();









