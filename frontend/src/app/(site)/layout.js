import { getMyFavourites, getSession } from "@/lib/auth";
import InquiryProvider from "@/components/InquiryProvider";
import FavouritesProvider from "@/components/FavouritesProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ChatWidget from "@/components/ChatWidget";

// The public site. /admin sits outside this group so it gets none of this
// chrome — and pays for none of these fetches.
export default async function SiteLayout({ children }) {
    // Read once here so the header, the inquiry dialog and the favourites
    // hearts all agree on who is signed in and what they have saved.
    const user = await getSession();
    const favourites = user ? await getMyFavourites() : { ids: [] };

    return (
        <>
            {/* Scroll reveal starts hidden and is shown by JavaScript. Without
                JavaScript there is nothing to show it, so it is never hidden in
                the first place. */}
            <noscript>
                <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
            </noscript>

            <InquiryProvider initialUser={user}>
            <FavouritesProvider initialIds={favourites.ids} signedIn={Boolean(user)}>
                <Navbar />

                <main className="flex-1">{children}</main>

                <Footer />
                <WhatsAppButton />
                <ChatWidget user={user} />
            </FavouritesProvider>
            </InquiryProvider>
        </>
    );
}
