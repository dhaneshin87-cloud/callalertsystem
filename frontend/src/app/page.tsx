"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [error, setError] = useState("");

  // Add timeout for session loading
  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => {
        setSessionTimeout(true);
        console.warn("Session loading timeout - proceeding without authentication");
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else {
      setSessionTimeout(false);
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      router.push("/phone");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Use NextAuth's built-in redirect handling
      await signIn('google', { 
        callbackUrl: '/phone',
        redirect: true 
      });
    } catch (error) {
      console.error("Sign in error:", error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Modified loading state with timeout
  if (status === "loading" && !sessionTimeout) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in form if session is not loading or timed out
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className={styles.title}>Welcome to Call Alert System</h1>
        <p className={styles.subtitle}>Sign in with your Google account to get started</p>
        
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}
        
        <button 
          className={styles.googleButton} 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.loading}></div>
              Signing in...
            </>
          ) : (
            <>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Phone Integration</span>
          </div>
          <div className={styles.feature}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Event Management</span>
          </div>
          <div className={styles.feature}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
              <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
              <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
            </svg>
            <span>Smart Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
