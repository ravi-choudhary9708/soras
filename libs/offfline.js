import Dexie from "dexie";

// 1. Create a lightning-fast local database directly inside the phone's browser
const localDb = new Dexie("SorasLocalDB");
localDb.version(1).stores({
    orders: "++id, tableNumber, items, synced"
});

// 2. The Auto-Sync Engine Function
async function syncOfflineOrdersToCloud() {
    // Check if the phone actually has active internet right now
    if (!navigator.onLine) return;

    // Fetch all local orders that haven't been sent to the cloud yet
    const pendingOrders = await localDb.orders.where({ synced: 0 }).toArray();

    for (let order of pendingOrders) {
        try {
            // Push it to the exact backend creation route we already built
            const response = await fetch("/api/staff/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tableNumber: order.tableNumber,
                    items: order.items
                })
            });

            if (response.ok) {
                // 🎉 Success! Update local database flag so we don't send it again
                await localDb.orders.update(order.id, { synced: 1 });
                console.log(`Table ${order.tableNumber} order synced cleanly to cloud MongoDB!`);
            }
        } catch (error) {
            console.error("Cloud server still unreachable, holding order locally...", error);
        }
    }
}

// 3. Listen to the network hardware status
if (typeof window !== "undefined") {
    window.addEventListener("online", syncOfflineOrdersToCloud);
}