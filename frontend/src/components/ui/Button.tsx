import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "warning" | "info" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: ReactNode;
}

/** Shared accessible action primitive for new and progressively migrated UI controls. */
export default function Button({ children, variant = "primary", icon, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`ui-button ui-button--${variant} ${className}`.trim()} {...props}>
    {icon && <span className="ui-button__icon" aria-hidden="true">{icon}</span>}
    <span>{children}</span>
  </button>;
}
