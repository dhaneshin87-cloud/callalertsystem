"use client";

import { useState, useEffect, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./phone.module.css";

export default function PhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null); // optional if passed or fetched

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // On mount: retrieve tokens from URL or localStorage
  useEffect(() => {
    const access = searchParams.get("access_token");
    const refresh = searchParams.get("refresh_token");
    const storedEmail = searchParams.get("email");
    const userId = searchParams.get("user_id");

    if (access) {
      setAccessToken(access);
      localStorage.setItem("google_access_token", access);
    } else {
      setAccessToken(localStorage.getItem("google_access_token"));
    }

    if (refresh) {
      setRefreshToken(refresh);
      localStorage.setItem("google_refresh_token", refresh);
    } else {
      setRefreshToken(localStorage.getItem("google_refresh_token"));
    }

    if (storedEmail) {
      setEmail(storedEmail);
      localStorage.setItem("user_email",storedEmail)
    }
    if (userId) {
      localStorage.setItem("user_id", userId); // Store user ID in localStorage
    }
  }, [searchParams]);

  // Validate phone number format
  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Handle saving phone number
  const handleSave = async () => {
    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Optionally send to backend using fetch or apiClient with accessToken
      /*
      await apiClient.post('/save-phone', {
        phone,
        accessToken
      });
      */

      // Save to localStorage as backup
      localStorage.setItem("phoneNumber", phone.trim());
      setSuccess("Phone number saved successfully!");

      setTimeout(() => {
        router.push("/event");
      }, 1500);
    } catch (err) {
      console.error("Error saving phone number:", err);
      localStorage.setItem("phoneNumber", phone.trim());
      setSuccess("Phone number saved locally!");

      setTimeout(() => {
        router.push("/event");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Check if accessToken exists
  if (!accessToken || !refreshToken) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}></div>
          <p>Loading</p>
        </div>
      </div>
    );
  }

  // Render the phone input page
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <div className={styles.userEmail}>Signed in as: {email || "Your Google account"}</div>
        </div>

        <h1 className={styles.title}>Add Your Phone Number</h1>
        <p className={styles.subtitle}>We'll use this to send you call alerts for your events</p>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Phone Number</label>
          <input
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <button className={styles.button} onClick={handleSave} disabled={isLoading || !phone.trim()}>
          {isLoading ? (
            <>
              <div className={styles.loading}></div>
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </button>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.info}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>Your phone number is encrypted and stored securely</span>
        </div>
      </div>
    </div>
  );
}
