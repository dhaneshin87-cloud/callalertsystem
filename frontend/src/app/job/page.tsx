"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
import styles from "./job.module.css";

type TwilioCallResult = {
  sid?: string;
  status?: string; // queued, ringing, in-progress, completed, failed, etc.
  to?: string;
  from?: string;
  answeredBy?: string | null; // 'human' | 'machine' | null
  duration?: string | null;
  price?: string | null;
  direction?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

type WSItem = {
  userId?: string;
  userEmail?: string;
  eventId?: string;
  eventName?: string;
  phoneNumber?: string;
  timestamp?: string;
  success?: boolean;
  callResult?: TwilioCallResult | null;
  error?: string;
};

export default function JobMonitor() {
  const { data: session } = useSession();
  const [items, setItems] = useState<WSItem[]>([]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    const userId = "3ea1fa7d-f6dc-4b2d-87c1-d6ac2dba5856";
    if (!userId) return;

    const socket = io("http://localhost:5000", {
      auth: { userId },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    const onConnect = () => {
      console.log("✅ Connected to WebSocket as", userId);
    };

    // Accept either an array of results or a single result payload
    const onNewJobResult = (data: WSItem | WSItem[]) => {
      console.log("📡 Received job result:", data);
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && typeof data === "object") {
        setItems((prev) => [data, ...prev].slice(0, 50));
      }
    };

    socket.on("connect", onConnect);
    socket.on("newJobResult", onNewJobResult);

    return () => {
      socket.off("connect", onConnect);
      socket.off("newJobResult", onNewJobResult);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user?.email]);

  const renderStatusMessage = (item: WSItem) => {
    if (item.error) {
      return <div className={styles.error}>❌ {item.error}</div>;
    }

    if (item.success) {
      const cr = item.callResult || {};
      const base = `📞 Call placed to ${cr.to ?? item.phoneNumber ?? "N/A"}`;
      const status = cr.status ? ` (status: ${cr.status})` : "";
      const answered =
        cr.answeredBy && cr.answeredBy !== "null"
          ? " ✅ Answered"
          : cr.status === "completed" || (cr.duration && cr.duration !== "0")
          ? " ✅ Answered/Completed"
          : "";

      return (
        <div className={styles.success}>
          {base}
          {status}
          {answered}
        </div>
      );
    }

    return <div className={styles.info}>⏳ Waiting for call status...</div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <div className={styles.userEmail}>Signed in as: {session?.user?.email}</div>
        </div>

        <h1 className={styles.title}>Event Call Status</h1>
        <p className={styles.subtitle}>Live updates from your call alerts</p>

        {items.length === 0 && <div className={styles.info}>Waiting for first update...</div>}

        <div className={styles.list}>
          {items.map((item, idx) => (
            <div key={`${item.eventId ?? idx}-${item.timestamp ?? idx}`} className={styles.listItem}>
              <div className={styles.itemHeader}>
                <div className={styles.itemTitle}>
                  📅 {item.eventName ?? "Event"}
                </div>
                {item.timestamp && (
                  <div className={styles.itemTime}>
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                )}
              </div>

              <div className={styles.itemBody}>
                {renderStatusMessage(item)}
                {item.callResult?.sid && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Call SID:</span>
                    <span className={styles.metaVal}>{item.callResult.sid}</span>
                  </div>
                )}
                {item.callResult?.from && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>From:</span>
                    <span className={styles.metaVal}>{item.callResult.from}</span>
                  </div>
                )}
                {item.callResult?.direction && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Direction:</span>
                    <span className={styles.metaVal}>{item.callResult.direction}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Live call status for each event</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Shows called vs answered clearly</span>
          </div>
        </div>
      </div>
    </div>
  );
}