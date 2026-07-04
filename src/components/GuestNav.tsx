'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, LogOut, Menu, Pencil, UserCircle, UserRound, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { changeGuestName } from '@/app/actions/auth';
import { isWeddingDay, wedding } from '@/lib/wedding-config';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from './LanguageProvider';
import ProfileEditModal from './profile/ProfileEditModal';

const navLinks = [
  { href: '/home', labelKey: 'info' },
  { href: '/menu', labelKey: 'menu' },
  { href: '/gifts', labelKey: 'gifts' },
  { href: '/gallery', labelKey: 'gallery' },
] as const;

const guestRoutePrefixes = ['/home', '/menu', '/gifts', '/gallery'];

function MenuAlertBadge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`grid size-4 shrink-0 place-items-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white ${className}`}
      aria-label={label}
      title={label}
    >
      !
    </span>
  );
}

export default function GuestNav({
  guestName,
  dietaryComplete,
}: {
  guestName: string;
  dietaryComplete: boolean;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(guestName);
  const [nameDraft, setNameDraft] = useState(guestName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [dietarySavedThisSession, setDietarySavedThisSession] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activePath = guestRoutePrefixes.find((route) => pathname.startsWith(route));
  const links = isWeddingDay()
    ? navLinks.filter(({ href }) => href !== '/gifts')
    : navLinks;
  const accountLabel = displayName || t.nav.guest;
  const showMenuAlert = !dietaryComplete && !dietarySavedThisSession;

  useEffect(() => {
    function handleDietarySaved() {
      setDietarySavedThisSession(true);
    }

    window.addEventListener('dietary-preferences-saved', handleDietarySaved);
    return () => window.removeEventListener('dietary-preferences-saved', handleDietarySaved);
  }, []);

  function resetNameEditor() {
    setEditingName(false);
    setNameDraft(displayName);
    setNameError(null);
  }

  function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await changeGuestName(formData);
      if ('error' in result) {
        setNameError(
          result.error === 'name_taken' ? t.nav.nameTaken : (result.error ?? t.nav.nameError),
        );
        return;
      }
      setDisplayName(result.guestName);
      setNameDraft(result.guestName);
      setEditingName(false);
      setNameError(null);
    });
  }

  const accountMenu = (
    <div className="floral-card min-w-56 rounded-lg border border-greige bg-white shadow-lg p-2">
      {editingName ? (
        <form onSubmit={handleNameSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              name="name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              aria-label={t.nav.changeName}
              maxLength={50}
              required
              className="min-w-0 flex-1 rounded-md border border-greige px-3 py-2 font-body text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green"
            />
            <button
              type="submit"
              disabled={isPending}
              className="grid size-9 place-items-center rounded-md bg-green text-white transition-colors hover:bg-green-light disabled:opacity-60"
              aria-label={isPending ? t.nav.savingName : t.nav.saveName}
              title={isPending ? t.nav.savingName : t.nav.saveName}
            >
              <Check size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={resetNameEditor}
              className="grid size-9 place-items-center rounded-md text-gray-500 transition-colors hover:bg-cream hover:text-green"
              aria-label={t.nav.cancel}
              title={t.nav.cancel}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {nameError && (
            <p className="font-body text-xs text-red-600" role="alert">
              {nameError}
            </p>
          )}
        </form>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-green"
          >
            <Pencil size={16} aria-hidden="true" />
            {t.nav.changeName}
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              setDrawerOpen(false);
              setProfileModalOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-green"
          >
            <UserCircle size={16} aria-hidden="true" />
            {t.nav.editProfile}
          </button>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 font-body text-sm text-charcoal/80 transition-colors hover:bg-cream hover:text-green"
            >
              <LogOut size={16} aria-hidden="true" />
              {t.nav.logout}
            </button>
          </form>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-greige/80 bg-white/88 backdrop-blur-sm">
        <nav className="max-w-5xl mx-auto px-4 h-14 flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 truncate font-display text-2xl text-green">{wedding.coupleNames}</span>

          <div className="hidden md:flex items-center gap-6">
            {links.map(({ href, labelKey }) => {
              const active = activePath === href;
              const showAlert = href === '/menu' && showMenuAlert;
              const linkHref = showAlert ? '/menu#food-preferences' : href;
              return (
                <Link
                  key={href}
                  href={linkHref}
                  className={`relative flex items-center gap-1.5 font-body text-base pb-0.5 transition-colors duration-300 ${
                    active ? 'text-green' : 'text-charcoal/80 hover:text-green'
                  }`}
                >
                  {t.nav[labelKey]}
                  {showAlert && (
                    <MenuAlertBadge
                      label={t.nav.foodPreferencesNeeded}
                      className="absolute -bottom-1 -right-2"
                    />
                  )}
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px bg-green origin-left transition-transform duration-500 ease-[var(--ease-spring)]"
                    style={{ transform: active ? 'scaleX(1)' : 'scaleX(0)' }}
                  />
                </Link>
              );
            })}
            <LanguageSwitcher />
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex h-[46px] max-w-44 items-center gap-2 rounded-full border border-greige bg-white px-3 font-body text-sm text-charcoal/80 transition-colors hover:border-green hover:text-green"
                aria-expanded={accountOpen}
              >
                <UserRound size={16} aria-hidden="true" />
                <span className="truncate">{accountLabel}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2">
                  {accountMenu}
                </div>
              )}
            </div>
          </div>

          <button
            className="relative shrink-0 p-2 text-charcoal/80 md:hidden"
            aria-label={t.nav.openMenu}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-6" aria-hidden="true" />
            {showMenuAlert && (
              <MenuAlertBadge
                label={t.nav.foodPreferencesNeeded}
                className="absolute bottom-1 right-1"
              />
            )}
          </button>
        </nav>
      </header>

      <div
        className={`fixed inset-0 z-50 flex transition-all duration-300 ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`flex-1 bg-black/30 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={`w-64 bg-white h-full shadow-xl flex flex-col pt-6 px-6 gap-6 transition-transform duration-300 ease-[var(--ease-drawer)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <button
            className="self-end text-gray-500"
            aria-label={t.nav.closeMenu}
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
          <LanguageSwitcher compact />
          <div
            className={`transition-all duration-300 ${drawerOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
            style={{ transitionDelay: drawerOpen ? '80ms' : '0ms' }}
          >
            <div className="mb-2 flex items-center gap-2 font-body text-base text-green">
              <UserRound size={16} aria-hidden="true" />
              <span className="truncate">{accountLabel}</span>
            </div>
            {accountMenu}
          </div>
          {links.map(({ href, labelKey }, i) => {
            const active = activePath === href;
            const showAlert = href === '/menu' && showMenuAlert;
            const linkHref = showAlert ? '/menu#food-preferences' : href;
            return (
              <Link
                key={href}
                href={linkHref}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 font-body text-lg transition-all duration-400 ${
                  active ? 'text-green' : 'text-charcoal/80'
                } ${drawerOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                style={{ transitionDelay: drawerOpen ? `${i * 70 + 140}ms` : '0ms' }}
              >
                <span
                  className="h-4 w-0.5 rounded-full bg-green transition-all duration-500 ease-[var(--ease-back)]"
                  style={{
                    opacity: active ? 1 : 0,
                    transform: active ? 'scaleY(1)' : 'scaleY(0)',
                  }}
                />
                <span className="relative inline-flex pb-0.5">
                  {t.nav[labelKey]}
                  {showAlert && (
                    <MenuAlertBadge
                      label={t.nav.foodPreferencesNeeded}
                      className="absolute -bottom-1 -right-2"
                    />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {profileModalOpen && (
        <ProfileEditModal guestName={displayName} onClose={() => setProfileModalOpen(false)} />
      )}
    </>
  );
}

