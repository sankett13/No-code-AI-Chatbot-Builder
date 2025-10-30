"use client";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm flex justify-between items-center px-6 py-4 border-b">
      <div className="text-lg font-bold">AI Chatbot Builder</div>
      <nav className="flex gap-6">
        <a
          href="/register"
          className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
        >
          Get Started
        </a>
        <a
          href="/dashboard"
          className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
        >
          Dashboard
        </a>
        <a
          href="/blogs"
          className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
        >
          Blogs
        </a>
        <a
          href="/about"
          className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
        >
          About
        </a>
        <a
          href="/login"
          className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:bg-[#141414] after:w-0 hover:after:w-full after:transition-all after:duration-300 focus:outline-none focus-visible:after:w-full"
        >
          Sign In
        </a>
      </nav>
    </header>
  );
}
