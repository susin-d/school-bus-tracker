import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

import { useAdminSession } from "../../core/auth";
import { useAdminRouter } from "../../core/router";

export function AdminAuthScreen() {
  const {
    signInWithEmailPassword,
    currentUser,
    authError,
    clearAuthError,
    isLoading
  } = useAdminSession();
  const { navigate } = useAdminRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const canSubmit = email.trim().length > 3 && password.length > 0;

  useEffect(() => {
    if (currentUser) {
      navigate("dashboard");
    }
  }, [currentUser, navigate]);

  async function handleSignIn(event?: FormEvent) {
    event?.preventDefault();
    if (!canSubmit || isLoading) {
      return;
    }
    clearAuthError();
    await signInWithEmailPassword(email.trim(), password);
  }

  return (
    <main className="auth-layout">
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="auth-panel glass-surface"
      >
        <div className="flex flex-col items-center gap-6 mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <p className="eyebrow !text-orange-600 font-bold mb-1">Secure Admin Access</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2 font-medium">
              Enter your credentials to manage the fleet.
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSignIn}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 ml-1" htmlFor="admin-login-email">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="admin-login-email"
                className="resource-input !pl-12 h-12"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@school.org"
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700" htmlFor="admin-login-password">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="admin-login-password"
                className="resource-input !pl-12 !pr-12 h-12"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            className="resource-action mt-4 h-14 text-base font-bold flex items-center justify-center gap-2 group"
            disabled={isLoading || !canSubmit}
            type="submit"
          >
            {isLoading ? "Authenticating..." : "Sign In to Console"}
            {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <AnimatePresence>
          {authError && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center text-sm font-bold text-red-600 bg-red-50 py-3 rounded-xl border border-red-100"
            >
              {authError}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-slate-400 mt-8 font-medium">
          Suraksha Fleet Management &bull; v1.2.0
        </p>
      </motion.section>
    </main>
  );
}
