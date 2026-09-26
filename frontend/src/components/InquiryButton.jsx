"use client";

import Button from "./Button";
import { useInquiry } from "./InquiryProvider";

// Opens the sitewide inquiry dialog, carrying whatever context the caller has —
// a product, a size from the calculator, a finder result.
export default function InquiryButton({
    productId,
    productName,
    sizeLabel,
    thicknessIn,
    quantity,
    message,
    source = "contact",
    children = "Send Inquiry",
    ...props
}) {
    const { openInquiry } = useInquiry();

    return (
        <Button
            onClick={() =>
                openInquiry({
                    productId,
                    productName,
                    sizeLabel,
                    thicknessIn,
                    quantity,
                    message,
                    source,
                })
            }
            {...props}
        >
            {children}
        </Button>
    );
}
