import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/features/auth/components/LoginForm";
import { LogoutNotice } from "@/features/auth/components/LogoutNotice";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string | string[];
    reason?: string | string[];
  }>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = first(params.redirectTo);
  const reason = first(params.reason);

  return (
    <main className="relative grid min-h-screen grid-cols-1 bg-page lg:grid-cols-[60%_40%]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45%] bg-[url('/images/hcmus-campus.png')] bg-cover bg-center lg:block"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-page via-page/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-page/50 via-transparent to-transparent" />
      </div>

      <section className="relative z-10 flex min-h-screen flex-col items-center px-6 pb-10 pt-7 lg:col-start-1">
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute left-2 top-2 flex h-11 w-16 items-center justify-center rounded-pill bg-primary text-white transition-colors hover:bg-primary-dark"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <header className="mb-10 mt-10 text-center">
          <Image src="/images/logo.svg" alt="myHCMUS Logo" width={180} height={45} priority className="mx-auto h-auto w-[200px]" />
          <p className="mt-1 text-xl text-text">
            Managing activities and training scores at <strong className="font-bold text-heading">HCMUS.</strong>
          </p>
        </header>

        <div className="w-full max-w-[560px] rounded-[28px] bg-surface px-7 py-7 shadow-card sm:px-10">
          <h1 className="mb-5 text-3xl font-bold tracking-tight text-heading">Sign In</h1>
          <div className="mb-5 empty:hidden">
            <LogoutNotice reason={reason} />
          </div>
          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
