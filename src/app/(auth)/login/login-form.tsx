"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="primary-button" disabled={pending} type="submit">
      {pending ? "Đang xác thực…" : "Đăng nhập"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(login, initialState);

  return (
    <form action={action} className="login-form">
      <label>
        Email công việc
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Mật khẩu
        <input name="password" type="password" autoComplete="current-password" minLength={8} required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
