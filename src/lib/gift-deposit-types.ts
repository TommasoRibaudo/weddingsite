export type DepositDetail = {
  label: string;
  value: string;
};

export type DepositDestination = {
  id: string;
  label: string;
  details: DepositDetail[];
};

export type GiftDepositConfig = {
  beneficiary: string;
  reason: string;
  destinations: DepositDestination[];
};