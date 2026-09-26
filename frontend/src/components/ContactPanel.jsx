"use client";

import Button from "./Button";
import InquiryButton from "./InquiryButton";

// Inquiries require an account, so the contact page explains that rather than
// showing a form that would fail on submit.
export default function ContactPanel({ signedIn }) {
    return (
        <div className="border border-rule bg-panel p-8 sm:p-10">
            <p className="eyebrow mb-4">Send an inquiry</p>

            <h2 className="display mb-5 text-[1.875rem]">
                {signedIn ? "What can we quote for you?" : "Sign in to send an inquiry"}
            </h2>

            {signedIn ? (
                <>
                    <p className="mb-8 text-[0.9375rem] leading-7 text-ink-soft">
                        Tell us the product, size, thickness and quantity you need. We
                        reply by phone, WhatsApp or email — whichever you prefer.
                    </p>

                    <InquiryButton source="contact" size="lg" className="w-full sm:w-auto">
                        Open the inquiry form
                    </InquiryButton>
                </>
            ) : (
                <>
                    <p className="mb-6 text-[0.9375rem] leading-7 text-ink-soft">
                        Inquiries are tied to an account so you can track quotes and
                        follow-ups in one place. Creating one takes a moment, and nothing
                        is charged at any point.
                    </p>

                    <div className="mb-8 flex flex-wrap gap-3">
                        <Button href="/register" size="lg">
                            Create an account
                        </Button>

                        <Button href="/login" variant="secondary" size="lg">
                            Sign in
                        </Button>
                    </div>

                    <p className="border-t border-rule pt-6 text-[0.875rem] leading-6 text-ink-muted">
                        In a hurry? Call or message us on WhatsApp using the details
                        alongside — those need no account.
                    </p>
                </>
            )}
        </div>
    );
}
