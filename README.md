# Diabetes Diagnosis & Classification Guide (ADA 2026, Section 2)

Next.js 14 + TypeScript decision-support app. Primary source: *Standards of Care in Diabetes—2026*, Section 2, Diabetes Care 2026;49(Suppl. 1):S27–S49. Recommendation numbers (e.g. Rec 2.1b) are cited in the output so each result can be checked against the document.

## Tabs
- **Diagnose**: Table 2.1/2.2 criteria, confirmation rules, A1C interference (Rec 2.1–2.4)
- **Classify**: Fig 2.1 adult type 1 pathway, AABBCC, neonatal, MODY, ICI, CFRD, PTDM, pancreatic, drug-induced
- **Screen**: adults (Table 2.5), youth (Table 2.6), medication/HIV/oncology monitoring, islet antibody follow-up
- **Pregnancy**: early screening, one-step and two-step GDM, postpartum OGTT (Table 2.8)
- **Pathway**: six-step workflow and first actions by type

All logic lives in `lib/ada.ts`. No data leaves the browser.

## Deploy
1. Create a GitHub repo and upload every file in this folder (GitHub web UI works).
2. In Vercel: **Add New → Project → Import** the repo. Framework is auto-detected as Next.js; no environment variables needed.
3. `vercel.json` pins the Mumbai region (`bom1`).

Local: `npm install && npm run dev`.

## Notes
Thresholds are in mg/dL and % A1C. The ADA document is copyrighted; this app paraphrases criteria for clinical use with citation. Treatment detail beyond Section 2 (e.g. Section 9 pharmacotherapy) is not included.
