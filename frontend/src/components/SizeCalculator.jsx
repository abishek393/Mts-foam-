"use client";

import { useState } from "react";
import { SIZE_PRESETS, calculate, CUT_STEP_IN } from "@/lib/calculator";
import FormField from "./FormField";
import InquiryButton from "./InquiryButton";

export default function SizeCalculator() {
    const [dimensions, setDimensions] = useState({
        length: "72",
        width: "60",
        thickness: "6",
        quantity: "1",
    });

    // "preset" or "custom". The fields were always editable, but nothing said
    // so — people assumed the four buttons were the only sizes on offer.
    const [mode, setMode] = useState("preset");

    const result = calculate(dimensions);

    const update = (key) => (event) =>
        setDimensions((current) => ({ ...current, [key]: event.target.value }));

    const applyPreset = (preset) => {
        setMode("preset");
        setDimensions((current) => ({
            ...current,
            length: String(preset.length),
            width: String(preset.width),
        }));
    };

    // Typing a dimension is itself a custom size, so the tab follows rather
    // than making someone switch mode before they can type.
    const updateSize = (key) => (event) => {
        setMode("custom");
        setDimensions((current) => ({ ...current, [key]: event.target.value }));
    };

    return (
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
                <div className="mb-5 flex gap-2">
                    {[
                        ["preset", "Standard size"],
                        ["custom", "Custom size"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setMode(value)}
                            aria-pressed={mode === value}
                            className={`border px-4 py-2 text-[0.875rem] transition-colors ${
                                mode === value
                                    ? "border-navy bg-navy text-white"
                                    : "border-rule-strong text-ink hover:bg-panel"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {mode === "preset" ? (
                    <p className="mb-3 text-[0.875rem] leading-6 text-ink-muted">
                        Pick a bed size, or switch to Custom size to enter your own
                        measurements.
                    </p>
                ) : (
                    <p className="mb-3 text-[0.875rem] leading-6 text-ink-muted">
                        Enter any measurement you need. Length and width are cut in{" "}
                        {CUT_STEP_IN} inch steps, so anything in between is made at the
                        next step up.
                    </p>
                )}

                <div
                    className={`mb-8 flex flex-wrap gap-2 ${
                        mode === "custom" ? "opacity-50" : ""
                    }`}
                >
                    {SIZE_PRESETS.map((preset) => {
                        const active =
                            Number(dimensions.length) === preset.length &&
                            Number(dimensions.width) === preset.width;

                        return (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => applyPreset(preset)}
                                aria-pressed={active}
                                className={`border px-4 py-2 text-[0.8125rem] transition-colors ${
                                    active
                                        ? "border-navy bg-navy text-white"
                                        : "border-rule-strong text-ink hover:bg-panel"
                                }`}
                            >
                                {preset.label}
                                <span className="ml-2 opacity-60">
                                    {preset.length}×{preset.width}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                        label="Length (in)"
                        name="length"
                        type="number"
                        min="1"
                        step="0.5"
                        value={dimensions.length}
                        onChange={updateSize("length")}
                    />

                    <FormField
                        label="Width (in)"
                        name="width"
                        type="number"
                        min="1"
                        step="0.5"
                        value={dimensions.width}
                        onChange={updateSize("width")}
                    />

                    <FormField
                        label="Thickness (in)"
                        name="thickness"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={dimensions.thickness}
                        onChange={update("thickness")}
                    />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <FormField
                        label="How many pieces"
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={dimensions.quantity}
                        onChange={update("quantity")}
                        hint="For the order total."
                    />
                </div>

                <p className="mt-4 text-[0.8125rem] leading-6 text-ink-faint">
                    Length and width are cut in {CUT_STEP_IN} in steps — anything in
                    between is made at the next step up. Foam sheets start at 0.5 in;
                    mattresses run from 4 to 10 in.
                </p>
            </div>

            <div className="border border-rule bg-panel p-6 sm:p-8">
                <p className="eyebrow mb-5">Result</p>

                {result ? (
                    <>
                        <p className="display mb-2 text-[1.75rem]">
                            {result.sizeLabel} × {result.thicknessIn} in
                        </p>

                        {/* Saying this plainly matters: the figures below are
                            worked out from the cut size, not from what was
                            typed, and that difference is what gets charged. */}
                        {result.rounded ? (
                            <p className="mb-8 border-l-2 border-accent pl-3 text-[0.8125rem] leading-6 text-ink-muted">
                                Rounded up from {result.requestedSizeLabel}. Length and
                                width are cut in {CUT_STEP_IN} in steps, so area and
                                volume below are for the {result.sizeLabel} piece you
                                would receive.
                            </p>
                        ) : (
                            <div className="mb-8" />
                        )}

                        <dl className="space-y-0">
                            <Row
                                label={
                                    result.pieces > 1 ? "Surface area (each)" : "Surface area"
                                }
                                value={result.areaLabel}
                            />
                            <Row
                                label={result.pieces > 1 ? "Volume (each)" : "Volume"}
                                value={result.volumeLabel}
                            />

                            {result.pieces > 1 ? (
                                <>
                                    <Row
                                        label={`Total area · ${result.pieces} pieces`}
                                        value={result.totalAreaLabel}
                                    />
                                    <Row
                                        label={`Total volume · ${result.pieces} pieces`}
                                        value={result.totalVolumeLabel}
                                    />
                                </>
                            ) : null}
                            <Row label="Metric" value={result.metricLabel} />
                            <Row label="Thickness" value={result.thicknessLabel} />
                        </dl>

                        <div className="mt-8 border-t border-rule pt-6">
                            <InquiryButton
                                source="calculator"
                                sizeLabel={result.sizeLabel}
                                thicknessIn={result.thicknessIn}
                                message={
                                    `Custom size — ${result.sizeLabel} × ${result.thicknessIn} in ` +
                                    `(${result.areaLabel}, ${result.volumeLabel}, ${result.metricLabel})` +
                                    (result.rounded
                                        ? `. Asked for ${result.requestedSizeLabel}, rounded up to the next ${CUT_STEP_IN} in cut size.`
                                        : "")
                                }
                                size="lg"
                                className="w-full"
                            >
                                Send these measurements
                            </InquiryButton>

                            <p className="mt-3 text-center text-[0.8125rem] text-ink-faint">
                                Your measurements are carried into the inquiry form.
                            </p>
                        </div>
                    </>
                ) : (
                    <p className="py-10 text-[0.9375rem] text-ink-muted">
                        Enter a length, width and thickness above — all three need to be
                        greater than zero.
                    </p>
                )}
            </div>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5">
            <dt className="table-head">{label}</dt>
            <dd className="text-[1.0625rem] text-ink">{value}</dd>
        </div>
    );
}
