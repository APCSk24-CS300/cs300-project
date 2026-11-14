"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { CloseIcon } from "@/components/icons/CloseIcon";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useAuth } from "@/hooks/useAuth";
import { getLoginHref } from "@/libs/navigation";
import { scrollToSection, useHashScroll, useScrollSpy } from "@/libs/scroll";
import { cn } from "@/libs/cn";
import type { NavigationLink } from "@/types/navigation";

type SiteHeaderProps = {
  links: NavigationLink[];
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteHeader({ links }: SiteHeaderProps) {
  const { isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(true);
  const activeSection = useScrollSpy(links.map((link) => link.id));

  useHashScroll();

  const returnTo =
    activeSection && activeSection !== "home" ? `/#${activeSection}` : "/";
  const loginHref = getLoginHref(returnTo);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (menuOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        dialog
          .querySelector<HTMLElement>("[data-dialog-close]")
          ?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const closeMenu = (restoreFocus = true) => {
    restoreFocusRef.current = restoreFocus;
    setMenuOpen(false);
  };

  const handleDialogClose = () => {
    document.body.style.overflow = "";
    setMenuOpen(false);

    if (restoreFocusRef.current) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }

    restoreFocusRef.current = true;
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      closeMenu();
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || current === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const navigateToSection = (id: NavigationLink["id"]) => {
    scrollToSection(id);
  };

  const navigateFromMenu = (id: NavigationLink["id"]) => {
    closeMenu(false);
    scrollToSection(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.focus({ preventScroll: true });
    });
  };

  const authAction = isLoading ? (
    <span
      role="status"
      aria-label="Checking sign-in status"
      data-testid="auth-skeleton"
      className="inline-flex h-11 w-24 items-center justify-center"
    >
      <span
        aria-hidden="true"
        className="h-9 w-24 animate-pulse rounded-pill bg-slate-200 motion-reduce:animate-none"
      />
    </span>
  ) : (
    <Button href={loginHref} size="sm">
      Log In
    </Button>
  );

  return (
    <header className="fixed inset-x-0 top-4 z-50">
      <Container>
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 max-w-landing items-center justify-between gap-4 rounded-pill bg-surface/95 px-4 shadow-card backdrop-blur"
        >
          <Logo
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("home");
            }}
          />

          <ul className="hidden items-center gap-8 lg:flex">
            {links.map((link) => {
              const isActive = activeSection === link.id;

              return (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToSection(link.id);
                    }}
                    className={cn(
                      "inline-flex min-h-11 items-center border-b-2 text-sm transition-colors hover:text-primary",
                      isActive
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-text",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden lg:block">{authAction}</div>

          <button
            ref={triggerRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(true)}
            className="inline-flex size-11 items-center justify-center rounded-full text-text hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:hidden"
          >
            <MenuIcon aria-hidden="true" className="size-6" />
          </button>
        </nav>
      </Container>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="Site navigation"
        onClose={handleDialogClose}
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
        onClick={handleBackdropClick}
        onKeyDown={handleDialogKeyDown}
        className="m-0 ml-auto h-dvh max-h-none w-[min(86vw,360px)] max-w-none border-0 bg-surface p-0 text-text shadow-2xl backdrop:bg-black/40"
      >
        {menuOpen ? (
          <div className="flex min-h-full flex-col px-5 py-4">
            <div className="flex items-center justify-between">
              <Logo
                href="#home"
                onClick={(event) => {
                  event.preventDefault();
                  navigateFromMenu("home");
                }}
              />
              <button
                type="button"
                data-dialog-close
                aria-label="Close navigation menu"
                onClick={() => closeMenu()}
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <CloseIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            <ul className="mt-8 space-y-1">
              {links.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    aria-current={
                      activeSection === link.id ? "location" : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      navigateFromMenu(link.id);
                    }}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 text-base transition-colors hover:bg-slate-100",
                      activeSection === link.id
                        ? "font-semibold text-primary underline decoration-2 underline-offset-4"
                        : "text-text",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto border-t border-slate-200 pt-5">
              {isLoading ? (
                authAction
              ) : (
                <Button
                  href={loginHref}
                  size="md"
                  className="w-full"
                  onClick={() => closeMenu(false)}
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </header>
  );
}
