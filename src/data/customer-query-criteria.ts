import type { QueryCriteria, QueryOption } from "@nicecxone/lyra-ui";

/* The fields the Customers page's Query Builder offers (lyra-ui's `QueryBuilder` has no built-in
   fields — each page passes its own). Only First Name, Last Name and Department are evaluated against
   the placeholder customer data (see `chipMatches` in CustomersPage); Age, Gender and Status are
   offered but do not filter. */

const TEXT_OPERATORS: QueryOption[] = [
  { value: "contains", label: "Contains" },
  { value: "does-not-contain", label: "Does Not Contain" },
  { value: "equals", label: "Equals" },
  { value: "not-equals", label: "Not Equals" },
  { value: "starts-with", label: "Starts With" },
  { value: "ends-with", label: "Ends With" },
];
const NUMBER_OPERATORS: QueryOption[] = [
  { value: "equals", label: "Equals" },
  { value: "not-equals", label: "Not Equals" },
  { value: "greater-than", label: "Greater Than" },
  { value: "less-than", label: "Less Than" },
];
const IS_OPERATORS: QueryOption[] = [
  { value: "equals", label: "Equals" },
  { value: "not-equals", label: "Not Equals" },
];

export const CUSTOMER_QUERY_CRITERIA: QueryCriteria[] = [
  { id: "first-name", label: "First Name", operators: TEXT_OPERATORS, options: [{ value: "jane", label: "Jane" }, { value: "john", label: "John" }, { value: "alice", label: "Alice" }] },
  { id: "last-name", label: "Last Name", operators: TEXT_OPERATORS, options: [{ value: "smith", label: "Smith" }, { value: "jones", label: "Jones" }] },
  { id: "age", label: "Age", operators: NUMBER_OPERATORS, options: [{ value: "25", label: "25" }, { value: "30", label: "30" }, { value: "40", label: "40" }] },
  { id: "gender", label: "Gender", operators: IS_OPERATORS, options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "non-binary", label: "Non-binary" }] },
  { id: "department", label: "Department", operators: TEXT_OPERATORS, options: [{ value: "engineering", label: "Engineering" }, { value: "design", label: "Design" }, { value: "sales", label: "Sales" }] },
  { id: "status", label: "Status", operators: IS_OPERATORS, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "pending", label: "Pending" }] },
];
