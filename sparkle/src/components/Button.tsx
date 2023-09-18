import React, { ComponentType, MouseEvent, ReactNode } from "react";

import { ChevronDown, ChevronUpDown } from "@sparkle/icons/solid";
import { classNames } from "@sparkle/lib/utils";

import { Icon, IconProps } from "./Icon";
import { Tooltip, TooltipProps } from "./Tooltip";

export type ButtonProps = {
  variant?:
    | "primary"
    | "primaryWarning"
    | "secondary"
    | "secondaryWarning"
    | "tertiary";
  type?: "button" | "menu" | "select";
  size?: "xs" | "sm" | "md";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  label: string;
  labelVisible?: boolean;
  icon?: ComponentType;
  className?: string;
  tooltipPosition?: TooltipProps["position"];
};

const sizeClasses = {
  xs: "s-gap-x-1 s-px-3 s-py-1.5 s-text-xs s-font-semibold",
  sm: "s-gap-x-1 s-px-4 s-py-2 s-text-sm s-font-semibold",
  md: "s-gap-x-1.5 s-px-5 s-py-3 s-text-base s-font-bold",
};

const containerClasses = {
  xs: "s-px-0.5",
  sm: "s-px-1",
  md: "s-px-1",
};

const variantClasses = {
  primary: {
    base: "s-text-white s-bg-action-500 s-border-action-600",
    hover: "hover:s-bg-action-400 hover:s-border-action-500",
    active: "active:s-bg-action-600 active:s-border-action-700",
    disabled: "s-text-white s-bg-element-500 s-border-element-500",
    dark: {
      base: "dark:s-bg-action-500-dark dark:s-border-action-600-dark",
      hover:
        "dark:hover:s-bg-action-500-dark dark:hover:s-border-action-500-dark",
      active:
        "dark:active:s-bg-action-600-dark dark:active:s-border-action-700-dark",
      disabled:
        "s-text-white dark:s-bg-element-600-dark dark:s-border-element-500-dark",
    },
  },
  primaryWarning: {
    base: "s-text-white s-bg-warning-500 s-border-warning-600",
    hover: "hover:s-bg-warning-400 hover:s-border-warning-500",
    active: "active:s-bg-warning-600 active:s-border-warning-700",
    disabled: "s-text-white s-bg-element-500 s-border-element-500",
    dark: {
      base: "dark:s-bg-warning-500-dark dark:s-border-warning-600-dark",
      hover:
        "dark:hover:s-bg-warning-500-dark dark:hover:s-border-warning-500-dark",
      active:
        "dark:active:s-bg-warning-600-dark dark:active:s-border-warning-700-dark",
      disabled:
        "s-text-white dark:s-bg-element-600-dark dark:s-border-element-500-dark",
    },
  },
  secondary: {
    base: "s-text-action-500 s-border-structure-200 s-bg-structure-0",
    hover: "hover:s-bg-action-50 hover:s-border-action-200",
    active: "active:s-bg-action-100 active:s-border-action-500",
    disabled: "s-text-element-500 s-border-structure-200 s-bg-structure-0",
    dark: {
      base: "dark:s-text-action-500-dark dark:s-border-structure-300-dark dark:s-bg-structure-50-dark",
      hover:
        "dark:hover:s-bg-action-50-dark dark:hover:s-border-action-300-dark",
      active:
        "dark:active:s-bg-action-100-dark dark:active:s-border-action-500-dark",
      disabled:
        "dark:s-text-action-500-dark dark:s-border-structure-200-dark dark:s-bg-structure-0-dark",
    },
  },
  secondaryWarning: {
    base: "s-text-warning-500 s-border-structure-200 s-bg-structure-0",
    hover: "hover:s-bg-warning-50 hover:s-border-warning-200",
    active: "active:s-bg-warning-100 active:s-border-warning-500",
    disabled: "s-text-element-500 s-border-structure-200 s-bg-structure-0",
    dark: {
      base: "dark:s-text-warning-500-dark dark:s-border-structure-300-dark dark:s-bg-structure-50-dark",
      hover:
        "dark:hover:s-bg-warning-50-dark dark:hover:s-border-warning-300-dark",
      active:
        "dark:active:s-bg-warning-100-dark dark:active:s-border-warning-500-dark",
      disabled:
        "dark:s-text-action-500-dark dark:s-border-structure-200-dark dark:s-bg-structure-0-dark",
    },
  },
  tertiary: {
    base: "s-text-element-800 s-border-structure-200 s-bg-structure-0",
    hover: "hover:s-bg-action-50 hover:s-border-action-200",
    active: "active:s-bg-action-100 active:s-border-action-500",
    disabled: "s-text-element-500 s-border-structure-200 s-bg-structure-0",
    dark: {
      base: "dark:s-text-element-700-dark dark:s-border-structure-300-dark dark:s-bg-structure-50-dark",
      hover:
        "dark:hover:s-bg-action-50-dark dark:hover:s-border-action-300-dark",
      active:
        "dark:active:s-bg-action-100-dark dark:active:s-border-action-500-dark",
      disabled:
        "dark:s-text-action-500-dark dark:s-border-structure-200-dark dark:s-bg-structure-0-dark",
    },
  },
};

const transitionClasses =
  "s-transition-all s-ease-out s-duration-400 hover:s-scale-100 hover:s-drop-shadow-md active:s-scale-95 active:s-drop-shadow-none s-cursor-pointer";

export function Button({
  variant = "primary",
  type = "button",
  size = "sm",
  onClick,
  disabled = false,
  labelVisible = true,
  label,
  icon,
  className = "",
  tooltipPosition = "above",
}: ButtonProps) {
  const buttonClasses = classNames(
    "s-inline-flex s-items-center s-border s-scale-95 s-box-border s-rounded-full s-whitespace-nowrap",
    sizeClasses[size],
    !disabled ? transitionClasses : "",
    !disabled ? variantClasses[variant]?.base : "",
    !disabled ? variantClasses[variant]?.hover : "",
    !disabled ? variantClasses[variant]?.active : "",
    disabled ? variantClasses[variant]?.disabled : "",
    variantClasses[variant]?.dark?.base,
    variantClasses[variant]?.dark?.hover,
    variantClasses[variant]?.dark?.active,
    variantClasses[variant]?.dark.disabled,
    disabled ? "s-cursor-default" : "",
    className
  );

  const finalContainerClasses = classNames(containerClasses[size]);

  return labelVisible ? (
    <button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {icon && <Icon visual={icon} size={size as IconProps["size"]} />}
      <div className={finalContainerClasses}>{label}</div>
      {type === "menu" && (
        <Icon
          className="s-opacity-50"
          visual={ChevronDown}
          size={size as IconProps["size"]}
        />
      )}
      {type === "select" && (
        <Icon
          className="s-opacity-60"
          visual={ChevronUpDown}
          size={size as IconProps["size"]}
        />
      )}
    </button>
  ) : (
    <Tooltip label={label} position={tooltipPosition}>
      <button
        type="button"
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
      >
        {icon && <Icon visual={icon} size={size as IconProps["size"]} />}
      </button>
    </Tooltip>
  );
}

interface ButtonBarProps {
  children: ReactNode;
  className?: string;
}

Button.List = function ({ children, className }: ButtonBarProps) {
  return (
    <div className={classNames(className ? className : "", "s-flex")}>
      <div className={"s-flex s-flex-row s-gap-1"}>{children}</div>
    </div>
  );
};
