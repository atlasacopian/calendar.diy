"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Ensure Supabase has exchanged the one-time code in the URL for a session.
  useEffect(() => {
    // Because we enabled `detectSessionInUrl` when creating the client, the
    // browser client will automatically attempt to exchange the code for a
    // session on page load. We just wait briefly for that process to finish so
    // that `supabase.auth.getUser()` will return the recovered user.
    const timer = setTimeout(() => {
      setCheckingSession(false);
    }, 500); // 0.5s buffer is usually enough.
    return () => clearTimeout(timer);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword || !confirmNewPassword) {
      setError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setFormLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "This link is invalid or has expired. Please request a new password reset email."
      );
      setFormLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated successfully! Redirecting to sign in…");
      // Give the user a moment to read the message, then send them home.
      setTimeout(() => {
        router.push("/");
      }, 2500);
    }

    setFormLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleUpdatePassword}
        className="mx-auto w-full max-w-sm space-y-4 rounded-sm border border-gray-200 p-6 shadow"
      >
        <h1 className="mb-4 text-center font-mono text-lg font-semibold">
          RESET PASSWORD
        </h1>
        <div>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <button
          type="submit"
          disabled={formLoading}
          className="flex w-full items-center justify-center rounded-sm bg-black px-3 py-2 font-mono text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {formLoading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
        </button>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        {message && <p className="text-center text-xs text-green-600">{message}</p>}
      </form>
    </div>
  );
} 