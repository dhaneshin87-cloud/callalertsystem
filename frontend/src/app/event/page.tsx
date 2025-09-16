"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../lib/api"; // Import the configured API client
import styles from "./event.module.css";

export default function EventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const[userId,setUserId]=useState<string|null>(null);

  useEffect(() => {
    const access = localStorage.getItem("google_access_token");
    const refresh = localStorage.getItem("google_refresh_token");
    const phone = localStorage.getItem("phoneNumber");
    const storedEmail = localStorage.getItem("user_email");
    const userID=localStorage.getItem('user_id');

    if (!access || !refresh) {
      router.push("/");
      return;
    }

    if (!phone) {
      router.push("/phone");
      return;
    }

    setAccessToken(access);
    setRefreshToken(refresh);
    setPhoneNumber(phone);
    setEmail(storedEmail);
    setUserId(userID)
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !time) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (!accessToken || !refreshToken) {
      setMessage("Authentication required.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const dateTimeStart = new Date(`${date}T${time}`).toISOString();
      const dateTimeEnd = new Date(new Date(dateTimeStart).getTime() + 60 * 60 * 1000).toISOString();

      // Create event in Google Calendar
      const calendarResponse = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: name,
            description: description,
            start: {
              dateTime: dateTimeStart,
              timeZone: "UTC",
            },
            end: {
              dateTime: dateTimeEnd,
              timeZone: "UTC",
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'popup', minutes: 10 },
              ],
            },
          }),
        }
      );

      if (!calendarResponse.ok) {
        throw new Error("Failed to create calendar event");
      }

      // Save event to backend with phone number using API client
      await apiClient.post(
        "/events/eventcreate",
        {
          name,
          description,
          date: dateTimeStart,
          endDate: dateTimeEnd,
          phoneNumber,
          email,
       userId
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setMessage("Event created successfully! You'll receive call alerts before the event.");
      setName("");
      setDescription("");
      setDate("");
      setTime("");

      setTimeout(() => {
        router.push("/job");
      }, 2000);

    } catch (error: any) {
      console.error("Error creating event:", error);
      setMessage("Error creating event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!accessToken || !refreshToken) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}></div>
          <p>Please login with Google first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <div className={styles.userEmail}>Signed in as: {email || "Your Google account"}</div>
          <div className={styles.userPhone}>Phone: {phoneNumber}</div>
        </div>

        <h1 className={styles.title}>Create Event</h1>
        <p className={styles.subtitle}>Set up your event and we'll send you call alerts</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter event name"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Enter event description (optional)"
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Time *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className={styles.loading}></div>
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${message.includes("successfully") ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Added to Google Calendar</span>
          </div>
          <div className={styles.feature}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Call alerts at 30min & 10min before</span>
          </div>
        </div>
      </div>
    </div>
  );
}
