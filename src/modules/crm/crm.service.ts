import { CrmAdapter } from "./crm.adapter";
import { InternalCrmAdapter } from "./internal-crm.adapter";

/**
 * Factory function that returns the correct CRM adapter based on CRM_PROVIDER env var.
 * Add new adapters here as they are implemented.
 */
export function getCrmAdapter(): CrmAdapter {
  const provider = process.env.CRM_PROVIDER || "internal";

  switch (provider) {
    case "internal":
      return new InternalCrmAdapter();

    // Future adapters:
    // case "hubspot":
    //   return new HubSpotCrmAdapter();
    // case "zoho":
    //   return new ZohoCrmAdapter();
    // case "salesforce":
    //   return new SalesforceCrmAdapter();

    default:
      throw new Error(`Unknown CRM provider: ${provider}`);
  }
}
