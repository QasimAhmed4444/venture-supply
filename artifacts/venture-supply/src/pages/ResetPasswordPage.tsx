import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, KeyRound, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export function ResetPasswordPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const result = await apiFetch<{ ok: boolean; token?: string; message: string }>(
        "/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      if (result.ok) {
        if (result.token) {
          setToken(result.token);
        }
        setStep("reset");
        toast({
          title: "Reset token issued",
          description: result.token
            ? "Your reset token has been pre-filled below."
            : result.message,
        });
      }
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err.message ?? "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiFetch<{ ok: boolean; message: string }>(
        "/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );
      if (result.ok) {
        toast({ title: "Password updated", description: "You can now sign in with your new password." });
        setLocation("/login");
      }
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message ?? "Invalid or expired token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex cursor-pointer">
            <Logo size="lg" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-bold">
                {step === "request" ? "Forgot Password" : "Set New Password"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "request"
                  ? "Enter your email address to receive a reset token."
                  : "Enter the token and your new password."}
              </p>
            </div>

            {step === "request" ? (
              <form className="space-y-4" onSubmit={handleRequestReset}>
                <div>
                  <Label>Email address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.sa"
                      className="pl-9"
                      required
                      data-testid="input-forgot-email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                  data-testid="button-forgot-submit"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Sending…</>
                    : "Send Reset Token"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <div>
                  <Label>Reset Token</Label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste your reset token"
                      className="pl-9 font-mono text-xs"
                      required
                      data-testid="input-reset-token"
                    />
                  </div>
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                  data-testid="button-reset-submit"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> Updating…</>
                    : "Update Password"}
                </Button>
                <button
                  type="button"
                  className="text-sm text-secondary hover:underline w-full text-center"
                  onClick={() => setStep("request")}
                >
                  Request a new token
                </button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login">
            <span className="hover:text-foreground cursor-pointer inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
