# Security Guidelines

## 🛡️ Multi-Tenant Zero Trust Rule

> **The frontend is never trusted for company isolation.**

The frontend may send a `company_id` for UI routing or data-fetching purposes, but **the backend database must independently verify every single query using Row Level Security (RLS)**.

- No API, RPC, or query may rely *solely* on a client-provided `company_id` to authorize access.
- A malicious user modifying their browser requests or network payloads must NEVER be able to access another company's data.
- Row Level Security (RLS) is the ultimate source of truth for all data access.
