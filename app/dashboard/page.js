import { useEffect, useState, useRef } from "react";

export default function TerminalDashboard({ userRole }) { // userRole passed from Auth Context ("staff" or "manager")
    const [orders, setOrders] = useState([]);
    const lastPlayedMinuteRef = useRef(-1); 

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/staff/orders/pending");
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
                processSmartAlerts(data.data);
            }
        } catch (err) {
            console.error("Sync error", err);
        }
    };

    const processSmartAlerts = (pendingList) => {
        if (pendingList.length === 0) return;

        // Track the age of the oldest, highest-priority stuck order
        const oldestOrder = pendingList[0];
        const age = oldestOrder.minutesOld;
        const currentMinute = new Date().getMinutes();

        // 🔇 0 to 4 MINUTES: Absolute peace. Simple visual layout updates only.
        if (age < 5) {
            return; 
        }

        // 🔊 5 to 10 MINUTES: The Nudge Window (Plays once every calendar minute)
        if (age >= 5 && age < 10) {
            if (currentMinute !== lastPlayedMinuteRef.current) {
                lastPlayedMinuteRef.current = currentMinute;
                
                // Waiters get their repeating nudge reminder
                if (userRole === "staff") {
                    playNotificationSound("/sounds/gentle-nudge.mp3");
                }
                // Manager gets their first-time supervisor warning!
                if (userRole === "manager") {
                    playNotificationSound("/sounds/manager-alert.mp3");
                }
            }
        }

        // 🚨 10+ MINUTES: High Priority Critical Alert
        if (age >= 10) {
            if (currentMinute !== lastPlayedMinuteRef.current) {
                lastPlayedMinuteRef.current = currentMinute;
                playNotificationSound("/sounds/urgent-siren.mp3");
            }
        }
    };

    const playNotificationSound = (src) => {
        const audio = new Audio(src);
        audio.volume = 0.8;
        audio.play().catch(() => console.log("Audio playback blocked until first user click interaction"));
    };

    useEffect(() => {
        fetchOrders();
        const poller = setInterval(fetchOrders, 15000); // Polls every 15 seconds
        return () => clearInterval(poller);
    }, []);

    return (
        <div className="p-4">
            {orders.map(order => (
                // Sticky Unhideable Card UI Component Layout
                <div key={order._id} className={`card ${order.minutesOld >= 10 ? 'border-red-600 bg-red-50 text-red-900 animate-pulse' : order.minutesOld >= 5 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                    <h3>Table {order.tableNumber}</h3>
                    <p>Waiting for {order.minutesOld} mins</p>
                    {/* No close/hide button exists! Only a legal action approval button */}
                    <button className="bg-emerald-600 text-white px-4 py-2 rounded">Approve Order</button>
                </div>
            ))}
            // Inside customer's storefront status page component
{orderAgeMinutes >= 10 ? (
    <div className="bg-amber-50 text-center p-6 rounded-2xl border border-amber-200">
        <h3 className="font-bold text-amber-950 text-lg">Floor Staff is Extra Busy Today!</h3>
        <p className="text-amber-800 text-sm mt-1">Your order is safe in our queue, but our waiters are currently rushing around the tables.</p>
        
        {/* Simple fall-back button to let the customer raise a physical hand */}
        <button 
            onClick={summonStaffPhysically}
            className="mt-4 bg-amber-600 text-white font-medium px-6 py-3 rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
        >
            👋 Click to Wave/Call a Waiter
        </button>
    </div>
) : (
    <div className="spinner-view">
        <p>Sending your items straight to the service counter...</p>
    </div>
)}
        </div>
    );
}