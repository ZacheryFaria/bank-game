import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-bloomberg-amber" />
          </div>
          <h1 className="text-3xl font-bold text-bloomberg-amber uppercase tracking-wider">
            Bank Simulator
          </h1>
          <p className="text-muted-foreground">Sign in to manage your bank</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-bloomberg-cyan uppercase text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="banker@example.com"
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-bloomberg-cyan uppercase text-xs">
                Password
              </Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-bloomberg-blue hover:bg-bloomberg-blue/80 text-black font-bold uppercase"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              to="/register"
              className="text-bloomberg-amber hover:text-bloomberg-orange font-semibold"
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
