import { getAdminDealers } from "@/lib/admin";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import AdminSearch from "@/components/admin/AdminSearch";
import DealerManager from "@/components/admin/DealerManager";

export const metadata = { title: "Dealer directory" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "active", label: "Listed" },
    { value: "inactive", label: "Hidden" },
];

export default async function AdminDealersPage({ searchParams }) {
    const params = await searchParams;

    const status = typeof params?.status === "string" ? params.status : "";
    const search = typeof params?.search === "string" ? params.search : "";

    const { dealers } = await getAdminDealers({ status, search });

    return (
        <>
            <PageHeader
                eyebrow="Network"
                title="Dealer directory"
                count={dealers.length}
            />

            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <FilterTabs basePath="/admin/dealers" current={status} options={FILTERS} />

                <AdminSearch
                    basePath="/admin/dealers"
                    defaultValue={search}
                    keep={{ status }}
                    placeholder="Business, city or email"
                />
            </div>

            {dealers.length === 0 && !status && !search ? (
                <Panel>
                    <EmptyState
                        title="No dealers listed yet."
                        body="Verify a dealership application, or add an entry by hand — the public directory reads from this list."
                    />
                </Panel>
            ) : (
                <DealerManager dealers={dealers} />
            )}
        </>
    );
}
