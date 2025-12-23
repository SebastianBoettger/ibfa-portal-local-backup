// ibfa-portal/lib/customers.ts

export type CustomerListItem = {
    id: string;
    name: string;
    street?: string | null;
    zipCode?: string | null;
    city?: string | null;
    email?: string | null;
    phone?: string | null;
    isActive: boolean;
  };
  