'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface NavigationItem {
  name: string;
  href: string;
  roles: string[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: ['ADMIN', 'BUYER', 'VENDOR', 'REVIEWER'],
  },
  {
    name: 'Tenders',
    href: '/tenders',
    roles: ['ADMIN', 'BUYER', 'VENDOR', 'REVIEWER'],
  },
  {
    name: 'Create tender',
    href: '/tenders/new',
    roles: ['ADMIN', 'BUYER'],
  },
  {
    name: 'My bids',
    href: '/bids',
    roles: ['VENDOR'],
  },
  {
    name: 'Evaluation queue',
    href: '/evaluations',
    roles: ['REVIEWER'],
  },
  {
    name: 'Users',
    href: '/users',
    roles: ['ADMIN'],
  },
];

function roleLabel(role?: string) {
  switch (role) {
    case 'BUYER':
      return 'Buyer workspace';
    case 'VENDOR':
      return 'Supplier workspace';
    case 'REVIEWER':
      return 'Evaluation workspace';
    case 'ADMIN':
      return 'Platform administration';
    default:
      return 'Procurement workspace';
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard' &&
      href !== '/tenders' &&
      pathname.startsWith(href + '/')) ||
    (href === '/tenders' &&
      pathname.startsWith('/tenders/') &&
      pathname !== '/tenders/new');

  return (
    <div className="min-h-screen text-slate-950">
      <Disclosure
        as="header"
        className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur"
      >
        {({ open }) => (
          <>
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 flex-1 items-center">
                <Link
                  href={user ? '/dashboard' : '/'}
                  className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
                    V
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black tracking-tight text-slate-950">
                      Vendorse
                    </span>
                    <span className="hidden truncate text-[11px] font-medium text-slate-500 sm:block">
                      {user ? roleLabel(user.role) : 'Auditable sourcing, one workspace'}
                    </span>
                  </span>
                </Link>

                {user && (
                  <nav className="ml-8 hidden items-stretch gap-1 lg:flex" aria-label="Primary">
                    {filteredNavigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={classNames(
                          isActive(item.href)
                            ? 'bg-slate-100 text-slate-950'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                          'rounded-lg px-3 py-2 text-sm font-semibold transition',
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                )}
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                {user ? (
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex max-w-xs items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-black text-blue-700">
                        {(user.name || user.email)[0].toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-44 truncate text-xs font-bold text-slate-900">
                          {user.name || user.email}
                        </span>
                        <span className="block max-w-44 truncate text-[11px] text-slate-500">
                          {user.organization?.name || user.role}
                        </span>
                      </span>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl focus:outline-none">
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user.email}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{roleLabel(user.role)}</p>
                        </div>
                        <div className="my-1 border-t border-slate-100" />
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={logout}
                              className={classNames(
                                active ? 'bg-slate-100' : '',
                                'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700',
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                      Join as supplier
                    </Link>
                  </>
                )}
              </div>

              <div className="ml-3 flex lg:hidden">
                <Disclosure.Button className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  <span className="sr-only">Toggle navigation</span>
                  {open ? (
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>

            <Disclosure.Panel className="border-t border-slate-100 bg-white lg:hidden">
              <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
                {user ? (
                  <>
                    <div className="mb-3 rounded-xl bg-slate-50 p-3">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.name || user.email}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user.organization?.name || roleLabel(user.role)}
                      </p>
                    </div>
                    {filteredNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.href}
                        as={Link}
                        href={item.href}
                        className={classNames(
                          isActive(item.href)
                            ? 'bg-slate-950 text-white'
                            : 'text-slate-700 hover:bg-slate-50',
                          'block rounded-xl px-3 py-3 text-sm font-semibold',
                        )}
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                    <button
                      type="button"
                      onClick={logout}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-semibold text-slate-700"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Disclosure.Button
                      as={Link}
                      href="/login"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800"
                    >
                      Sign in
                    </Disclosure.Button>
                    <Disclosure.Button
                      as={Link}
                      href="/register"
                      className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                    >
                      Join as supplier
                    </Disclosure.Button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
