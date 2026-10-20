"use client";

import { useState } from "react";

export function AdminPasswordFields() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const matches = confirmation.length > 0 && password === confirmation;

  return (
    <>
      <div className="password-control">
        <label htmlFor="password">Mật khẩu</label>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>
      <div className="password-control">
        <label htmlFor="confirmation">Nhập lại mật khẩu</label>
        <div className="password-field">
          <input
            id="confirmation"
            name="confirmation"
            type={showConfirmation ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={confirmation.length > 0 && !matches}
            aria-describedby={confirmation.length > 0 ? "password-match-status" : undefined}
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showConfirmation ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
            aria-pressed={showConfirmation}
            onClick={() => setShowConfirmation((current) => !current)}
          >
            {showConfirmation ? "Ẩn" : "Hiện"}
          </button>
        </div>
        {confirmation.length > 0 && (
          <p
            id="password-match-status"
            className={matches ? "password-match password-match-ok" : "password-match password-match-error"}
            role="status"
          >
            {matches ? "Mật khẩu khớp." : "Mật khẩu chưa khớp."}
          </p>
        )}
      </div>
    </>
  );
}
