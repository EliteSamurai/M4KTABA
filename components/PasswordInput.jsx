"use client";

import React, { forwardRef } from "react";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PasswordInput = forwardRef(function PasswordInput(
  { setPassword, disabled, onChange: registeredOnChange, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setPassword(e.target.value);
    if (typeof registeredOnChange === "function") {
      registeredOnChange(e);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Lock className="h-4 w-4" />
        </div>
        <Input
          required
          type={showPassword ? "text" : "password"}
          className={cn("pl-10 pr-10")}
          placeholder="At least 8 characters"
          minLength={8}
          onChange={handleChange}
          disabled={disabled}
          id="password"
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    </div>
  );
});

export default PasswordInput;
