'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';

const capabilities = [
  {
    label: 'Controlled tender lifecycle',
    description:
      'Draft, publish, review, and award sourcing events with role-aware actions and clear lifecycle states.',
  },
  {
    label: 'Sealed review window',
    description:
      'Reviewer access to supplier submissions stays closed until the tender deadline has passed.',
  },
  {
    label: 'Auditable scorecards',
    description:
      'Reviewers record criterion scores, rationale, and recommendations before a buyer can make an award decision.',
  },
  {
    label: 'Supplier workspaces',
    description:
      'Vendor organizations can browse open opportunities, submit proposal documents, and track bid status.',
  },
];

const workflow = [
  {
    step: '01',
    title: 'Prepare',
    text: 'Buyers create the scope, budget, deadline, and draft sourcing record.',
  },
  {
    step: '02',
    title: 'Publish',
    text: 'Suppliers see the opportunity and submit controlled proposal packages before close.',
  },
  {
    step: '03',
    title: 'Evaluate',
    text: 'Reviewers work independent scorecards after the submission window closes.',
  },
  {
    step: '04',
    title: 'Award',
    text: 'Buyers make an award only after active bids have been evaluated.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <main className="bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
              V
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight">Vendorse</span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Procurement workbench
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Join as supplier
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Sourcing without spreadsheet sprawl
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              A clearer workspace for tender decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Vendorse brings buyers, suppliers, and reviewers into one controlled
              procurement flow—from draft and publication through proposal review
              and award—without exposing evaluation internals to the wrong role.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Open workspace
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Register supplier organization
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ['Role-aware', 'Buyer, supplier, reviewer, admin'],
                ['Deadline-gated', 'Review access after close'],
                ['Evidence-led', 'Scores plus written rationale'],
              ].map(([title, detail]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-12 -z-10 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-4 shadow-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Buyer workspace
                  </p>
                  <p className="mt-1 text-sm font-black text-white">Procurement pulse</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Live
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['12', 'Tender portfolio'],
                  ['4', 'Active sourcing'],
                  ['7', 'Bids received'],
                  ['2', 'Closing soon'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-slate-900 p-4">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      Under review
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      Workplace fit-out package
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Submission window closed · evaluation queue active
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                    5 bids
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    ['Technical capability', 'Complete'],
                    ['Commercial value', 'In review'],
                    ['Delivery confidence', 'Pending'],
                  ].map(([label, state], index) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                      <span
                        className={
                          index === 0
                            ? 'text-xs font-bold text-emerald-700'
                            : index === 1
                              ? 'text-xs font-bold text-blue-700'
                              : 'text-xs font-bold text-slate-500'
                        }
                      >
                        {state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Product foundation
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Built around procurement work, not generic CRUD.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            The current build focuses on access boundaries, sourcing state, proposal
            handling, evaluation evidence, and award guardrails. More advanced
            contract, approval, and compliance workflows remain explicit roadmap
            items rather than marketing claims.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {capabilities.map((capability) => (
            <article
              key={capability.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h3 className="text-base font-black text-slate-950">
                {capability.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {capability.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Sourcing lifecycle
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              One flow, different responsibilities.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <article
                key={item.step}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-xs font-black text-blue-300">{item.step}</p>
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Ready to continue
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Enter your procurement workspace.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Existing buyer, reviewer, and admin users sign in. New public accounts
              are intentionally limited to supplier onboarding.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800"
            >
              Join as supplier
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
