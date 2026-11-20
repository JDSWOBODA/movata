import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/movata/Logo";
import { product } from "@/lib/brand";

const PRIVACY_EFFECTIVE_DATE = "November 19, 2026";

const CONTROLLER = {
  name: "Movata, LLC",
  address: "1 E Erie Street, Suite 525 PMB 140, Chicago, IL 60611, USA",
  /** Set once a monitored inbox exists. Until then, requests go through the app or by mail. */
  email: null as string | null,
};

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-6 space-y-3">
    <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{title}</h2>
    <div className="space-y-3 leading-7 text-stone-700 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-stone-900">{children}</div>
  </section>
);

const Table = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-2xl border border-stone-200">
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead className="bg-stone-50 text-stone-600">
        <tr>{head.map((cell) => <th key={cell} className="px-4 py-2 font-semibold">{cell}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index} className="px-4 py-2 align-top">{cell}</td>)}</tr>)}
      </tbody>
    </table>
  </div>
);

const contactLine = CONTROLLER.email
  ? <>email <a className="font-medium text-emerald-800 underline" href={`mailto:${CONTROLLER.email}`}>{CONTROLLER.email}</a> or write to {CONTROLLER.name}, {CONTROLLER.address}</>
  : <>write to {CONTROLLER.name}, {CONTROLLER.address} (a dedicated privacy email address is coming soon)</>;

const sections = [
  ["summary", "Summary"],
  ["who", "Who we are"],
  ["collect", "What we collect"],
  ["use", "How we use it and why"],
  ["public", "What is public"],
  ["strava", "Strava data"],
  ["sharing", "Who we share it with"],
  ["transfers", "International transfers"],
  ["retention", "How long we keep it"],
  ["rights", "Your rights"],
  ["children", "Children"],
  ["security", "Security"],
  ["cookies", "Cookies and local storage"],
  ["links", "Gear links and other websites"],
  ["changes", "Changes"],
  ["contact", "Contact"],
] as const;

/** Movata's Privacy & Data Policy. Keep it in sync with what the app actually does. */
const Privacy = () => {
  useEffect(() => {
    document.title = `Privacy & Data Policy · ${product.name}`;
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-stone-950">
      <header className="border-b border-stone-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6"><Logo /><Link to="/" className="text-sm text-stone-600 hover:text-emerald-800">Home</Link></div>
      </header>

      <article className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Legal</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy &amp; Data Policy</h1>
          <p className="mt-3 text-stone-500">Effective {PRIVACY_EFFECTIVE_DATE}</p>
        </div>

        <nav aria-label="Contents" className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
          <p className="font-semibold">Contents</p>
          <ol className="mt-2 grid gap-1 sm:grid-cols-2">
            {sections.map(([id, title], index) => <li key={id}><a href={`#${id}`} className="text-emerald-800 hover:underline">{index + 1}. {title}</a></li>)}
          </ol>
        </nav>

        <Section id="summary" title="1. Summary">
          <ul>
            <li>Movata gives runners a public page. <strong>You decide what goes on it</strong>; everything else stays private.</li>
            <li>Runs synced from Strava are shown <strong>only to you</strong>, kept for <strong>at most 7 days</strong>, and never used to train AI.</li>
            <li>We <strong>don't sell</strong> your data, show ads, or use advertising or analytics trackers.</li>
            <li>You can <strong>delete your account yourself</strong> at any time (Dashboard → Settings → Delete account), which permanently deletes your data.</li>
          </ul>
        </Section>

        <Section id="who" title="2. Who we are">
          <p>{CONTROLLER.name} (“Movata”, “we”) operates {product.name} at movata.vercel.app and is the <strong>controller</strong> of the personal data described here. Our address is {CONTROLLER.address}.</p>
          <p>This policy covers people who create a Movata account (“runners”) and people who visit public Movata pages (“visitors”).</p>
        </Section>

        <Section id="collect" title="3. What we collect">
          <Table
            head={["Category", "What it includes", "Where it comes from"]}
            rows={[
              ["Account", "Email address, password (stored only as a secure hash by our authentication provider), sign-in times", "You"],
              ["Profile", "Username, display name, bio, location, “running since” year, units, public/private setting, profile photo and cover image", "You"],
              ["Content you add", "Featured runs (title, date, distance, time, note, photo), races (name, date, distance, location, link, note, photo), gear (category, brand, product, note, photo, product and video links, affiliate and gifted disclosures)", "You; optionally prefilled from your Strava runs or from a link you paste"],
              ["Strava connection", "Strava athlete ID, access and refresh tokens (encrypted), connection status", "Strava, when you connect"],
              ["Strava activities", "Run name, date, distance, time, pace, elevation, location city, route summary, heart rate, gear, and fastest-mile efforts", "Strava, when you sync"],
              ["Gear link clicks", "Which public gear link was clicked and when, plus a one-way code that lets us count each visitor once per day. We do not store the visitor's IP address or account", "Visitors' browsers"],
              ["Profile views and cheers", "That a public page was viewed or cheered (and which run or race), when, and the same kind of one-way daily code. No IP address or account is stored. When you cheer, your browser remembers it for the day so the button shows you already cheered", "Visitors' browsers"],
              ["Billing (when enabled)", "Stripe customer and subscription IDs and status. Card details go directly to Stripe; we never see or store them", "Stripe"],
              ["Technical logs", "IP address, browser/user agent, pages and API requests, errors, kept in our hosting providers' logs for security and troubleshooting", "Your device"],
            ]}
          />
          <p>Heart-rate data from Strava can be <strong>health data</strong> under the GDPR. We process it only with your explicit consent, which you give when you connect Strava. It is shown only to you and is never published.</p>
        </Section>

        <Section id="use" title="4. How we use it and why">
          <Table
            head={["Purpose", "Data", "Legal basis (GDPR)"]}
            rows={[
              ["Create and run your account and public page", "Account, profile, content", "Performing our contract with you (Art. 6(1)(b))"],
              ["Sync and show your Strava runs, streak and records to you; suggest runs to feature", "Strava connection and activities", "Your consent (Art. 6(1)(a)); explicit consent for heart rate (Art. 9(2)(a)). Withdraw it any time by disconnecting"],
              ["Show runners how often visitors click their gear links, view their page and cheer", "Gear link clicks, profile views, cheers", "Our legitimate interest in giving runners useful, privacy-friendly statistics (Art. 6(1)(f))"],
              ["Fetch a title and image from a link you paste", "The link you submit", "Performing our contract with you"],
              ["Process payments, if you subscribe", "Billing", "Contract; legal obligations such as tax records (Art. 6(1)(c))"],
              ["Keep Movata secure, prevent abuse, fix bugs", "Technical logs, account", "Legitimate interests in security and reliability"],
              ["Send service emails (sign-in links, password resets, important changes)", "Email address", "Contract. We do not send marketing email without your consent"],
            ]}
          />
          <p>We do not make decisions about you based solely on automated processing that have legal or similarly significant effects. In the future we may share <strong>aggregated, de-identified</strong> statistics with brands (for example, total clicks on a brand's products across Movata). These never identify you or any visitor.</p>
        </Section>

        <Section id="public" title="5. What is public">
          <p>When your profile is set to <strong>public</strong>, anyone can see: your username, display name, bio, location, “running since” year, profile and cover images, featured runs, races, Gear Corner (including any disclosures), and the total number of cheers. Turn your profile to private at any time in the Profile Editor to hide all of it.</p>
          <p><strong>Never public:</strong> your email address, Strava activity history, streak and records, route maps, start times, heart rate, page views and gear click statistics.</p>
        </Section>

        <Section id="strava" title="6. Strava data">
          <ul>
            <li>Data we receive from Strava is shown <strong>only to you</strong>, as Strava's API Agreement requires.</li>
            <li>We cache Strava activities for <strong>no more than 7 days</strong>. Each sync refreshes the cache and removes older entries; runs you delete on Strava disappear after the next full sync.</li>
            <li>We never use Strava data to develop or operate AI or machine-learning models.</li>
            <li>A featured run you publish is information <strong>you</strong> chose to share. When you feature a Strava run, we fill the form with that run's title, date, distance and time, and you review and confirm it before it becomes public.</li>
            <li><strong>Disconnecting</strong> (Dashboard → Settings) revokes our access on Strava and deletes your cached Strava data. You can also revoke access from your Strava settings.</li>
          </ul>
        </Section>

        <Section id="sharing" title="7. Who we share it with">
          <p>We use these service providers (“processors”), which handle data only on our instructions:</p>
          <Table
            head={["Provider", "What they do", "Location"]}
            rows={[
              ["Supabase", "Database, authentication, file storage, server functions, sign-in emails", "United States"],
              ["Vercel", "Website hosting and delivery", "United States and global edge network"],
              ["Stripe (when billing is enabled)", "Payment processing", "United States"],
            ]}
          />
          <p><strong>Strava</strong> is an independent service. When you connect, data moves between your Strava account and Movata under your Strava settings and Strava's own privacy policy.</p>
          <p>When you paste a link, our server visits that web page to read its title and image. That website sees a request from our server, not from you.</p>
          <p>We may disclose data if required by law, to protect people's safety or our rights, or as part of a merger or acquisition (in which case this policy continues to apply). We <strong>do not sell</strong> personal information or “share” it for cross-context behavioral advertising, as those terms are defined in California law.</p>
        </Section>

        <Section id="transfers" title="8. International transfers">
          <p>Movata is operated from the United States and your data is stored in the United States. If you are in the European Economic Area, the United Kingdom or Switzerland, your data is transferred to the US. We rely on our providers' data processing agreements, including the European Commission's Standard Contractual Clauses and, where a provider is certified, the EU–US Data Privacy Framework.</p>
        </Section>

        <Section id="retention" title="9. How long we keep it">
          <Table
            head={["Data", "Kept for"]}
            rows={[
              ["Account, profile and content", "Until you delete it or delete your account"],
              ["Strava activities", "At most 7 days; deleted immediately when you disconnect or delete your account"],
              ["Replaced or removed photos", "Deleted when you save the change"],
              ["Gear link clicks", "While the gear item exists; deleted with the item or your account"],
              ["Profile views and cheers", "While your account exists; deleted with your account"],
              ["Billing records", "As long as tax and accounting laws require"],
              ["Technical logs", "Per our hosting providers' log retention, typically days to weeks"],
              ["Backups", "Deleted data may remain in our database provider's encrypted backups for a limited period, then is permanently overwritten"],
            ]}
          />
        </Section>

        <Section id="rights" title="10. Your rights">
          <p><strong>Everyone</strong> can view and edit their data in the dashboard, make their profile private, disconnect Strava, and delete their account at any time.</p>
          <p><strong>EEA, UK and Swiss residents (GDPR / UK GDPR / FADP)</strong> have the right to access, correct, delete, restrict or object to processing of their data; to receive it in a portable format; and to withdraw consent at any time without affecting earlier processing. You may also complain to your local data protection authority.</p>
          <p><strong>California and other US state residents</strong> have the right to know what personal information we collect and how we use it, to access, correct and delete it, and to not be discriminated against for exercising these rights. We do not sell or share personal information, so there is nothing to opt out of. We do not use sensitive personal information to infer characteristics about you.</p>
          <p>To make a request, use the dashboard or {contactLine}. We will respond within one month (or 45 days where US state law allows), and may need to verify that the request comes from the account holder. An authorized agent may act for you with your signed permission.</p>
        </Section>

        <Section id="children" title="11. Children">
          <p>Movata is not intended for anyone under 16. We do not knowingly collect personal data from children under 16 (or under 13 in the US). If you believe a child has created an account, contact us and we will delete it.</p>
        </Section>

        <Section id="security" title="12. Security">
          <p>We encrypt data in transit (HTTPS), encrypt Strava tokens at rest, restrict every database table so people can only read or change what they're allowed to, and keep administrative access to a minimum. No system is perfectly secure. If a personal data breach occurs, we will notify the relevant authorities within 72 hours where the law requires it, and tell affected users without undue delay.</p>
        </Section>

        <Section id="cookies" title="13. Cookies and local storage">
          <p>Movata stores your sign-in session in your browser's local storage so you stay signed in. When you tap Cheer on a public page, it also remembers that for the rest of the day so the button shows you already cheered. Both are <strong>strictly necessary</strong> for features you use. We do not use advertising or analytics cookies or third-party trackers. If we ever add non-essential tracking, we will ask for your consent first.</p>
        </Section>

        <Section id="links" title="14. Gear links and other websites">
          <p>Runners may link to products, race websites and videos. Some product links are <strong>affiliate links</strong>, meaning the runner may earn a commission, and some gear is <strong>gifted or sponsored</strong>; runners are asked to label both, and the labels are shown on each item. When you follow a link you leave Movata, and the destination's own privacy policy applies. We count the click as described above, but don't share anything about you with the destination.</p>
        </Section>

        <Section id="changes" title="15. Changes">
          <p>We will update this page when our practices change and revise the effective date above. If a change materially affects how we use your data, we will tell you in the app or by email before it takes effect.</p>
        </Section>

        <Section id="contact" title="16. Contact">
          <p>{CONTROLLER.name}<br />{CONTROLLER.address}</p>
          <p>For privacy questions or requests, {contactLine}.</p>
        </Section>
      </article>

      <footer className="border-t border-stone-200 px-4 py-6 text-center text-sm text-stone-500">
        <Link to="/" className="hover:text-emerald-800">{product.name}</Link> · {product.tagline}
      </footer>
    </main>
  );
};

export default Privacy;
