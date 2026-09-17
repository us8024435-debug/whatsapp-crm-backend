/**
 * CRM Adapter Interface.
 *
 * All CRM providers (internal DB, HubSpot, Zoho, Salesforce, etc.)
 * must implement this interface. The application code calls these methods
 * instead of talking directly to any specific CRM.
 */
export interface CrmAdapter {
  /** Create a new lead in the CRM */
  createLead(data: {
    contactPhone: string;
    contactName: string | null;
    source: string;
  }): Promise<{ externalId?: string }>;

  /** Update an existing lead's status */
  updateLeadStatus(leadId: string, status: string): Promise<void>;

  /** Add a note/activity to a lead */
  addNote(leadId: string, note: string): Promise<void>;

  /** Sync contact data to the CRM */
  syncContact(data: {
    phone: string;
    name: string | null;
    source: string;
  }): Promise<void>;
}
