// File: app/page.js

"use client";
import Link from 'next/link';
import { useTheme } from "next-themes";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Lightbulb, Wrench, Rocket, Sun, Moon, Users, Calendar, MapPin } from 'lucide-react';

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-background text-foreground font-sans">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tighter">IEDC Carmel</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Events</Link>
            <Link href="#team" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Team</Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">About</Link>
          </nav>
          <div className="flex items-center gap-3">
             <Button
              variant="ghost" size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/register"><Button variant="outline" className="hidden sm:flex">Join Us</Button></Link>
            <Link href="/register/login"><Button className="bg-primary text-primary-foreground hover:bg-primary/90">Login</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative w-full overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
           {/* 'Neony Vibey' Background Grid */}
          <div className="absolute inset-0 z-0 h-full w-full" style={{
            backgroundColor: 'var(--background)',
            backgroundImage: 'linear-gradient(to right, oklch(from var(--primary) l c h / 15%) 1px, transparent 1px), linear-gradient(to bottom, oklch(from var(--primary) l c h / 15%) 1px, transparent 1px)',
            backgroundSize: '6rem 6rem',
            opacity: 0.6,
            filter: 'blur(0.2px)',
          }}></div>
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
                From <span className="bg-gradient-to-r from-orange-400 via-primary to-red-500 bg-clip-text text-transparent">Idea</span> to <span className="bg-gradient-to-r from-red-500 via-primary to-orange-400 bg-clip-text text-transparent">Impact</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Welcome to the Innovation and Entrepreneurship Development Centre at Carmel Polytechnic College, Alappuzha. This is where your journey as a builder, creator, and innovator begins.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-primary text-primary-foreground px-8 py-6 text-base font-semibold hover:bg-primary/90">
                    Become a Member
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#about">
                  <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section (Our Mission) */}
        <section id="about" className="w-full bg-secondary/50 py-20 md:py-28">
          <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-2 md:px-6">
            <div className="flex flex-col items-center justify-center">
              <div className="w-full max-w-md h-80 rounded-2xl bg-card flex items-center justify-center">
                <Lightbulb className="h-32 w-32 text-primary opacity-30" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Our Mission</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">What is IEDC?</h2>
              <p className="text-muted-foreground md:text-lg">
                The IEDC is an initiative of the Kerala Startup Mission to build a vibrant startup ecosystem on campus. Our goal is to empower students with the skills, mentorship, and resources needed to transform innovative ideas into real-world projects and viable business ventures. We are the first step on the ladder to success.
              </p>
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section id="events" className="w-full py-20 md:py-28">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    {/* THIS IS NOW ON-BRAND */}
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Don&apos;t Miss Out</div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tighter sm:text-4xl">Upcoming Events</h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">Join our workshops, hackathons, and speaker sessions to learn, build, and connect.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* Event Card 1 */}
                    <Card className="transform border-border bg-card transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                        {/* THIS IS NOW ON-BRAND */}
                        <div className="h-48 w-full bg-secondary/50 rounded-t-lg flex items-center justify-center"><Calendar className="h-20 w-20 text-primary opacity-30"/></div>
                        <CardHeader>
                            <CardTitle>Intro to Web3 & Blockchain</CardTitle>
                            <CardDescription className="flex items-center pt-1"><MapPin className="mr-2 h-4 w-4"/>Seminar Hall | July 15, 2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">Learn More</Button>
                        </CardContent>
                    </Card>
                     {/* Event Card 2 */}
                    <Card className="transform border-border bg-card transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                        {/* THIS IS NOW ON-BRAND */}
                        <div className="h-48 w-full bg-secondary/50 rounded-t-lg flex items-center justify-center"><Wrench className="h-20 w-20 text-primary opacity-30"/></div>
                        <CardHeader>
                            <CardTitle>Hands-on IoT Workshop</CardTitle>
                            <CardDescription className="flex items-center pt-1"><MapPin className="mr-2 h-4 w-4"/>Electronics Lab | July 22, 2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">Learn More</Button>
                        </CardContent>
                    </Card>
                     {/* Event Card 3 */}
                    <Card className="transform border-border bg-card transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
                        {/* THIS IS NOW ON-BRAND */}
                        <div className="h-48 w-full bg-secondary/50 rounded-t-lg flex items-center justify-center"><Rocket className="h-20 w-20 text-primary opacity-30"/></div>
                        <CardHeader>
                            <CardTitle>Pitch Perfect: Idea Day</CardTitle>
                            <CardDescription className="flex items-center pt-1"><MapPin className="mr-2 h-4 w-4"/>Auditorium | Aug 5, 2025</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant="outline">Learn More</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Meet the Team Section */}
        <section id="team" className="w-full bg-secondary/50 py-20 md:py-28">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="mx-auto max-w-3xl text-center">
                    {/* THIS IS NOW ON-BRAND */}
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Our Leaders</div>
                    <h2 className="mt-2 text-3xl font-bold tracking-tighter sm:text-4xl">Meet the Core Team</h2>
                    <p className="mt-4 text-muted-foreground md:text-lg">The student force driving the IEDC mission forward.</p>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
                    {/* Team Member Placeholder */}
                    <div className="space-y-3 text-center">
                        {/* THIS IS NOW ON-BRAND */}
                        <div className="mx-auto h-28 w-28 rounded-full bg-card flex items-center justify-center"><Users className="h-12 w-12 text-primary opacity-40"/></div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">Nodal Officer</h3>
                            <p className="text-sm text-muted-foreground">Faculty Lead</p>
                        </div>
                    </div>
                     {/* All other team members follow the same pattern */}
                    <div className="space-y-3 text-center"><div className="mx-auto h-28 w-28 rounded-full bg-card flex items-center justify-center"><Users className="h-12 w-12 text-primary opacity-40"/></div><div className="space-y-1"><h3 className="font-semibold">CEO</h3><p className="text-sm text-muted-foreground">Student Lead</p></div></div>
                    <div className="space-y-3 text-center"><div className="mx-auto h-28 w-28 rounded-full bg-card flex items-center justify-center"><Users className="h-12 w-12 text-primary opacity-40"/></div><div className="space-y-1"><h3 className="font-semibold">CTO</h3><p className="text-sm text-muted-foreground">Technical Lead</p></div></div>
                    <div className="space-y-3 text-center"><div className="mx-auto h-28 w-28 rounded-full bg-card flex items-center justify-center"><Users className="h-12 w-12 text-primary opacity-40"/></div><div className="space-y-1"><h3 className="font-semibold">CFO</h3><p className="text-sm text-muted-foreground">Finance Lead</p></div></div>
                    <div className="space-y-3 text-center"><div className="mx-auto h-28 w-28 rounded-full bg-card flex items-center justify-center"><Users className="h-12 w-12 text-primary opacity-40"/></div><div className="space-y-1"><h3 className="font-semibold">CMO</h3><p className="text-sm text-muted-foreground">Marketing Lead</p></div></div>
                </div>
            </div>
        </section>
        
        {/* Final CTA */}
        <section className="w-full py-20 md:py-28">
            <div className="container mx-auto">
                {/* THIS IS NOW ON-BRAND */}
                <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-primary via-red-500 to-orange-500 p-8 text-center md:p-12">
                     <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Ready to Build the Future?</h2>
                     <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                         Join a community of thinkers, dreamers, and builders. Your IEDC membership is free and full of opportunities.
                     </p>
                     <Link className="mt-8 inline-block" href="/register">
                         <Button size="lg" variant="secondary" className="bg-background px-8 py-6 text-base font-semibold text-foreground hover:bg-background/90">
                           Join IEDC Today
                         </Button>
                     </Link>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border">
          <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
              <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {/* THIS IS NOW ON-BRAND */}
                    <Rocket className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold tracking-tighter">IEDC Carmel</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Carmel Polytechnic College, Alappuzha, Kerala</p>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                      <h3 className="font-semibold">Quick Links</h3>
                      <ul className="mt-4 space-y-2">
                          {/* THIS IS NOW ON-BRAND */}
                          <li><Link href="#about" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                          <li><Link href="#events" className="text-muted-foreground hover:text-primary">Events</Link></li>
                          <li><Link href="/register" className="text-muted-foreground hover:text-primary">Join Us</Link></li>
                      </ul>
                  </div>
                   <div>
                      <h3 className="font-semibold">Connect</h3>
                      <ul className="mt-4 space-y-2">
                          {/* THIS IS NOW ON-BRAND */}
                          <li><Link href="#" className="text-muted-foreground hover:text-primary">Instagram</Link></li>
                          <li><Link href="#" className="text-muted-foreground hover:text-primary">LinkedIn</Link></li>
                          <li><Link href="#" className="text-muted-foreground hover:text-primary">Email</Link></li>
                      </ul>
                  </div>
              </div>
               <div className="space-y-3">
                    <h3 className="font-semibold">Powered by</h3>
                    <p className="text-sm text-muted-foreground">Kerala Startup Mission</p>
              </div>
          </div>
           <div className="border-t border-border py-6">
              <p className="text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} IEDC Carmel Polytechnic College. All Rights Reserved.
              </p>
           </div>
      </footer>
    </div>
  );
}