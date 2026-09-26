"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { PRODUCT_GROUPS } from "@/lib/site";
import { API_BASE } from "@/lib/session-config";
import { Field, Checkbox, FormMessage, SubmitButton } from "./form-bits";

// Create and edit share this form — the only differences are which action runs
// and whether existing images are shown.

// A slug is derived from the name until the admin edits it by hand, at which
// point their value is left alone.
const slugify = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const listValue = (values) => (values ?? []).join(", ");

// Seeded placeholders are local paths under /images; uploaded imagery is served
// by the API. Resolved here rather than through lib/api so this client bundle
// does not pull the whole catalogue module in.
const imageSrc = (image) =>
    image?.startsWith("/uploads") ? `${API_BASE}${image}` : image;

// Checkboxes rather than a multiple <select>, which is close to unusable with
// a mouse and invisible on a phone.
function FeaturePicker({ options, selected, onToggle, className = "" }) {
    return (
        <div className={className}>
            <span className="mb-1.5 block text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                Features
                <span className="ml-1 text-brand-red">*</span>
            </span>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border border-rule bg-surface p-3 sm:grid-cols-3">
                {options.map((option) => (
                    <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 text-[0.875rem] text-ink"
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(option)}
                            onChange={() => onToggle(option)}
                            className="h-4 w-4 accent-[color:var(--color-navy)]"
                        />
                        {option}
                    </label>
                ))}
            </div>

            <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                Pick every one that applies. The first is used as the product&apos;s
                category for catalogue filtering.
            </p>
        </div>
    );
}

export default function ProductForm({ product }) {
    const editing = Boolean(product);
    const [state, formAction] = useActionState(
        editing ? updateProduct : createProduct,
        null
    );

    const [group, setGroup] = useState(product?.group ?? "mattress");
    const [name, setName] = useState(product?.name ?? "");
    const [slug, setSlug] = useState(product?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(editing);

    // Existing images the admin has not removed. Removal is staged here and
    // only committed when the form is saved.
    const [keptImages, setKeptImages] = useState(product?.images ?? []);

    // Files just picked, shown back before saving — without this the form gives
    // no sign that an image was attached at all.
    const [newFiles, setNewFiles] = useState([]);

    const previews = useMemo(
        () => newFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        [newFiles]
    );

    // Object URLs hold the file in memory until they are revoked.
    useEffect(
        () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
        [previews]
    );

    // The API accepts six files per upload and rejects the request beyond that.
    const tooMany = newFiles.length > 6;

    const categories =
        PRODUCT_GROUPS.find((entry) => entry.key === group)?.categories ?? [];

    // Features the admin has ticked. Seeded from the product, keeping only what
    // is valid for its group — an old value left over from a group change would
    // be rejected by the API.
    const [features, setFeatures] = useState(() => {
        const stored = product?.features ?? [];
        const valid = new Set(
            PRODUCT_GROUPS.find((entry) => entry.key === (product?.group ?? "mattress"))
                ?.categories ?? []
        );

        const picked = stored.filter((feature) => valid.has(feature));

        // A product created before features were a picker has only a category.
        if (picked.length === 0 && product?.category && valid.has(product.category)) {
            return [product.category];
        }

        return picked;
    });

    const toggleFeature = (feature) =>
        setFeatures((current) =>
            current.includes(feature)
                ? current.filter((entry) => entry !== feature)
                : [...current, feature]
        );

    // Switching group makes the previous group's features invalid, so they are
    // dropped rather than submitted for the API to reject.
    const changeGroup = (next) => {
        setGroup(next);

        const valid = new Set(
            PRODUCT_GROUPS.find((entry) => entry.key === next)?.categories ?? []
        );

        setFeatures((current) => current.filter((feature) => valid.has(feature)));
    };

    return (
        <form action={formAction} className="grid gap-8">
            {editing ? <input type="hidden" name="id" value={product.id} /> : null}

            {/* One hidden input per ticked feature, so the action reads them
                with getAll and the set travels as a real list. */}
            {features.map((feature) => (
                <input key={feature} type="hidden" name="features" value={feature} />
            ))}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="grid gap-6">
                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Identity</h2>

                        <div className="grid gap-4">
                            <Field
                                label="Product name"
                                name="name"
                                required
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    if (!slugTouched) setSlug(slugify(event.target.value));
                                }}
                            />

                            <Field
                                label="Slug"
                                name="slug"
                                required
                                value={slug}
                                onChange={(event) => {
                                    setSlugTouched(true);
                                    setSlug(event.target.value);
                                }}
                                hint={
                                    editing
                                        ? "Changing this changes the product&apos;s public URL, and breaks any link already shared."
                                        : "Lowercase words separated by hyphens. Becomes the product&apos;s URL."
                                }
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Group"
                                    name="group"
                                    required
                                    value={group}
                                    onChange={(event) => changeGroup(event.target.value)}
                                    options={PRODUCT_GROUPS.map((entry) => ({
                                        value: entry.key,
                                        label: entry.title,
                                    }))}
                                />

                                <Field
                                    label="Years of guarantee"
                                    name="warrantyYears"
                                    type="number"
                                    min={0}
                                    max={50}
                                    defaultValue={product?.warrantyYears ?? ""}
                                    hint="Leave blank if none is offered."
                                />
                            </div>

                            <Field
                                label="Short description"
                                name="shortDescription"
                                rows={2}
                                defaultValue={product?.shortDescription ?? ""}
                                maxLength={500}
                                hint="One or two lines, shown on catalogue cards."
                            />

                            <Field
                                label="Full description"
                                name="description"
                                rows={6}
                                defaultValue={product?.description ?? ""}
                            />
                        </div>
                    </section>

                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Specification</h2>

                        <div className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {group === "mattress" ? (
                                    <>
                                        <Field
                                            label="Firmness"
                                            name="firmness"
                                            defaultValue={product?.firmness ?? ""}
                                            placeholder="Medium firm"
                                        />

                                        <Field
                                            label="Core"
                                            name="coreSpec"
                                            defaultValue={product?.coreSpec ?? ""}
                                            placeholder="Bonnell spring over HR foam"
                                        />
                                    </>
                                ) : (
                                    <Field
                                        label="Density"
                                        name="density"
                                        defaultValue={product?.density ?? ""}
                                        placeholder="32 kg/m³"
                                        className="sm:col-span-2"
                                    />
                                )}
                            </div>

                            <Field
                                label="Key spec"
                                name="keySpec"
                                defaultValue={product?.keySpec ?? ""}
                                hint="The single line printed on the catalogue card."
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Thicknesses"
                                    name="thicknesses"
                                    rows={2}
                                    defaultValue={listValue(product?.thicknesses)}
                                    placeholder="6 in, 8 in, 10 in"
                                    hint="Separate with commas or new lines."
                                />

                                <Field
                                    label="Sizes"
                                    name="sizes"
                                    rows={2}
                                    defaultValue={listValue(product?.sizes)}
                                    placeholder="36 × 72 in, 60 × 72 in"
                                    hint="Separate with commas or new lines."
                                />

                                <Field
                                    label="Applications"
                                    name="applications"
                                    rows={2}
                                    defaultValue={listValue(product?.applications)}
                                    placeholder="Homes, Hotels, Hostels"
                                    hint="Separate with commas or new lines."
                                />

                                <FeaturePicker
                                    options={categories}
                                    selected={features}
                                    onToggle={toggleFeature}
                                    className="sm:col-span-2"
                                />
                            </div>

                            <Field
                                label="Lead time"
                                name="leadTime"
                                defaultValue={product?.leadTime ?? ""}
                                placeholder="7–10 working days"
                            />
                        </div>
                    </section>
                </div>

                <div className="grid content-start gap-6">
                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Visibility</h2>

                        <div className="grid gap-4">
                            <Checkbox
                                label="Listed on the site"
                                name="isActive"
                                defaultChecked={product ? product.isActive : true}
                                hint="Unlisted products stay in the database but disappear from the catalogue."
                            />

                            <Checkbox
                                label="Featured on the home page"
                                name="isFeatured"
                                defaultChecked={product?.isFeatured ?? false}
                            />

                            <Field
                                label="Sort order"
                                name="sortOrder"
                                type="number"
                                defaultValue={product?.sortOrder ?? 0}
                                hint="Lower numbers come first."
                            />
                        </div>
                    </section>

                    <section className="border border-rule bg-surface p-5 sm:p-6">
                        <h2 className="eyebrow mb-5">Images</h2>

                        {keptImages.length > 0 ? (
                            <ul className="mb-5 grid grid-cols-3 gap-2">
                                {keptImages.map((image) => (
                                    <li key={image} className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imageSrc(image)}
                                            alt=""
                                            className="aspect-square w-full border border-rule object-cover"
                                        />

                                        <input type="hidden" name="keepImages" value={image} />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setKeptImages((current) =>
                                                    current.filter((entry) => entry !== image)
                                                )
                                            }
                                            aria-label="Remove this image"
                                            className="absolute right-1 top-1 border border-rule bg-surface px-1.5 text-[0.75rem] leading-5 text-brand-red hover:bg-brand-red hover:text-white"
                                        >
                                            ×
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mb-5 text-[0.875rem] text-ink-faint">
                                No images yet. The catalogue falls back to a placeholder.
                            </p>
                        )}

                        <Field
                            label="Add images"
                            name="images"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(event) => setNewFiles([...event.target.files])}
                            hint="JPEG, PNG or WebP — up to six per upload, 5 MB each."
                        />

                        {previews.length > 0 ? (
                            <div className="mt-4">
                                <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
                                    Will be uploaded when you save
                                </p>

                                <ul className="grid grid-cols-3 gap-2">
                                    {previews.map((preview) => (
                                        <li key={preview.url}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={preview.url}
                                                alt=""
                                                className="aspect-square w-full border border-navy object-cover"
                                            />

                                            <span className="mt-1 block truncate text-[0.6875rem] text-ink-faint">
                                                {preview.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {tooMany ? (
                                    <p className="mt-2 text-[0.8125rem] text-brand-red">
                                        {newFiles.length} files selected — only six can be
                                        uploaded at a time. Remove some, or save twice.
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>

            <FormMessage state={state} />

            <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
                <SubmitButton
                    disabled={tooMany}
                    pendingLabel={editing ? "Saving…" : "Creating…"}
                >
                    {editing ? "Save changes" : "Create product"}
                </SubmitButton>

                <Link
                    href="/admin/products"
                    className="border border-rule-strong bg-surface px-5 py-2.5 text-[0.875rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
