export const ContactRoles = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  WAREHOUSE: 'warehouse',
  INSTALLER: 'installer',
  CUSTOMER: 'customer',
};

export const OpportunityRolesStages = {
  EMPLOYEE: '77ed3688-c169-44f1-86a2-b69c524e919e',
  WAREHOUSE: '427d60d6-61f3-4356-97e9-168b644628b0',
  INSTALLER:
    '812fb28c-fc6c-4892-8582-5c7791a3a941,0ac3ca28-a6c6-43a5-847f-1057e5b185ea',
};

export const OpportunityRolesStatusFields = {
  WAREHOUSE: 'rV48OOjGojlasHSkHcqB',
  INSTALLER: 'REYvwwlGsxqaZL4GohB8',
};

export const FinishedOpportunityStage = {
  paid: '02e6b6fa-eb88-4c08-a4c6-3bfe0a66f338',
  unpaid: '77ed3688-c169-44f1-86a2-b69c524e919e',
};

export const OpportunityCustomFieldsIds = {
  LAST_UPDATE_DATE: 'SLdEuekeywgxbega6Yto',
  INSTALL_DATE: 'L5PKDTn1Sf8nBKAwDslc',
  RESULT_IMAGE: 'ZySgPkOKHC7YpJF2ShqZ',
  INVOICE_NUMBER: 'digfJfmQ5yr7W9qtqjHE',
  PRE_INSTALL_IMAGE: 'ua5tkdceaHiVBVERtiqu',
  STUCK_REASON: '95UkzRHQsZzFDHx8lV2r',
  PAYING_OPTION: 'g550nU1x2yZt0OtTNuXq',
  CITY: 'drz1AlbnzH8EFmvEjbi2',
  PRODUCT_MODEL: 'DdkNt3ANS357RpdCDKAq',
  PRODUCT_TYPE: 'ixzzAFkFjE5h8zyeqdiS',
  ADDITIONAL_PRODUCTS: 'ox9nXOIf72Cp0pjkwqPm',
  CAR_MODEL: 's2dQuURRb1Hi9k7GBlrL',
  YEAR: 'DaVSb1P4V7l5rywkUJHy',
  INSTALLER: 'm2YMEPp0W9g74QxNirAk',
  TOTAL_PRICE: 'PciIEBgaD5PDN1rkAzsj',
  INSTALLATION_COST: 'vlcf7JGW7Wewmo1Kvcch',
  INSTALLATION_SCHEDULED_STATUS: '1Et2Wp25etRCpAPzQV9Q',
  INVOICE_STATUS: 'ZEhQp3seL9KDIPf9ogeB',
  WAREHOUSE_STATUS: 'rV48OOjGojlasHSkHcqB',
  INSTALLER_STATUS: 'REYvwwlGsxqaZL4GohB8',
};

export const WarehouseStatus = {
  NEW: 'חדש',
  PREPARATION: 'הכנה',
  STUCK: 'תקוע',
  READY: 'מוכן',
  SENT: 'נשלח',
};

export const InstallerStatus = {
  NEW: 'חדש',
  SCHEDULED: 'תואם',
  INSTALLED: 'הותקן',
};

export const EmployeeStatus = {
  NEW: 'חדש',
  PAID: 'שולם',
};

export const wasItPaidOptions = {
  complete: 'שולם כולל התקנה',
  partial: 'משלם התקנה למתקין - שילם על המערכת',
  upfrontCard: 'שילם מקדמה בלבד - משלם באשראי בסיום ההתקנה',
  upfrontCash: 'שילם מקדמה בלבד - משלם במזומן לאחר ההתקנה',
};
