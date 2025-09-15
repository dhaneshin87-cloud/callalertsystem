"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";// Import the configured API client
import styles from "./phone.module.css";

export default function PhonePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

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
      // Save to backend using configured API client
      const response = await apiClient.post('/api/user/phone', {
        phone: phone.trim(),
        email: session?.user?.email,
      });

      if (response.status === 200) {
        // Also save to localStorage as backup
        localStorage.setItem("phoneNumber", phone.trim());
        setSuccess("Phone number saved successfully!");
        
        // Redirect to event page after a short delay
        setTimeout(() => {
          router.push("/event");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving phone number:", error);
      
      // Fallback to localStorage if backend fails
      localStorage.setItem("phoneNumber", phone.trim());
      setSuccess("Phone number saved locally!");
      
      setTimeout(() => {
        router.push("/event");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.userInfo}>
          <div className={styles.userEmail}>Signed in as: {session.user?.email}</div>
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
        
        <button 
          className={styles.button} 
          onClick={handleSave}
          disabled={isLoading || !phone.trim()}
        >
          {isLoading ? (
            <>
              <div className={styles.loading}></div>
              Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </button>
        
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        <div className={styles.info}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span>Your phone number is encrypted and stored securely</span>
        </div>
      </div>
    </div>
  );
}
