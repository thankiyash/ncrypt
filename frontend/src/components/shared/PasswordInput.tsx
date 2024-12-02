import { useState, ChangeEvent } from "react";
import { Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordStrengthResult {
  score: number;
  maxScore: number;
  label: string;
  color: string;
}

interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
}

const calculatePasswordStrength = (
  password: string
): PasswordStrengthResult => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const strengthMap = {
    0: { label: "Too Weak", color: "text-red-500" },
    1: { label: "Too Weak", color: "text-red-500" },
    2: { label: "Fair", color: "text-yellow-500" },
    3: { label: "Fair", color: "text-yellow-500" },
    4: { label: "Good", color: "text-blue-500" },
    5: { label: "Strong", color: "text-green-500" },
    6: { label: "Very Strong", color: "text-green-500" },
  };

  return {
    score,
    maxScore: 6,
    label: strengthMap[score].label,
    color: strengthMap[score].color,
  };
};

const generatePassword = (
  options: PasswordGeneratorOptions = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  }
): string => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let chars = "";
  if (options.uppercase) chars += uppercaseChars;
  if (options.lowercase) chars += lowercaseChars;
  if (options.numbers) chars += numberChars;
  if (options.symbols) chars += symbolChars;

  let password = "";
  for (let i = 0; i < options.length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

const PasswordInput: React.FC<PasswordInputProps> = ({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const strength = calculatePasswordStrength(value);

  const handleGeneratePassword = (): void => {
    const newPassword = generatePassword();
    onChange(newPassword);
  };

  const handleCopyPassword = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          className="pr-24" // Increased padding to prevent overlap
        />
        <div className="absolute right-0 top-0 h-full flex items-center gap-2 mr-3">
          <button
            type="button"
            className="p-2 hover:text-foreground text-muted-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className="p-2 hover:text-foreground text-muted-foreground"
            onClick={handleGeneratePassword}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-2 hover:text-foreground text-muted-foreground"
            onClick={handleCopyPassword}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <br />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Password strength:
          </span>
          <span className={cn("text-sm font-medium", strength.color)}>
            {strength.label}
          </span>
        </div>

        <ul className="space-y-1">
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            At least 8 chars
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Uppercase
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Lowercase
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Numbers
          </li>
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Symbols
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordInput;
