const userId = "user123";

// Fetch and display wallet balance
async function fetchBalance() {
  const res = await fetch(`/wallet/balance?userId=${userId}`);
  const data = await res.json();
  document.querySelector("#walletBalance").textContent = parseFloat(data.balance || 0).toFixed(2);
}

// Fetch and show last 3 transactions
async function fetchTransactions() {
  const res = await fetch(`/wallet/transactions?userId=${userId}`);
  const data = await res.json();
  const list = document.querySelector("#transactionList");
  list.innerHTML = "";

  console.log("Fetched transactions:", data); // Debug

  if (!Array.isArray(data) || data.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No transactions yet.";
    list.appendChild(li);
    return;
  }

  data.forEach(tx => {
    const li = document.createElement("li");

    // Human-friendly type
    let humanType;
    if (tx.type === "deposit") humanType = "Top-up";
    else if (tx.type === "withdraw") humanType = "Payment";
    else humanType = tx.type ? tx.type.toUpperCase() : "UNKNOWN";

    // Date parsing (embedded uses `date`, older might have `timestamp`)
    const when = tx.date ? new Date(tx.date) : tx.timestamp ? new Date(tx.timestamp) : null;
    const whenStr = when ? when.toLocaleString() : "Unknown time";

    li.textContent = `${humanType} - $${parseFloat(tx.amount).toFixed(2)} - ${whenStr}`;
    list.appendChild(li);
  });
}

// Handle top-up
document.querySelector("#topup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cardNumberEl = document.querySelector("#cardNumber");
  const expiryDateEl = document.querySelector("#expiryDate");
  const cvvEl = document.querySelector("#cvv");
  const amountEl = document.querySelector("#topupAmount");

  const cardNumber = cardNumberEl.value;
  const expiryDate = expiryDateEl.value;
  const cvv = cvvEl.value;
  const amount = amountEl.value;

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

    // Clear fields after successful top-up
    cardNumberEl.value = "";
    expiryDateEl.value = "";
    cvvEl.value = "";
    amountEl.value = "";
  } else {
    alert(data.error || "Top-up failed.");
  }
});

// Handle previous card
document.querySelector("#usePrevCardBtn")?.addEventListener("click", async () => {
  const res = await fetch(`/wallet/last-card?userId=${userId}`);
  const data = await res.json();

  console.log("Loaded previous card:", data); // debugging

  if (data.cardNumber) {
    document.querySelector("#cardNumber").value = data.cardNumber;
    document.querySelector("#expiryDate").value = data.expiryDate;
    document.querySelector("#cvv").value = data.cvv;
    alert("Previous card loaded.");
  } else {
    alert(data.error || "No previous card found.");
  }
});

// Handle payment (Pay button)
document.querySelector("#payBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const amountEl = document.querySelector("#payAmount");
  const amount = amountEl.value;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    alert("Enter a valid payment amount.");
    return;
  }

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

    // Clear payment amount
    amountEl.value = "";
  } else {
    alert(data.message || "Payment failed.");
  }
});

// helper to get unread notification count
async function fetchUnreadCount() {
  try {
    const res = await fetch(`/notifications?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();
    const unread = data.filter(n => !n.isRead).length;
    const badge = document.querySelector("#unreadBadge");
    if (badge) badge.textContent = unread;
  } catch (err) {
    console.warn("Could not update unread count:", err);
  }
}

// open notifications page
document.querySelector("#viewNotificationsBtn")?.addEventListener("click", () => {
  window.location.href = "/notifications.html?userId=" + encodeURIComponent(userId);
});

// refresh unread count periodically
fetchUnreadCount();
setInterval(fetchUnreadCount, 30000); // every 30s

// On load
fetchBalance();
fetchTransactions();