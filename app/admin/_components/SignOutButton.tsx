"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition"
    >
      Cerrar sesión
    </button>
  );
}
