'use client';


import { useRouter } from "next/navigation";


 function LandingPage() {
    const router = useRouter();

    return (
      <div className="min-h-screen bg-white text-gray-900">

        {/* ================= NAVBAR ================= */}
        <header className="absolute top-3 left-0 z-50 w-full px-6 md:px-12">
          <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-white/95 px-6 py-3 shadow-md">

            <div className="text-xl font-bold">
              <span className="text-yellow-500">my</span>
              <span className="text-blue-900">HCMUS</span>
            </div>

            <div className="hidden items-center gap-10 text-sm font-medium md:flex">
              <a href="#" className="hover:text-blue-700">Home</a>
              <a href="#about" className="hover:text-blue-700">About Us</a>
              <a href="#activities" className="hover:text-blue-700">Activities</a>
              <a href="#services" className="hover:text-blue-700">Services</a>
              <a href="#help" className="hover:text-blue-700">Help</a>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="rounded-full bg-blue-800 px-7 py-2 text-sm text-white hover:bg-blue-900"
            >
              Log In
            </button>
          </nav>
        </header>


        {/* ================= HERO SECTION ================= */}
        <section className="relative flex min-h-[430px] items-center bg-cover bg-center px-8 pt-20 md:px-20"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.25)), url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2000')"
          }}
        >
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              <span className="text-yellow-500">Discover.</span>{" "}
              <span className="text-yellow-500">Participate.</span>{" "}
              <span className="text-white drop-shadow-lg">Grow.</span>
            </h1>

            <p className="mt-2 text-base text-gray-800 md:text-lg">
              A platform for the extracurricular activities
              <br />
              and student training scores.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/login")}
                className="rounded-full bg-white px-8 py-3 font-semibold text-blue-900 shadow-md hover:bg-gray-100"
              >
                Get Started
              </button>

              <a
                href="#activities"
                className="rounded-full bg-blue-800 px-8 py-3 font-semibold text-white shadow-md hover:bg-blue-900"
              >
                Explore the activities
              </a>
            </div>
          </div>
        </section>


        {/* ================= PLATFORM HIGHLIGHTS ================= */}
        <section id="about" className="relative z-10 mx-5 -mt-12 rounded-2xl bg-white px-8 py-12 shadow-lg md:mx-12 md:px-12">

          <p className="font-semibold uppercase tracking-wide text-blue-900">
            Platform Highlights
          </p>

          <div className="mt-3 grid gap-8 md:grid-cols-2">
            <h2 className="text-3xl font-bold leading-tight">
              Built to make
              <br />
              campus life easier
            </h2>

            <p className="text-sm text-gray-600">
              Bring activities, participation, training scores, and essential
              campus services together in one place, making student life
              easier to manage and stay connected.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">

            <div>
              <img
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=700"
                className="h-40 w-full rounded object-cover"
                alt="Discover activities"
              />
              <h3 className="mt-4 font-semibold">Discover & Join Activities</h3>
              <p className="mt-2 text-sm text-gray-600">
                Discover extracurricular activities, register for opportunities,
                and manage your participation with ease.
              </p>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=700"
                className="h-40 w-full rounded object-cover"
                alt="Student journey"
              />
              <h3 className="mt-4 font-semibold">Track Your Student Journey</h3>
              <p className="mt-2 text-sm text-gray-600">
                Keep track of your activities, attendance, training scores,
                and academic schedule in one place.
              </p>
            </div>

            <div>
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=700"
                className="h-40 w-full rounded object-cover"
                alt="Campus"
              />
              <h3 className="mt-4 font-semibold">Stay Connected with Campus</h3>
              <p className="mt-2 text-sm text-gray-600">
                Stay informed with timely notifications, university services,
                and personalized activity recommendations.
              </p>
            </div>

          </div>
        </section>


        {/* ================= FEATURED ACTIVITIES ================= */}
        <section id="activities" className="px-6 py-16 md:px-12">

          <div className="text-center">
            <p className="font-semibold uppercase text-blue-900">
              Activity Discovery
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Featured & Upcoming Activities
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">

            {/* Activity 1 */}
            <div className="rounded-xl border bg-white p-4 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=700"
                className="h-36 w-full rounded object-cover"
                alt="Workshop"
              />

              <h3 className="mt-3 text-sm font-bold">
                HỘI THẢO ĐỊNH HƯỚNG KIẾN THỨC VÀ KỸ NĂNG THIẾT KẾ VI MẠCH NĂM 2026
              </h3>

              <p className="mt-3 text-xs text-gray-500">
                Academia, Science
              </p>

              <p className="mt-2 text-xs text-gray-500">
                17/10/2026, 08:00 - 10:00
              </p>

              <p className="mt-1 text-xs text-gray-500">
                I.32, HCMUS
              </p>

              <div className="mt-5 flex justify-between text-xs">
                <span className="font-semibold text-green-600">
                  ● Registration Open
                </span>
                <button className="hover:text-blue-700">View</button>
              </div>
            </div>


            {/* Activity 2 */}
            <div className="rounded-xl border bg-white p-4 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=700"
                className="h-36 w-full rounded object-cover"
                alt="University event"
              />

              <h3 className="mt-3 text-sm font-bold">
                LOREM IPSUM IS SIMPLY DUMMY TEXT OF THE PRINTING AND TYPESETTING INDUSTRY.
              </h3>

              <p className="mt-3 text-xs text-gray-500">
                Key Tags
              </p>

              <p className="mt-2 text-xs text-gray-500">
                TIME
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Location
              </p>

              <div className="mt-5 flex justify-between text-xs">
                <span className="font-semibold text-gray-600">
                  ● Registration Status: Open
                </span>
                <button className="hover:text-blue-700">View</button>
              </div>
            </div>


            {/* Activity 3 - Small cards */}
            <div className="flex flex-col gap-3">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-xl border bg-white p-3 shadow-md"
                >
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400"
                    className="h-20 w-28 rounded object-cover"
                    alt="Activity"
                  />

                  <div className="flex-1">
                    <h3 className="text-xs font-bold">
                      LOREM IPSUM IS SIMPLY DUMMY TEXT OF THE PRINTING INDUSTRY...
                    </h3>

                    <p className="mt-2 text-[10px] text-gray-500">
                      Academia
                    </p>

                    <p className="text-[10px] text-gray-500">
                      17/10/2026, 08:00 - 10:00
                    </p>

                    <p className="text-[10px] text-gray-500">
                      I.32, HCMUS
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>


        {/* ================= UNIVERSITY SERVICES ================= */}
        <section id="services" className="bg-blue-800 px-8 py-16 text-white md:px-16">

          <p className="text-sm uppercase tracking-wide">
            HCMUS Services
          </p>

          <h2 className="mt-4 max-w-md text-3xl font-bold">
            Quick access to essential university services
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">

            {[
              { name: "Moodle", icon: "📗" },
              { name: "Tuition Payment", icon: "💳" },
              { name: "Library", icon: "📚" },
              { name: "Student Portal", icon: "🎓" },
              { name: "HCMUS Website", icon: "🌐" },
              { name: "Student Email", icon: "✉️" }
            ].map((service) => (
              <a
                key={service.name}
                href="#"
                className="flex items-center gap-4 rounded-2xl bg-white p-4 text-gray-900 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  {service.icon}
                </div>

                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-xs text-teal-600">Access →</p>
                </div>
              </a>
            ))}

          </div>
        </section>


        {/* ================= HELP / GUIDE ================= */}
        <section id="help" className="relative overflow-hidden px-8 py-16 md:px-16">

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-900" />

          <div className="relative z-10">
            <p className="font-semibold text-blue-900">
              Help / Guide
            </p>

            <h2 className="mt-5 max-w-xl text-3xl font-bold">
              Find quick guides and answers to common questions.
            </h2>

            <div className="mt-14 grid gap-8 md:grid-cols-2">

              {[
                { title: "GETTING STARTED", description: "Learn the basics" },
                { title: "ACTIVITIES", description: "How to register?" },
                { title: "TRAINING SCORE", description: "Track your DRS" },
                { title: "FAQ", description: "Common questions" }
              ].map((guide) => (
                <a
                  key={guide.title}
                  href="#"
                  className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-100 to-blue-100 p-5 transition hover:shadow-md"
                >
                  <div>
                    <h3 className="font-bold">{guide.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {guide.description}
                    </p>
                  </div>

                  <span className="text-lg">→</span>
                </a>
              ))}

            </div>
          </div>
        </section>


        {/* ================= FOOTER ================= */}
        <footer className="bg-blue-800 px-8 py-12 text-white md:px-16">

          <h2 className="text-2xl font-bold">
            myHCMUS
          </h2>

          <p className="mt-2 text-sm text-blue-100">
            Contact services, Hotlines...
          </p>

          <div className="mt-8 border-t border-blue-400 pt-5 text-xs text-blue-200">
            © 2026 myHCMUS. All rights reserved.
          </div>

        </footer>

      </div>
    );
  }

export default LandingPage;