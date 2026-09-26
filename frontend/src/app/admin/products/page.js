import Link from "next/link";
import { getAdminProducts } from "@/lib/admin";
import { deleteProduct } from "@/app/admin/actions";
import {
    PageHeader,
    Panel,
    EmptyState,
    FilterTabs,
    StatusPill,
    TableWrap,
    Th,
    Td,
} from "@/components/admin/ui";
import RowDelete from "@/components/admin/RowDelete";
import AdminSearch from "@/components/admin/AdminSearch";

export const metadata = { title: "Products" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "active", label: "Listed" },
    { value: "inactive", label: "Unlisted" },
];

export default async function AdminProductsPage({ searchParams }) {
    const params = await searchParams;

    const status = typeof params?.status === "string" ? params.status : "";
    const search = typeof params?.search === "string" ? params.search : "";

    const products = await getAdminProducts({ status, search });

    return (
        <>
            <PageHeader eyebrow="Catalogue" title="Products" count={products.length}>
                <Link
                    href="/admin/products/new"
                    className="border border-navy bg-navy px-5 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-dark"
                >
                    New product
                </Link>
            </PageHeader>

            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <FilterTabs
                    basePath="/admin/products"
                    current={status}
                    options={FILTERS}
                />

                <AdminSearch
                    basePath="/admin/products"
                    defaultValue={search}
                    keep={{ status }}
                    placeholder="Name, slug or category"
                />
            </div>

            <Panel>
                {products.length === 0 ? (
                    <EmptyState
                        title={
                            status || search
                                ? "Nothing matches that."
                                : "No products yet."
                        }
                        body={
                            status || search
                                ? "Clear the filters to see the whole catalogue."
                                : "Add the first product and it appears in the catalogue straight away."
                        }
                    />
                ) : (
                    <TableWrap>
                        <thead>
                            <tr>
                                <Th>Product</Th>
                                <Th>Group</Th>
                                <Th>Category</Th>
                                <Th>Images</Th>
                                <Th>Order</Th>
                                <Th>Status</Th>
                                <Th className="text-right">Actions</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <Td>
                                        <Link
                                            href={`/admin/products/${product.id}`}
                                            className="text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-navy"
                                        >
                                            {product.name}
                                        </Link>

                                        <span className="block font-mono text-[0.75rem] text-ink-faint">
                                            {product.slug}
                                        </span>
                                    </Td>

                                    <Td className="capitalize text-ink-muted">
                                        {product.group}
                                    </Td>

                                    <Td className="text-ink-muted">{product.category}</Td>

                                    <Td className="text-ink-muted">
                                        {product.images?.length ?? 0}
                                    </Td>

                                    <Td className="text-ink-muted">{product.sortOrder}</Td>

                                    <Td>
                                        <div className="flex flex-wrap gap-1.5">
                                            <StatusPill
                                                status={product.isActive ? "active" : "inactive"}
                                                label={product.isActive ? "Listed" : "Unlisted"}
                                            />

                                            {product.isFeatured ? (
                                                <StatusPill status="featured" label="Featured" />
                                            ) : null}
                                        </div>
                                    </Td>

                                    <Td className="text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="border border-rule-strong px-3 py-1.5 text-[0.8125rem] text-ink transition-colors hover:border-ink"
                                            >
                                                Edit
                                            </Link>

                                            <RowDelete
                                                action={deleteProduct}
                                                id={product.id}
                                                confirm={`Delete "${product.name}" permanently? Unlisting it instead keeps the record.`}
                                            />
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </TableWrap>
                )}
            </Panel>
        </>
    );
}
