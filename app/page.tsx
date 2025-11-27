import Header from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURES, STEPS } from "@/lib/landing";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Home = () => {
  return (
    <>
      <Header />
      <div className="flex flex-col pt-16">
        {/* Hero Section */}
        <section className="mt-20 pb-12 space-y-10 md:space-y-20 px-5 min-h-full">
          <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Split expenses. Simplify life.
            </Badge>
            <h1 className="gradient-title mx-auto max-w-4xl text-4xl font-bold md:text-7xl">
              The smartest way to split expenses with friends
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Track shared expenss, split bills effortlessly, and settle up
              quickly. Never worry about who owns who again.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row justify-center">
              <Button
                asChild
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featues */}
        <section id="features" className="bg-gray-50 py-20 mt-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Features
            </Badge>
            <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
              Everything you need to split expenses
            </h2>
            <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Our platform provides all the tools you need to handle shared
              expenses with ease.
            </p>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ title, Icon, bg, color, description }) => (
                <Card
                  key={title}
                  className="flex flex-col items-center space-y-4 p-6 text-center"
                >
                  <div className={`rounded-full p-3 ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>

                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-gray-500">{description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge variant="outline" className="bg-green-100 text-green-700">
              How It Works
            </Badge>
            <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
              Splitting expenses has never been easier
            </h2>
            <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
              Follow these simple steps to start tracking and splitting expenses
              with friends.
            </p>

            <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
              {STEPS.map(({ label, title, description }) => (
                <div
                  key={label}
                  className="flex flex-col items-center space-y-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
                    {label}
                  </div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-gray-500 text-center">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call-to-Action */}
        <section className="py-20 gradient">
          <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
              Ready to simplify expense sharing?
            </h2>
            <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed">
              Join thousands of users who have made splitting expenses
              stress‑free.
            </p>
            <Button asChild size="lg" className="bg-green-800 hover:opacity-90">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-gray-50 py-12 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Splitr. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default Home;
