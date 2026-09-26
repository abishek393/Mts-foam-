"use client";

import { useRouter } from "next/navigation";
import AuthForm from "./AuthForm";
import { useInquiry } from "./InquiryProvider";
import { WHY_PANELS } from "@/lib/site";

// Shared shell for /login and /register.
export default function AuthPage({ mode, eyebrow, title, intro, next }) {
    const router = useRouter();
    const { setUser } = useInquiry();

    return (
        <div className="shell py-14 sm:py-20">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
                <div className="max-w-md">
                    <p className="eyebrow mb-4">{eyebrow}</p>

                    <h1 className="display mb-5 text-[2.25rem] sm:text-[2.75rem]">
                        {title}
                    </h1>

                    <p className="mb-10 text-[0.9375rem] leading-7 text-ink-soft">
                        {intro}
                    </p>

                    <AuthForm
                        mode={mode}
                        onSuccess={(user) => {
                            // Keep the header and inquiry dialog in step, then
                            // land wherever the visitor was headed — the account
                            // page unless a guard sent them here with ?next=.
                            setUser(user);
                            router.push(next ?? "/account");
                            router.refresh();
                        }}
                    />
                </div>

                <aside className="border border-rule bg-panel p-8 lg:p-10">
                    <p className="eyebrow mb-6">Why choose 4STAR</p>

                    <ol className="space-y-6">
                        {WHY_PANELS.slice(0, 4).map((panel, index) => (
                            <li key={panel.title} className="flex gap-5">
                                <span className="display shrink-0 text-[1.5rem] text-accent">
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                <span>
                                    <span className="mb-1 block text-[0.9375rem] text-ink">
                                        {panel.title}
                                    </span>

                                    <span className="block text-[0.875rem] leading-6 text-ink-muted">
                                        {panel.body}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ol>

                    <p className="mt-8 border-t border-rule pt-6 text-[0.8125rem] leading-6 text-ink-faint">
                        No payment or checkout is taken anywhere on this site. An account
                        exists so your inquiries stay in one place.
                    </p>
                </aside>
            </div>
        </div>
    );
}
