"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";
import FormField from "./FormField";
import Button from "./Button";

const BUSINESS_TYPES = [
    { value: "retailer", label: "Retailer" },
    { value: "wholesaler", label: "Wholesaler" },
    { value: "distributor", label: "Distributor" },
    { value: "other", label: "Other" },
];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ".pdf,.jpg,.jpeg,.png";

export default function DealerForm() {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitted, setSubmitted] = useState(null);

    function validate(values, files) {
        const found = {};

        if (!values.fullName?.trim()) found.fullName = "Your name is required.";
        if (!values.businessName?.trim()) found.businessName = "Business name is required.";
        if (!values.location?.trim()) found.location = "Location is required.";

        if (!values.contactNumber?.trim()) {
            found.contactNumber = "A contact number is required.";
        }

        if (!values.email?.trim()) {
            found.email = "An email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            found.email = "Enter a valid email address.";
        }

        if (!files.registrationDoc || files.registrationDoc.size === 0) {
            found.registrationDoc = "Business registration document is required.";
        } else if (files.registrationDoc.size > MAX_FILE_BYTES) {
            found.registrationDoc = "File must be under 10 MB.";
        }

        if (files.vatDoc?.size > MAX_FILE_BYTES) {
            found.vatDoc = "File must be under 10 MB.";
        }

        return found;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        const values = Object.fromEntries(
            [...data.entries()].filter(([, value]) => typeof value === "string")
        );

        const files = {
            registrationDoc: data.get("registrationDoc"),
            vatDoc: data.get("vatDoc"),
        };

        const found = validate(values, files);
        setErrors(found);
        setFormError(null);

        if (Object.keys(found).length > 0) return;

        // An empty optional file input still submits a zero-byte entry.
        if (!files.vatDoc || files.vatDoc.size === 0) data.delete("vatDoc");

        setSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/api/dealer-applications`, {
                method: "POST",
                body: data,
            });

            const result = await res.json();

            if (!res.ok) {
                setFormError(
                    result.errors?.length
                        ? result.errors.join(" ")
                        : result.message || "Something went wrong."
                );
                setSubmitting(false);
                return;
            }

            setSubmitted(result.application);
            form.reset();
        } catch {
            setFormError("Cannot reach the server. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="border border-rule bg-panel p-8 sm:p-10">
                <p className="eyebrow mb-4">Application received</p>

                <h3 className="display mb-4 text-[1.75rem]">Thank you</h3>

                <p className="mb-6 max-w-lg text-[0.9375rem] leading-7 text-ink-soft">
                    We have your application for{" "}
                    <strong className="font-normal text-ink">
                        {submitted.businessName}
                    </strong>
                    . Our team will verify your documents and get in touch. Your
                    reference is <span className="text-ink">#{submitted.id}</span>.
                </p>

                <Button variant="secondary" onClick={() => setSubmitted(null)}>
                    Submit another application
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label="Your name"
                    name="fullName"
                    required
                    error={errors.fullName}
                    autoComplete="name"
                />

                <FormField
                    label="Business name"
                    name="businessName"
                    required
                    error={errors.businessName}
                    autoComplete="organization"
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label="Location"
                    name="location"
                    required
                    error={errors.location}
                    placeholder="City or district"
                />

                <FormField
                    label="Business type"
                    name="businessType"
                    options={BUSINESS_TYPES}
                    defaultValue="retailer"
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                    label="Contact number"
                    name="contactNumber"
                    type="tel"
                    required
                    error={errors.contactNumber}
                    placeholder="+977 0000 000000"
                    autoComplete="tel"
                />

                <FormField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    error={errors.email}
                    autoComplete="email"
                />
            </div>

            <FormField
                label="Product requirements"
                name="requirements"
                rows={4}
                placeholder="Which lines are you interested in, and roughly what volumes?"
            />

            <div className="border-t border-rule pt-5">
                <p className="table-head mb-1">Documents</p>

                <p className="mb-5 text-[0.8125rem] leading-6 text-ink-faint">
                    PDF, JPG or PNG, up to 10 MB each. These are stored privately and
                    seen only by our verification team.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                        label="Business registration"
                        name="registrationDoc"
                        type="file"
                        accept={ACCEPTED}
                        required
                        error={errors.registrationDoc}
                    />

                    <FormField
                        label="VAT / PAN certificate"
                        name="vatDoc"
                        type="file"
                        accept={ACCEPTED}
                        error={errors.vatDoc}
                        hint="Optional"
                    />
                </div>
            </div>

            {formError ? (
                <p
                    role="alert"
                    className="border border-accent bg-panel px-3.5 py-2.5 text-[0.875rem] text-accent"
                >
                    {formError}
                </p>
            ) : null}

            <Button type="submit" disabled={submitting} size="lg">
                {submitting ? "Submitting…" : "Submit Dealer Application"}
            </Button>
        </form>
    );
}
