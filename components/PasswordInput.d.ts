import type React from "react";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  setPassword: React.Dispatch<React.SetStateAction<string>>;
}

declare const PasswordInput: React.ForwardRefExoticComponent<
  PasswordInputProps & React.RefAttributes<HTMLInputElement>
>;

export default PasswordInput;
