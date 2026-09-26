// Guided mattress finder — the five questions from the design document (page 7)
// and the scoring that turns answers into three recommendations.
//
// This is deliberately a pure function of (answers, products): no fetching, no
// React, so it can be reasoned about and tested on its own.

export const FINDER_STEPS = [
    {
        key: "firmness",
        question: "How firm do you like it?",
        options: [
            { value: "soft", label: "Soft" },
            { value: "medium", label: "Medium" },
            { value: "firm", label: "Firm" },
            { value: "unsure", label: "Not sure" },
        ],
    },
    {
        key: "size",
        question: "What size do you need?",
        options: [
            { value: "single", label: "Single" },
            { value: "double", label: "Double" },
            { value: "queenking", label: "Queen/King" },
            { value: "custom", label: "Custom" },
        ],
    },
    {
        key: "sleeper",
        question: "Who will sleep on it?",
        options: [
            { value: "adult", label: "One adult" },
            { value: "couple", label: "A couple" },
            { value: "child", label: "A child" },
            { value: "guest", label: "Guest room" },
        ],
    },
    {
        key: "band",
        question: "Which band are you in?",
        options: [
            { value: "value", label: "Value" },
            { value: "mid", label: "Mid" },
            { value: "premium", label: "Premium" },
            { value: "none", label: "No preference" },
        ],
    },
    {
        key: "need",
        question: "Anything specific?",
        options: [
            { value: "back", label: "Back support" },
            { value: "pressure", label: "Pressure relief" },
            { value: "cool", label: "Cooler sleep" },
            { value: "none", label: "Nothing specific" },
        ],
    },
];

// How each mattress line answers the five questions. Placeholder positioning,
// consistent with the placeholder catalogue.
const PROFILES = {
    "4star-orthocare": {
        firmness: ["firm"],
        size: ["single", "double", "queenking"],
        sleeper: ["adult", "couple"],
        band: ["mid"],
        need: ["back"],
    },
    "4star-memorest": {
        firmness: ["soft", "medium"],
        size: ["single", "double", "queenking"],
        sleeper: ["adult", "couple"],
        band: ["mid", "premium"],
        need: ["pressure"],
    },
    "4star-signature": {
        firmness: ["medium", "firm"],
        size: ["double", "queenking"],
        sleeper: ["couple", "adult"],
        band: ["premium"],
        need: ["back", "pressure"],
    },
    "4star-springline": {
        firmness: ["medium"],
        size: ["double", "queenking"],
        sleeper: ["couple", "adult"],
        band: ["mid"],
        need: ["cool"],
    },
    "4star-everyday": {
        firmness: ["medium", "firm"],
        size: ["single", "double"],
        sleeper: ["child", "guest", "adult"],
        band: ["value"],
        need: ["none"],
    },
    "4star-bespoke": {
        firmness: ["soft", "medium", "firm"],
        size: ["custom"],
        sleeper: ["adult", "couple", "child", "guest"],
        band: ["mid", "premium"],
        need: ["back", "pressure", "cool"],
    },
};

// The sample set is a dealer tool, not something to sleep on.
const EXCLUDED = new Set(["4star-sample-set"]);

// Size is the hardest constraint — a mattress that doesn't come in the size
// someone needs is the wrong answer regardless of how it feels.
const WEIGHTS = {
    firmness: 3,
    size: 4,
    sleeper: 2,
    band: 3,
    need: 3,
};

// "Not sure" and "No preference" mean the step shouldn't influence the result.
const NEUTRAL = new Set(["unsure", "none"]);

export function scoreProducts(answers, products) {
    const candidates = products.filter(
        (product) => product.group === "mattress" && !EXCLUDED.has(product.slug)
    );

    const scored = candidates.map((product) => {
        const profile = PROFILES[product.slug];

        // A line with no profile still ranks, just without any bonuses.
        if (!profile) return { product, score: 0, matched: [] };

        let score = 0;
        const matched = [];

        for (const step of FINDER_STEPS) {
            const answer = answers[step.key];

            // Skipped or neutral answers contribute nothing either way.
            if (!answer || NEUTRAL.has(answer)) continue;

            if (profile[step.key]?.includes(answer)) {
                score += WEIGHTS[step.key];
                matched.push(step.key);
            }
        }

        return { product, score, matched };
    });

    // Sort by score, then by the catalogue's own order so ties are stable
    // rather than dependent on array order.
    return scored.sort(
        (a, b) => b.score - a.score || a.product.sortOrder - b.product.sortOrder
    );
}

export function recommend(answers, products, limit = 3) {
    return scoreProducts(answers, products).slice(0, limit);
}

// Turns the answer set into a readable line for the inquiry message.
export function describeAnswers(answers) {
    return FINDER_STEPS.map((step) => {
        const answer = answers[step.key];
        if (!answer) return null;

        const option = step.options.find((entry) => entry.value === answer);
        return option ? `${step.question} ${option.label}` : null;
    })
        .filter(Boolean)
        .join(" · ");
}
