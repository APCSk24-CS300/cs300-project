import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import Image from "next/image";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string | string[];
  }>;
};

async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;

  return (
    <main className="
            relative grid min-h-screen
            grid-cols-1 bg-[#f8f8f8]
            lg:grid-cols-[60%_40%]
        ">
      <div
        aria-hidden="true"
        className="
                    pointer-events-none absolute inset-y-0 right-0
                    hidden w-[45%] bg-cover bg-center
                    lg:block
                    bg-[url('/images/hcmus-campus.png')]
                "
      >
        <div className="
                    absolute inset-0
                    bg-gradient-to-r
                    from-[#f8f8f8] via-[#f8f8f8]/50 to-transparent
                " />
        <div className="
                    absolute inset-0
                    bg-gradient-to-t
                    from-[#f8f8f8]/50 via-transparent to-transparent
                " />
      </div>

      <section className="
                relative z-10 flex min-h-screen
                flex-col items-center
                px-6 pb-10 pt-7
                lg:col-start-1">
        <Link
          href="/"
          aria-label="Back to home"
          className="
                        absolute left-2 top-2
                        flex h-9 w-16 items-center justify-center
                        rounded-full bg-[#1b4da5] text-white
                        transition-colors hover:bg-[#153e89]
                    "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <header className="mb-15 mt-10 text-center">
          <Image
            src="/images/logo.svg"
            alt="myHCMUS Logo"
            width={180}
            height={45}
            priority
            className="mx-auto h-auto w-[200px]"
          />

          <p className="mt-1 text-xl text-[#25253b]">
            Managing activities and training scores at{" "}
            <strong className="font-bold text-[#10132f]">HCMUS.</strong>
          </p>
        </header>

        <div className="
                    w-full max-w-[630px]
                    rounded-[28px] bg-white
                    px-7 py-7
                    shadow-[0_8px_18px_rgba(0,0,0,0.16)]
                    sm:px-10
                ">
          <h2 className="
                        mb-3 text-3xl font-bold
                        tracking-tight text-[#10132f]
                    ">
            Sign In
          </h2>

          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
