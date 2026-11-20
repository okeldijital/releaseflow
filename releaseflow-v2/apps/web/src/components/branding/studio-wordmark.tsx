import { PRODUCT_NAME } from '@/lib/product-identity';
import { ReleaseFlowLogo } from './releaseflow-logo';

export function StudioWordmark() {
  return (
    <span className="studio-wordmark">
      <ReleaseFlowLogo width={30} alt="" />
      {PRODUCT_NAME}
    </span>
  );
}
