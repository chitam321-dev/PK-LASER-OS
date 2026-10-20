"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  autoComplete: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

export function PasswordField({
  id,
  name,
  autoComplete,
  minLength,
  maxLength,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "Ẩn" : "Hiện"}
      </button>
    </div>
  );
}
