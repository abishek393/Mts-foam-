"use client";

import { useState } from "react";
import Image from "next/image";
import { productImage } from "@/lib/api";

// One main plate with three thumbnails beneath, as specified in the design.
export default function ProductGallery({ product }) {
    const [active, setActive] = useState(0);

    const images = product.images?.length ? product.images : [null];

    return (
        <div>
            <div className="relative aspect-4/3 overflow-hidden border border-rule bg-panel">
                <Image
                    src={productImage(product, active)}
                    alt={`${product.name} — view ${active + 1}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                />
            </div>

            {images.length > 1 ? (
                <div className="mt-3 grid grid-cols-3 gap-3">
                    {images.slice(1, 4).map((image, index) => {
                        // Thumbnails start at index 1 of the image list.
                        const imageIndex = index + 1;

                        return (
                            <button
                                key={image ?? imageIndex}
                                type="button"
                                onClick={() => setActive(imageIndex)}
                                aria-label={`Show view ${imageIndex + 1}`}
                                aria-pressed={active === imageIndex}
                                className={`relative aspect-4/3 overflow-hidden border bg-panel transition-colors ${
                                    active === imageIndex
                                        ? "border-navy"
                                        : "border-rule hover:border-rule-strong"
                                }`}
                            >
                                <Image
                                    src={productImage(product, imageIndex)}
                                    alt=""
                                    fill
                                    sizes="20vw"
                                    className="object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            ) : null}

            <p className="mt-3 text-[0.8125rem] text-ink-faint">
                {product.group === "mattress"
                    ? "4STAR product photography. Images specific to this line are still to come."
                    : "Placeholder imagery pending 4STAR’s own photography."}
            </p>
        </div>
    );
}
