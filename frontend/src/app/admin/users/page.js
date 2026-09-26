import { getUsers } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import UserManager from "@/components/admin/UserManager";

export const metadata = { title: "Accounts" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "customer", label: "Customers" },
    { value: "dealer", label: "Dealers" },
    { value: "employee", label: "Employees" },
    { value: "marketer", label: "Marketers" },
    { value: "admin", label: "Administrators" },
];

export default async function AdminUsersPage({ searchParams }) {
    const params = await searchParams;
    const role = typeof params?.role === "string" ? params.role : "";

    const [users, currentUser] = await Promise.all([getUsers(), getSession()]);

    // The users endpoint takes no filters, so this one is applied here. Worth
    // moving into the API if the customer list ever gets long.
    const visible = role ? users.filter((account) => account.role === role) : users;

    return (
        <>
            <PageHeader eyebrow="Access" title="Accounts" count={visible.length} />

            <FilterTabs
                basePath="/admin/users"
                param="role"
                current={role}
                options={FILTERS.map((filter) => ({
                    ...filter,
                    count: filter.value
                        ? users.filter((account) => account.role === filter.value).length
                        : users.length,
                }))}
            />

            {visible.length === 0 ? (
                <Panel>
                    <EmptyState
                        title="No accounts with that role."
                        body="Clear the filter to see everyone."
                    />
                </Panel>
            ) : (
                <UserManager users={visible} currentUserId={currentUser?.id} />
            )}
        </>
    );
}
