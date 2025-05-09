export type ContactTypes = 'admin' | 'warehouse' | 'installer' | 'customer';

export type Contact = {
  id: string;
  email: string;
  phone: string;
  type: ContactTypes;
  firstNameLowerCase: string;
  lastNameLowerCase: string;
};
