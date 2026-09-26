// Size calculator — inches in, area/volume/metric out.
//
// The design document's worked example is the reference case:
//   72 × 60 × 6 in → 30.00 ft² · 15.00 ft³ · 183 × 152 cm · 6 in / 15 cm
// Every one of those dimensions is already a multiple of 6, so the cut-size
// rounding below leaves the reference case unchanged.

const SQ_IN_PER_SQ_FT = 144;
const CU_IN_PER_CU_FT = 1728;
const CM_PER_IN = 2.54;

// Length and width are cut in 6 inch steps, so anything in between is made —
// and charged — at the next step up. Ask for 11 in and you get a 12 in piece.
// Thickness is not stepped this way: foam sheets start at 0.5 in and mattresses
// run 4–10 in, so it is used exactly as entered.
export const CUT_STEP_IN = 6;

export function toCutSize(value) {
    const steps = value / CUT_STEP_IN;

    // A dimension that is already an exact multiple must not be nudged up by
    // floating point error — 30 / 6 landing on 5.000000000000001 would turn a
    // 30 in panel into a 36 in one.
    const whole =
        Math.abs(steps - Math.round(steps)) < 1e-9 ? Math.round(steps) : Math.ceil(steps);

    return whole * CUT_STEP_IN;
}

export const SIZE_PRESETS = [
    { key: "single", label: "Single", length: 72, width: 36 },
    { key: "double", label: "Double", length: 72, width: 48 },
    { key: "queen", label: "Queen", length: 72, width: 60 },
    { key: "king", label: "King", length: 78, width: 72 },
];

export function calculate({ length, width, thickness, quantity = 1 }) {
    const l = Number(length);
    const w = Number(width);
    const t = Number(thickness);

    // A blank or nonsense quantity means one piece, never zero — a total of
    // 0 ft² would read as an error rather than as an empty box.
    const parsedQuantity = Number.parseInt(quantity, 10);
    const pieces =
        Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

    const valid = [l, w, t].every((value) => Number.isFinite(value) && value > 0);

    if (!valid) return null;

    // What will actually be cut, and therefore what area and volume are worked
    // out from. Quoting the asked-for size would under-state both.
    const cutLength = toCutSize(l);
    const cutWidth = toCutSize(w);

    const rounded = cutLength !== l || cutWidth !== w;

    const areaSqFt = (cutLength * cutWidth) / SQ_IN_PER_SQ_FT;
    const volumeCuFt = (cutLength * cutWidth * t) / CU_IN_PER_CU_FT;

    return {
        // As entered.
        lengthIn: l,
        widthIn: w,
        thicknessIn: t,

        // As cut and charged.
        cutLengthIn: cutLength,
        cutWidthIn: cutWidth,
        rounded,

        areaSqFt,
        volumeCuFt,

        // Rounded to whole centimetres, matching the document's example
        // (72 in → 183 cm, 60 in → 152 cm). Metric describes the piece that
        // gets made, so it follows the cut size.
        lengthCm: Math.round(cutLength * CM_PER_IN),
        widthCm: Math.round(cutWidth * CM_PER_IN),
        thicknessCm: Math.round(t * CM_PER_IN),

        // Per piece, and across the whole order.
        pieces,
        totalAreaSqFt: areaSqFt * pieces,
        totalVolumeCuFt: volumeCuFt * pieces,
        totalAreaLabel: `${(areaSqFt * pieces).toFixed(2)} ft²`,
        totalVolumeLabel: `${(volumeCuFt * pieces).toFixed(2)} ft³`,

        areaLabel: `${areaSqFt.toFixed(2)} ft²`,
        volumeLabel: `${volumeCuFt.toFixed(2)} ft³`,
        metricLabel: `${Math.round(cutLength * CM_PER_IN)} × ${Math.round(cutWidth * CM_PER_IN)} cm`,
        thicknessLabel: `${t} in / ${Math.round(t * CM_PER_IN)} cm`,

        // The size that gets quoted and manufactured.
        sizeLabel: `${cutLength} × ${cutWidth} in`,

        // What the customer typed, kept so the difference can be shown rather
        // than the numbers silently changing under them.
        requestedSizeLabel: `${l} × ${w} in`,
    };
}
