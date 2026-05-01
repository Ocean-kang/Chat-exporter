# Architecture

## Flow

1. Extract raw data (__NEXT_DATA__)
2. Parse into normalized model
3. Reconstruct DAG
4. Export to format

---

## Key Principle

Data integrity > convenience

---

## Parsing Strategy

- Do not rely on DOM
- Always prefer structured data
