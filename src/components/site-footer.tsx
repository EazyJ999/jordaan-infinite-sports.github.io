import { Link } from "@tanstack/react-router";
import { COLLECTION_ADDRESS, COLLECTION_HOURS, shopQuery, stockedCategories } from "@/data/catalog";
import { SocialLinks } from "@/components/social-links";
import { SiteQr } from "@/components/site-qr";
import { useCatalog } from "@/lib/catalog-context";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/whatsapp-order";

export function SiteFooter() {
  const { products } = useCatalog();
  const shelves = stockedCategories(products);
  return (
    <footer className="mt-16 border-t border-line bg-paper text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <SocialLinks />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Jordaan Infinite Sports, in Bloemfontein since 2013. Authentic replicas, sent from here.
          </p>
          <p className="mt-3 text-sm text-muted">
            Customised items cannot be refunded or returned. A 2–4 cm fit difference is normal.
          </p>
          <p className="mt-3 text-sm text-muted">
            If you do not see anything you like, you are more than welcome to{" "}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="underline">
              send a picture
            </a>{" "}
            of the item you would like to have.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-brass">Shelves</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {shelves.map((category) => (
              <li key={category.id}>
                <Link to="/shop" search={shopQuery(category.id)} className="hover:text-brass">
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-brass">Visit and orders</p>
          <p className="mt-3 text-sm text-muted">
            Collect at {COLLECTION_ADDRESS}. {COLLECTION_HOURS}
          </p>
          <p className="mt-2 text-sm text-muted">
            Courier Guy or Aramex, R110 outside Bloemfontein. Free only if the city is Bloemfontein. Another courier is charged to you and confirmed on WhatsApp.
          </p>
          <p className="mt-2 text-sm text-muted">
            WhatsApp:{" "}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="underline">
              {WHATSAPP_DISPLAY}
            </a>
          </p>
          <a
            href="https://g.page/r/CZ9bDdaEPGaBEAI/review"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm underline"
          >
            Leave a Google review
          </a>
          <Link to="/news" className="mt-3 block text-sm underline">
            Daily news
          </Link>
          <Link to="/tips" className="mt-2 block text-sm underline">
            Weekend tips
          </Link>
          <Link to="/score" className="mt-2 block text-sm underline">
            Correct score · R100
          </Link>
          <Link to="/track" search={{ id: "" }} className="mt-3 block text-sm underline">
            Track an order
          </Link>
          <Link to="/bulk" className="mt-2 block text-sm underline">
            Bulk orders
          </Link>
          <Link to="/size-guide" className="mt-2 block text-sm underline">
            Size guide
          </Link>
          <Link to="/orders" className="mt-2 block text-sm underline">
            Orders on this phone
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <SiteQr />
        </div>
      </div>
    </footer>
  );
}
