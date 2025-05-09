export type ContactTypes = 'Admin' | 'Warehouse' | 'Installer' | 'Client';

export type Contact = {
  id: string;
  email: string;
  phone: string;
  type: ContactTypes;
  firstNameLowerCase: string;
  lastNameLowerCase: string;
};
