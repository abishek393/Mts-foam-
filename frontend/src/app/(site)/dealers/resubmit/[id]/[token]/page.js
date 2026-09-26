import { API_BASE } from "@/lib/session-config";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import ResubmitForm from "@/components/ResubmitForm";

export const metadata = {
    title: "Update your documents",
    // A private link sent to one applicant; it has no business in search results.
    robots: { index: false, follow: false },
};

// The token in the URL is a credential, so this page must never be cached.
export const dynamic = "force-dynamic";

async function loadApplication(id, token) {
    try {
        const res = await fetch(
            `${API_BASE}/api/dealer-applications/${id}/resubmit/${token}`,
            { cache: "no-store", headers: { Accept: "application/json" } }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return data.application ?? null;
    } catch (error) {
        console.error("[resubmit]", error.message);
        return null;
    }
}

export default async function ResubmitPage({ params }) {
    const { id, token } = await params;
    const application = await loadApplication(id, token);

    // Expired, already used, or simply wrong — all answered the same way, so a
    // guessed link cannot be told apart from a real one that has run out.
    if (!application) {
        return (
            <div className="shell py-14 sm:py-20">
                <SectionHeading eyebrow="Dealership" title="This link has expired">
                    <p>
                        Upload links work once and for a limited time. If you still need
                        to send us a document, get in touch and we&apos;ll send a new one.
                    </p>
                </SectionHeading>

                <div className="mt-10 flex flex-wrap gap-3">
                    <Button href="/contact" size="lg">
                        Contact us
                    </Button>

                    <Button href="/dealers" variant="secondary" size="lg">
                        Back to dealers
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="shell py-14 sm:py-20">
            <div className="max-w-2xl">
                <SectionHeading
                    eyebrow="Dealership application"
                    title={`Update your documents, ${application.businessName}`}
                >
                    <p>
                        Your application is on hold rather than refused — we just need one
                        more thing before we can approve it.
                    </p>
                </SectionHeading>

                <div className="mt-10">
                    <ResubmitForm
                        id={id}
                        token={token}
                        application={application}
                    />
                </div>
            </div>
        </div>
    );
}
