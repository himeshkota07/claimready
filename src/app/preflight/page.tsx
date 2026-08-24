"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CITIZENS } from "@/lib/citizens";

export default function PreflightLoginPage() {
  const router = useRouter();
  const [uan, setUan] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const citizen = CITIZENS.find((c) => c.uan === uan.trim());
    if (!citizen) {
      setError("No demo profile found for that UAN. Try one of the demo profiles below.");
      return;
    }
    if (citizen.password !== password) {
      setError("Incorrect password for this demo profile.");
      return;
    }
    router.push(`/preflight/${citizen.uan}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Pre-flight check</h1>
      <p className="mt-2 text-sm text-slate-600">
        Mock UAN login — this pulls a simulated EPFO record, not a real one. No real credentials
        are collected or stored anywhere.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="uan" className="block text-sm font-medium text-slate-700">
            UAN
          </label>
          <input
            id="uan"
            value={uan}
            onChange={(e) => setUan(e.target.value)}
            placeholder="12-digit UAN"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            inputMode="numeric"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="demo123"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Log in and run check
        </button>
      </form>

      <div className="mt-8">
        <p className="text-sm font-medium text-slate-700">Demo profiles (all synthetic):</p>
        <div className="mt-2 grid gap-2">
          {CITIZENS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setUan(c.uan);
                setPassword(c.password);
              }}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-blue-400"
            >
              <span>
                <span className="font-medium text-slate-900">{c.label}</span>
                <span className="text-slate-500"> — {c.failureMode}</span>
              </span>
              <span className="font-mono text-xs text-slate-400">{c.uan}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
