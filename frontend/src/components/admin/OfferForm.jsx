"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createOffer, updateOffer } from "@/app/admin/actions";
import { OFFER_AUDIENCES } from "@/lib/site";
import { Field, Checkbox, FormMessage, SubmitButton } from "./form-bits";

const AUDIENCE_OPTIONS = Object.entries(OFFER_AUDIENCES).map(([value, label]) => ({
    value,
    label,
}));

// Sequelize's DATEONLY comes back as "YYYY-MM-DD", which is what a date input
// wants — but guard against a full timestamp just in case.
const dateValue = (value) => (value ? String(value).slice(0, 10) : "");

export default function OfferForm({ offer }) {
    const editing = Boolean(offer);
    const [state, formAction] = useActionState(editing ? updateOffer : createOffer, null);

    return (
        <form action={formAction} className="grid gap-8">
            {editing ? <input type="hidden" name="id" value={offer.id} /> : null}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="border border-rule bg-surface p-5 sm:p-6">
                    <h2 className="eyebrow mb-5">The offer</h2>

                    <div className="grid gap-4">
                        <Field
                            label="Title"
                            name="title"
                            required
                            defaultValue={offer?.title ?? ""}
                        />

                        <Field
                            label="Audience"
                            name="audience"
                            required
                            defaultValue={offer?.audience ?? "consumer"}
                            options={AUDIENCE_OPTIONS}
                        />

                        <Field
                            label="Description"
                            name="description"
                            rows={4}
                            defaultValue={offer?.description ?? ""}
                        />

                        <Field
                            label="Eligible products"
                            name="eligibleProducts"
                            rows={2}
                            defaultValue={(offer?.eligibleProducts ?? []).join(", ")}
                            placeholder="OrthoCare, MemoRest"
                            hint="Display names, separated by commas or new lines."
                        />

                        <Field
                            label="Terms"
                            name="terms"
                            rows={4}
                            defaultValue={offer?.terms ?? ""}
                        />
                    </div>
                </section>

                <div className="grid content-start gap-6">
                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Validity</h2>

                        <div className="grid gap-4">
                            <Field
                                label="Validity label"
                                name="validityLabel"
                                defaultValue={offer?.validityLabel ?? "Ongoing"}
                                hint="What visitors read, e.g. “Ongoing” or “01.04 – 30.04”."
                            />

                            <Field
                                label="Valid from"
                                name="validFrom"
                                type="date"
                                defaultValue={dateValue(offer?.validFrom)}
                            />

                            <Field
                                label="Valid to"
                                name="validTo"
                                type="date"
                                defaultValue={dateValue(offer?.validTo)}
                                hint="Dates are for your records — the label above is what is displayed."
                            />
                        </div>
                    </section>

                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Publication</h2>

                        <div className="grid gap-4">
                            <Checkbox
                                label="Shown on the offers page"
                                name="isActive"
                                defaultChecked={offer ? offer.isActive : true}
                            />

                            <Field
                                label="Sort order"
                                name="sortOrder"
                                type="number"
                                defaultValue={offer?.sortOrder ?? 0}
                                hint="Lower numbers come first."
                            />

                            <Field
                                label="Banner image URL"
                                name="bannerImage"
                                defaultValue={offer?.bannerImage ?? ""}
                                placeholder="https://…"
                            />

                            <Field
                                label="Scheme document URL"
                                name="documentUrl"
                                defaultValue={offer?.documentUrl ?? ""}
                                placeholder="https://…"
                                hint="A link visitors can download. Files are not uploaded here."
                            />
                        </div>
                    </section>
                </div>
            </div>

            <FormMessage state={state} />

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
                <SubmitButton pendingLabel={editing ? "Saving…" : "Creating…"}>
                    {editing ? "Save changes" : "Create offer"}
                </SubmitButton>

                <Link
                    href="/admin/offers"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
