"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productImage } from "@/lib/api";
import { FINDER_STEPS, describeAnswers, recommend } from "@/lib/finder";
import Button from "./Button";
import InquiryButton from "./InquiryButton";

// Five-step guided finder. Steps can be skipped or stepped back, and a progress
// rule runs above the panel, per the design document.
export default function MattressFinder({ products }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [done, setDone] = useState(false);

    const step = FINDER_STEPS[stepIndex];
    const isLast = stepIndex === FINDER_STEPS.length - 1;

    const advance = () => {
        if (isLast) {
            setDone(true);
        } else {
            setStepIndex((index) => index + 1);
        }
    };

    const choose = (value) => {
        setAnswers((current) => ({ ...current, [step.key]: value }));
        advance();
    };

    const restart = () => {
        setAnswers({});
        setStepIndex(0);
        setDone(false);
    };

    if (done) {
        return (
            <Results
                answers={answers}
                products={products}
                onRestart={restart}
                onEdit={() => {
                    setDone(false);
                    setStepIndex(0);
                }}
            />
        );
    }

    const progress = ((stepIndex + 1) / FINDER_STEPS.length) * 100;

    return (
        <div className="mt-12 max-w-3xl">
            <div
                className="h-px w-full bg-rule"
                role="progressbar"
                aria-valuenow={stepIndex + 1}
                aria-valuemin={1}
                aria-valuemax={FINDER_STEPS.length}
                aria-label="Finder progress"
            >
                <div
                    className="h-px bg-navy transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-8 border border-rule bg-surface p-6 sm:p-10">
                <p className="eyebrow mb-4">
                    Step {String(stepIndex + 1).padStart(2, "0")} of{" "}
                    {String(FINDER_STEPS.length).padStart(2, "0")}
                </p>

                <h2 className="display mb-8 text-[1.75rem] sm:text-[2.25rem]">
                    {step.question}
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                    {step.options.map((option) => {
                        const selected = answers[step.key] === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => choose(option.value)}
                                aria-pressed={selected}
                                className={`flex min-h-[56px] items-center border px-5 text-left text-[0.9375rem] transition-colors ${
                                    selected
                                        ? "border-navy bg-navy text-white"
                                        : "border-rule text-ink hover:border-ink hover:bg-panel"
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
                    <button
                        type="button"
                        onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                        disabled={stepIndex === 0}
                        className="text-[0.875rem] text-ink-muted transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink-muted"
                    >
                        ← Back
                    </button>

                    <button
                        type="button"
                        onClick={advance}
                        className="text-[0.875rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-navy"
                    >
                        {isLast ? "Skip and see results" : "Skip this step"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Results({ answers, products, onRestart, onEdit }) {
    const matches = recommend(answers, products);
    const summary = describeAnswers(answers);

    return (
        <div className="mt-12">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
                <div>
                    <p className="eyebrow mb-3">Your matches</p>

                    <h2 className="display text-[2rem]">
                        {matches.length} closest {matches.length === 1 ? "match" : "matches"}
                    </h2>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-[0.875rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-navy"
                    >
                        Change answers
                    </button>

                    <button
                        type="button"
                        onClick={onRestart}
                        className="text-[0.875rem] text-ink-muted underline underline-offset-4 transition-colors hover:text-brand-red"
                    >
                        Start again
                    </button>
                </div>
            </div>

            {summary ? (
                <p className="mb-8 max-w-3xl text-[0.875rem] leading-6 text-ink-muted">
                    Based on: {summary}
                </p>
            ) : (
                <p className="mb-8 text-[0.875rem] text-ink-muted">
                    You skipped every step, so these are our most popular lines.
                </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map(({ product, score }, index) => (
                    <article
                        key={product.id}
                        className="flex flex-col border border-rule bg-surface"
                    >
                        <div className="relative aspect-4/3 overflow-hidden bg-panel">
                            <Image
                                src={productImage(product)}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, 33vw"
                                className="object-cover"
                            />

                            {index === 0 && score > 0 ? (
                                <span className="absolute left-0 top-0 bg-navy px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-white">
                                    Best match
                                </span>
                            ) : null}
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                            <p className="table-head mb-2">{product.category}</p>

                            <h3 className="display mb-2 text-[1.375rem]">{product.name}</h3>

                            <p className="mb-4 text-[0.875rem] leading-6 text-ink-muted">
                                {product.shortDescription}
                            </p>

                            <p className="mb-5 border-t border-rule pt-3 text-[0.8125rem] text-ink-soft">
                                {product.keySpec}
                            </p>

                            <div className="mt-auto flex flex-wrap gap-2">
                                <Link
                                    href={`/products/${product.slug}`}
                                    className="border border-rule-strong px-4 py-2 text-[0.8125rem] text-ink transition-colors hover:border-ink hover:bg-panel"
                                >
                                    Details
                                </Link>

                                <InquiryButton
                                    productId={product.id}
                                    productName={product.name}
                                    source="finder"
                                    message={summary ? `Finder answers — ${summary}` : undefined}
                                    size="sm"
                                >
                                    Inquire
                                </InquiryButton>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="mt-12 border-t border-rule pt-10">
                <p className="mb-5 max-w-2xl text-[0.9375rem] leading-7 text-ink-soft">
                    Not quite right? Every line can be made to your own measurements —
                    send us the dimensions and we&apos;ll quote against them.
                </p>

                <div className="flex flex-wrap gap-3">
                    <Button href="/size-calculator" variant="secondary">
                        Open the size calculator
                    </Button>

                    <Button href="/products" variant="ghost">
                        Browse everything
                    </Button>
                </div>
            </div>
        </div>
    );
}
