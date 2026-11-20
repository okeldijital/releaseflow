import { PRODUCT_NAME } from '@/lib/product-identity';
import { StudioWordmark } from '@/components/branding/studio-wordmark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="studio-entry">
      <section className="studio-poster" aria-label={`${PRODUCT_NAME} music workspace`}>
        <StudioWordmark />
        <div className="studio-poster-copy">
          <h2>
            Release
            <br />
            <em>workspace.</em>
          </h2>
          <p>Plan releases, coordinate your team, and prepare your catalogue for distribution.</p>
        </div>
      </section>
      <section className="studio-auth">
        <div className="studio-mobile-brand">
          <StudioWordmark />
        </div>
        <div className="studio-form">{children}</div>
      </section>
    </main>
  );
}
