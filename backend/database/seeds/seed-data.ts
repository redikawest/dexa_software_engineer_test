export type SeedRole = 'EMPLOYEE' | 'HR_ADMIN';

export interface SeedPerson {
  /** Fixed UUIDs, so running the seeder again recognises the same people. */
  id: string;
  email: string; // lowercase: the employee_logins table rejects anything else
  fullName: string;
  position: string;
  phone: string;
  role: SeedRole;
  /** Id of the person who created this account; `null` for the first admin (nobody created it). */
  createdBy: string | null;
}

/** Development data. Each person becomes one `employees` row and one `employee_logins` row (same id). */
export const seedPeople: SeedPerson[] = [
  {
    id: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef',
    email: 'hr.admin@company.com',
    fullName: 'Sinta Wulandari',
    position: 'HR Admin',
    phone: '081200000001',
    role: 'HR_ADMIN',
    createdBy: null,
  },
  {
    id: '733a550a-c593-45e1-b691-db984b61e1b0',
    email: 'budi.santoso@company.com',
    fullName: 'Budi Santoso',
    position: 'Frontend Developer',
    phone: '081234567890',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
  {
    id: '54f0a24b-dd13-4ed4-b3eb-4cc1c481dbcd',
    email: 'andi.pratama@company.com',
    fullName: 'Andi Pratama',
    position: 'Backend Developer',
    phone: '081298765432',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
  {
    id: '0b854294-1c4d-41e4-8500-fe3df76f0806',
    email: 'dewi.lestari@company.com',
    fullName: 'Dewi Lestari',
    position: 'UI/UX Designer',
    phone: '082112345678',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
  {
    id: '912d1f6e-002a-45a6-b1eb-e988b79033a8',
    email: 'rizky.hidayat@company.com',
    fullName: 'Rizky Hidayat',
    position: 'QA Engineer',
    phone: '085712348765',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
  {
    id: 'bce2596f-0ec3-40ad-9fb5-77636b6583a0',
    email: 'maya.putri@company.com',
    fullName: 'Maya Putri',
    position: 'Product Manager',
    phone: '081377788899',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
  {
    id: '6b4cc2b5-09a5-462b-85ad-7f77426bbd02',
    email: 'fajar.nugroho@company.com',
    fullName: 'Fajar Nugroho',
    position: 'DevOps Engineer',
    phone: '087855566677',
    role: 'EMPLOYEE',
    createdBy: '9ef4e5a6-abc3-4727-96ab-70a9508aaaef', // the HR admin above
  },
];
