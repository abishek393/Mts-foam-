import { getAllOrders, getAssignees } from "@/lib/admin";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import OrderTable from "@/components/admin/OrderTable";

export const metadata = { title: "Orders" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "quoted", label: "Quoted" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }) {
    const params = await searchParams;
    const status = typeof params?.status === "string" ? params.status : "";

    const [orders, assignees] = await Promise.all([
        getAllOrders({ status }),
        getAssignees(),
    ]);

    return (
        <>
            <PageHeader eyebrow="Sales" title="Order requests" count={orders.length} />

            <FilterTabs basePath="/admin/orders" current={status} options={FILTERS} />

            <Panel>
                {orders.length === 0 ? (
                    <EmptyState
                        title={status ? "Nothing with that status." : "No orders yet."}
                        body={
                            status
                                ? "Try another status, or clear the filter to see everything."
                                : "An order is a specified request placed from the cart. No payment is taken — quote it and reply."
                        }
                    />
                ) : (
                    <OrderTable orders={orders} assignees={assignees} />
                )}
            </Panel>
        </>
    );
}
