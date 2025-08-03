const userId = "user123";

// Fetch and display wallet balance
async function fetchBalance() {
  try {
    const res = await fetch(`/wallet/balance?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    document.querySelector("#walletBalance").textContent = parseFloat(data.balance || 0).toFixed(2);
  } catch (err) {
    console.error("Failed to fetch balance:", err);
  }
}

// Fetch and show last 3 transactions
async function fetchTransactions() {
  try {
    const res = await fetch(`/wallet/transactions?userId=${encodeURIComponent(userId)}`);
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

      let humanType;
      if (tx.type === "deposit") humanType = "Top-up";
      else if (tx.type === "withdraw" || tx.type === "payment") humanType = "Payment";
      else humanType = tx.type ? tx.type.toUpperCase() : "UNKNOWN";

      const when = tx.date ? new Date(tx.date) : tx.timestamp ? new Date(tx.timestamp) : null;
      const whenStr = when ? when.toLocaleString() : "Unknown time";

      li.textContent = `${humanType} - $${parseFloat(tx.amount).toFixed(2)} - ${whenStr}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    const list = document.querySelector("#transactionList");
    list.innerHTML = "<li>Could not load transactions.</li>";
  }
}

// Handle top-up
document.querySelector("#topup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cardNumberEl = document.querySelector("#cardNumber");
  const expiryDateEl = document.querySelector("#expiryDate");
  const cvvEl = document.querySelector("#cvv");
  const amountEl = document.querySelector("#topupAmount");
  const topupBtn = document.querySelector("#topupBtn");

  const cardNumber = cardNumberEl.value.trim();
  const expiryDate = expiryDateEl.value.trim();
  const cvv = cvvEl.value.trim();
  const amountRaw = amountEl.value.trim();
  const amount = parseFloat(amountRaw);

  if (!amount || isNaN(amount) || amount <= 0) {
    alert("Enter a valid top-up amount.");
    return;
  }

  if (!cardNumber || !expiryDate || !cvv) {
    alert("Please fill in all card fields.");
    return;
  }

  topupBtn.disabled = true;
  try {
    const response = await fetch("/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cardNumber, expiryDate, cvv, amount })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Unexpected response from server (status ${response.status})`);
    }

    if (data.success) {
      alert(`Wallet topped up! New balance: $${parseFloat(data.newBalance).toFixed(2)}`);
      await fetchBalance();
      await fetchTransactions();

      // Clear fields after successful top-up
      cardNumberEl.value = "";
      expiryDateEl.value = "";
      cvvEl.value = "";
      amountEl.value = "";
    } else {
      alert(data.error || data.message || "Top-up failed.");
    }
  } catch (err) {
    console.error("Top-up error:", err);
    alert("Top-up failed due to network or server error.");
  } finally {
    topupBtn.disabled = false;
  }
});

// Handle previous card
document.querySelector("#usePrevCardBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`/wallet/last-card?userId=${encodeURIComponent(userId)}`);
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
  } catch (err) {
    console.error("Failed to load previous card:", err);
    alert("Could not load previous card.");
  }
});

// Handle payment (Pay button)
document.querySelector("#payBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const amountEl = document.querySelector("#payAmount");
  const payBtn = document.querySelector("#payBtn");
  const amountRaw = amountEl.value.trim();
  const amount = parseFloat(amountRaw);

  if (!amount || isNaN(amount) || amount <= 0) {
    alert("Enter a valid payment amount.");
    return;
  }

  payBtn.disabled = true;
  try {
    const response = await fetch("/payment/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Unexpected response from server (status ${response.status})`);
    }

    if (data.success) {
      alert(`Payment successful! Remaining balance: $${parseFloat(data.remainingBalance).toFixed(2)}`);
      await fetchBalance();
      await fetchTransactions();
      amountEl.value = "";
    } else {
      alert(data.message || "Payment failed.");
    }
  } catch (err) {
    console.error("Payment error:", err);
    alert("Payment failed due to network or server error.");
  } finally {
    payBtn.disabled = false;
  }
});

// helper to get unread notification count
async function fetchUnreadCount() {
  try {
    const res = await fetch(`/notifications?userId=${encodeURIComponent(userId)}`);
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
  window.location.href = "/notifications?userId=" + encodeURIComponent(userId);
});

// refresh unread count periodically
fetchUnreadCount();
setInterval(fetchUnreadCount, 30000); // every 30s

// On load
fetchBalance();
fetchTransactions();