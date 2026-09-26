import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts, getOffers } from "@/lib/api";
import { CONTACT, PRODUCT_GROUPS, SITE, WHY_PANELS } from "@/lib/site";
import Button from "@/components/Button";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import OfferCard from "@/components/OfferCard";
import CTASection from "@/components/CTASection";
import InquiryButton from "@/components/InquiryButton";
import CompareBar from "@/components/CompareBar";
import Reveal from "@/components/Reveal";
import { FINDER_STEPS } from "@/lib/finder";

export default async function HomePage() {
  const [featured, offers] = await Promise.all([
    getFeaturedProducts(),
    getOffers(),
  ]);

  return (
    <>
      {/* 1. Hero */}
      <section className="shell pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Reveal as="p" className="eyebrow mb-6">
              {SITE.fullName}
            </Reveal>

            <Reveal
              as="h1"
              delay={90}
              className="display text-[2.75rem] leading-[1.05] sm:text-[3.75rem] lg:text-[4.25rem]"
            >
              Comfort designed
              <br />
              for better living
            </Reveal>

            <p className="mt-7 max-w-xl text-[1.0625rem] leading-8 text-ink-soft">
              Mattresses and polyurethane foam made under one roof — thirteen
              lines across orthopedic, memory foam, premium and everyday builds,
              plus foam supplied by sheet, block or finished cut.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/products" size="lg">
                Explore Mattresses
              </Button>

              <Button href="/find-mattress" variant="secondary" size="lg">
                Find Your Mattress
              </Button>
            </div>

            {/* Three figures beneath a hairline rule, per the design. */}
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-rule pt-7">
              {[
                ["Product lines", "13"],
                ["Interactive tools", "6"],
                ["Conversion", "Inquiry"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="table-head mb-2">{label}</dt>
                  <dd className="display text-[1.75rem]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A cut-out, not a photo in a frame: no panel, no border, no crop.
              The mattress sits on the page itself and is grounded by a soft
              shadow that follows its silhouette rather than a box. */}
          <Reveal delay={240} className="self-center">
            <Image
              src="/images/products/mattress-hero.png"
              alt="A 4STAR mattress"
              width={908}
              height={443}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full drop-shadow-[0_28px_34px_rgba(23,23,26,0.22)]"
            />
          </Reveal>
        </div>
      </section>

      {/* 2. Product categories */}
      <Reveal as="section" className="shell py-14 sm:py-20">
        <p className="eyebrow mb-4">The range</p>

        <h2 className="display mb-10 text-[2rem] sm:text-[2.5rem]">
          Two ranges, one factory
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {PRODUCT_GROUPS.map((group) => (
            <CategoryCard key={group.key} group={group} />
          ))}
        </div>
      </Reveal>

      {/* 3. Featured products */}
      {featured.length ? (
        <Reveal as="section" className="shell py-14 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-4">Featured</p>

              <h2 className="display text-[2rem] sm:text-[2.5rem]">
                Selected lines
              </h2>
            </div>

            <Link
              href="/products"
              className="text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
            >
              View the full catalogue
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                delay={Math.min(index, 7) * 60}
              />
            ))}
          </div>

          <p className="mt-6 text-[0.8125rem] text-ink-faint">
            No prices are shown anywhere on this site — send an inquiry and we
            quote against your specification.
          </p>
        </Reveal>
      ) : null}

      {/* 4. Why choose 4STAR */}
      <Reveal as="section" className="shell py-14 sm:py-20">
        <p className="eyebrow mb-4">Why choose 4STAR</p>

        <h2 className="display mb-10 text-[2rem] sm:text-[2.5rem]">
          Six reasons buyers come back
        </h2>

        <ol className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {WHY_PANELS.map((panel, index) => (
            <li key={panel.title} className="bg-ground p-7">
              <p className="display mb-4 text-[1.75rem] text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>

              <h3 className="mb-2.5 text-[1.0625rem] text-ink">{panel.title}</h3>

              <p className="text-[0.875rem] leading-6 text-ink-muted">
                {panel.body}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* 5. Manufacturing & quality — the dark split band */}
      <Reveal as="section" className="mt-6 bg-band">
        <div className="shell grid gap-0 lg:grid-cols-2">
          <div className="relative aspect-4/3 lg:aspect-auto lg:min-h-[30rem]">
            <Image
              src="/images/products/foam-2.svg"
              alt="Foam production"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover opacity-90"
            />
          </div>

          <div className="px-2 py-14 sm:px-10 sm:py-20">
            <p className="eyebrow mb-5 text-accent-soft">Manufacturing & quality</p>

            <h2 className="display mb-6 text-[2rem] text-white sm:text-[2.5rem]">
              Foam and mattress, under one roof
            </h2>

            <p className="mb-9 max-w-lg text-[0.9375rem] leading-8 text-white/70">
              Because the foam is produced in-house, the same batch discipline
              that governs a sheet of high-density foam governs the mattress
              built on top of it.
            </p>

            <ul className="mb-10 space-y-4">
              {[
                "Written specification for every build",
                "Checked before dispatch",
                "Cutting and finishing to drawing",
                "Repeatable across reorders",
              ].map((point) => (
                <li key={point} className="flex gap-4 text-[0.9375rem] text-white/85">
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    className="mt-1.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 6l5 5L15 1"
                      stroke="var(--color-accent-soft)"
                      strokeWidth="1.6"
                      fill="none"
                    />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>

            <Button href="/about" variant="onDark" size="lg">
              Learn About 4STAR
            </Button>
          </div>
        </div>
      </Reveal>

      {/* 6. Finder preview */}
      <Reveal as="section" className="shell py-14 sm:py-20">
        <div className="grid gap-12 border border-rule bg-panel p-8 sm:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-4">Guided finder</p>

            <h2 className="display mb-5 text-[2rem]">
              Not sure which one you need?
            </h2>

            <p className="mb-8 text-[0.9375rem] leading-7 text-ink-soft">
              Five short questions and we&apos;ll match you to the three closest
              mattresses in the range. Skip anything you&apos;re unsure about.
            </p>

            <Button href="/find-mattress" size="lg">
              Find Your Mattress
            </Button>
          </div>

          <ol className="space-y-0">
            {FINDER_STEPS.map((step, index) => (
              <li
                key={step.key}
                className="flex gap-5 border-b border-rule py-3.5 last:border-0"
              >
                <span className="table-head pt-1">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="text-[0.9375rem] text-ink-soft">
                  {step.question}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      {/* 7. Offers */}
      {offers.length ? (
        <Reveal as="section" className="shell py-14 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-4">Offers</p>

              <h2 className="display text-[2rem] sm:text-[2.5rem]">
                Current schemes
              </h2>
            </div>

            <Link
              href="/offers"
              className="text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
            >
              All offers & schemes
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.slice(0, 3).map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </Reveal>
      ) : null}

      {/* 8. Dealer CTA */}
      <div className="shell py-6">
        <CTASection
          dark
          eyebrow="Dealer partnership"
          title="Sell 4STAR in your market"
          body="Scheme-backed pricing, display support and planned supply. Apply with your business registration and VAT documents — our team verifies and sets you up."
          primary={{ href: "/dealers", label: "Become a Dealer" }}
          secondary={{ href: "/dealers", label: "Find a Dealer" }}
        />
      </div>

      {/* 9. Inquiry CTA — the worked example from the design document */}
      <Reveal as="section" className="shell py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-4">Inquiry</p>

            <h2 className="display mb-5 text-[2rem] sm:text-[2.5rem]">
              Tell us what to quote
            </h2>

            <p className="mb-8 max-w-lg text-[0.9375rem] leading-7 text-ink-soft">
              There is no checkout here. Send a product, a size, a thickness and
              a quantity, and our team replies with a quote and next steps.
            </p>

            <InquiryButton source="contact" size="lg">
              Send Inquiry
            </InquiryButton>
          </div>

          <div className="border border-rule bg-surface p-7 sm:p-9">
            <p className="table-head mb-6">Example inquiry</p>

            <dl className="space-y-0">
              {[
                ["Product", "4STAR OrthoCare"],
                ["Size", "60 × 72 in"],
                ["Thickness", "6 in"],
                ["Quantity", "2"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-rule py-3.5 last:border-0"
                >
                  <dt className="table-head">{label}</dt>
                  <dd className="text-[1.0625rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Reveal>

      {/* 10. Contact */}
      <Reveal as="section" className="shell pb-16 sm:pb-24">
        <div className="grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {[
            { label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
            { label: "WhatsApp", value: CONTACT.whatsapp, href: CONTACT.whatsappHref },
            { label: "Email", value: CONTACT.email, href: CONTACT.emailHref },
          ].map((card) => (
            <a
              key={card.label}
              href={card.href}
              className="bg-ground p-7 transition-colors hover:bg-panel"
            >
              <p className="table-head mb-2.5">{card.label}</p>

              <p className="text-[1.0625rem] text-navy">{card.value}</p>
            </a>
          ))}
        </div>

        <p className="mt-4 text-[0.8125rem] text-ink-faint">
          Placeholder contact details — replace before publication.
        </p>
      </Reveal>

      <CompareBar />
    </>
  );
}
