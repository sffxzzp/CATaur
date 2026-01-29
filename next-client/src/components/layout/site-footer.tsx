import { Logo } from "@/components/branding/logo";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "Platform",
    items: [
      { label: "Candidate Experience", href: "/" },
      { label: "Recruiter Workspace", href: "#" },
      { label: "Client Portal", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Implementation", href: "#" },
      { label: "AI Toolkit", href: "#" },
      { label: "Support", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    // Temporarily hiding footer for launch
    <></>
    // <footer className="border-t border-border/70 bg-white/80 backdrop-blur">
    //   <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
    //     <div className="space-y-6">
    //       <Logo showText className="pointer-events-none" />
    //       <p className="max-w-sm text-sm leading-relaxed text-muted">
    //         CATaur Talent Suite is an open-source ATS that consolidates recruiter, candidate, and client workflows in one place.
    //       </p>
    //       <div className="text-xs text-muted-foreground">
    //         © {new Date().getFullYear()} CATaur Labs. All rights reserved.
    //       </div>
    //     </div>
    //     {FOOTER_LINKS.map((column) => (
    //       <div key={column.title} className="space-y-5">
    //         <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
    //           {column.title}
    //         </h4>
    //         <ul className="space-y-3 text-sm text-muted">
    //           {column.items.map((item) => (
    //             <li key={item.label}>
    //               <Link
    //                 href={item.href}
    //                 className="transition-colors hover:text-foreground"
    //               >
    //                 {item.label}
    //               </Link>
    //             </li>
    //           ))}
    //         </ul>
    //       </div>
    //     ))}
    //   </div>
    // </footer>
  );
}
