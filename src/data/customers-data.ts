/* Placeholder customer records for the Customer Manager page. The first rows
   mirror the reference screenshot; the rest are generated so the table has
   65 rows (4 pages of 20, as in the legacy page). */
export interface CustomerRecord {
  id: number;
  account: string;
  firstName: string;
  lastName: string;
  salutation: string;
  department: string;
  description: string;
  title: string;
  phone1: string;
  paymentBalance: string;
  happinessUpdated: string;
}

type Seed = [account: string, first: string, last: string, phone: string, dept?: string, balance?: string];

const SEEDS: Seed[] = [
  ["JJR_9", "adam", "jill", "(607) 743-3209"],
  ["JJR_10", "amanda", "jack", "(607) 281-8951"],
  ["aArenas73", "Andres", "Arenas", "(470) 207-9161"],
  ["aSmith90", "Annie", "Smith", "(415) 791-3277", "Department A", "123.45"],
  ["JJR_4", "bill", "carey", "(607) 743-3204"],
  ["bJones54", "Bob", "Jones", "(614) 530-3902"],
  ["JJR_7", "bob", "diane", "(607) 743-3207"],
  ["12345", "Bobby", "Jones", "(415) 671-6002"],
  ["cClements22", "Cara", "Clements 2", "(716) 510-3432"],
  ["JJR_5", "cara", "jill", "(607) 743-3205"],
  ["JJR_11", "carey", "diane", "(607) 743-3211"],
  ["JJR_15", "carey", "adam", "(607) 743-3215"],
  ["JJR_19", "carey", "jack", "(607) 743-3219"],
  ["NL-05671", "Daniel", "Price", "(470) 555-1174"],
  ["dBauer79", "Davy", "Bauer", "(614) 749-1795"],
  ["JJR_14", "diane", "jack", ""],
  ["JJR_18", "diane", "jill", "(607) 743-3218"],
];

const FIRST = ["ellen", "frank", "gina", "harold", "irene", "jules", "kara", "liam", "maya", "nolan", "opal", "pedro", "quinn", "rosa", "sam", "tara", "uri", "vera", "wes", "xena", "yusuf", "zoe"];
const LAST = ["adams", "brooks", "chen", "diaz", "evans", "foster", "garcia", "hughes", "ito", "jones", "khan", "lopez"];
const AREA = ["607", "415", "470", "614", "716"];

function generated(n: number): Seed[] {
  return Array.from({ length: n }, (_, i): Seed => {
    const a = FIRST[i % FIRST.length];
    const l = LAST[(i * 5 + 3) % LAST.length];
    const acct = `JJR_${20 + i}`;
    const phone = `(${AREA[i % AREA.length]}) ${500 + ((i * 37) % 400)}-${1000 + ((i * 211) % 9000)}`;
    return [acct, a, l, phone];
  });
}

export const CUSTOMERS: CustomerRecord[] = [...SEEDS, ...generated(65 - SEEDS.length)]
  .map(([account, firstName, lastName, phone1, department = "", paymentBalance = "0"], i) => ({
    id: i + 1,
    account,
    firstName,
    lastName,
    salutation: "",
    department,
    description: "",
    title: "",
    phone1,
    paymentBalance,
    happinessUpdated: "",
  }))
  .sort((a, b) => a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase()));
