"use client";
import { useState } from "react";
import { diagnose, classify, adultScreen, childScreen, abScreen, gdm, Result } from "../lib/ada";

function useF<T extends object>(init: T) {
  const [d, setD] = useState<T>(init);
  const s = (k: keyof T) => (x: any) => setD(p => ({ ...p, [k]: x }));
  return [d, s] as const;
}
const In = ({ l, u, v, set }: { l: string; u?: string; v: string; set: (x: string) => void }) => (
  <label className="f"><span>{l}</span><div><input inputMode="decimal" value={v} onChange={e => set(e.target.value)} />{u && <em>{u}</em>}</div></label>
);
const Ck = ({ l, v, set }: { l: string; v: boolean; set: (x: boolean) => void }) => (
  <label className="ck"><input type="checkbox" checked={v} onChange={e => set(e.target.checked)} />{l}</label>
);
const Sel = ({ l, v, set, o }: { l: string; v: string; set: (x: string) => void; o: [string, string][] }) => (
  <label className="f"><span>{l}</span><select value={v} onChange={e => set(e.target.value)}>{o.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
);
const Out = ({ r }: { r: Result }) => (
  <section className={`panel out ${r.tone}`} aria-live="polite">
    <h3>{r.title}</h3>
    {r.notes.map((n, i) => <p key={i}>{n}</p>)}
    {r.actions.length > 0 && <ul>{r.actions.map((a, i) => <li key={i}>{a}</li>)}</ul>}
  </section>
);
const Seg = ({ v, set, o }: { v: string; set: (x: string) => void; o: [string, string][] }) => (
  <div className="seg">{o.map(([k, t]) => <button key={k} aria-pressed={v === k} onClick={() => set(k)}>{t}</button>)}</div>
);

function Diagnose() {
  const [d, s] = useF({ a1c: "", fpg: "", ogtt: "", rpg: "", symptoms: false, crisis: false, a1cUnreliable: false, repeat: false });
  return (<div className="grid"><div className="panel"><h2>Test results</h2><p className="hint">Nonpregnant or pregnant adults and youth. Glucose in mg/dL.</p>
    <In l="A1C" u="%" v={d.a1c} set={s("a1c")} /><In l="Fasting plasma glucose (no calories ≥8 h)" u="mg/dL" v={d.fpg} set={s("fpg")} />
    <In l="2-h glucose, 75-g OGTT" u="mg/dL" v={d.ogtt} set={s("ogtt")} /><In l="Random plasma glucose" u="mg/dL" v={d.rpg} set={s("rpg")} />
    <fieldset><legend>Context</legend>
      <Ck l="Classic symptoms: polyuria, polydipsia, unexplained weight loss" v={d.symptoms} set={s("symptoms")} />
      <Ck l="Hyperglycemic crisis (DKA or HHS)" v={d.crisis} set={s("crisis")} />
      <Ck l="A1C unreliable: hemoglobin variant, anemia or altered red-cell turnover, dialysis, EPO, G6PD deficiency, HIV, pregnancy" v={d.a1cUnreliable} set={s("a1cUnreliable")} />
      <Ck l="Repeat of the same abnormal test is also above the cut point" v={d.repeat} set={s("repeat")} /></fieldset></div>
    <Out r={diagnose(d)} /></div>);
}
function Classify() {
  const [d, s] = useF({ ctx: "none", age: "", bmi: "", ab: "unk", cpep: "", years: "", weightLoss: false, ketosis: false, glu360: false, monogenic: false });
  return (<div className="grid"><div className="panel"><h2>Clinical picture</h2><p className="hint">Follows the Figure 2.1 pathway and the AABBCC prompts.</p>
    <Sel l="Special context" v={d.ctx} set={s("ctx")} o={[["none", "None of these"], ["neonatal", "Diagnosed before 6 months of age"], ["ici", "Cancer immunotherapy (checkpoint inhibitor)"], ["cf", "Cystic fibrosis"], ["tx", "Organ transplant"], ["panc", "Pancreatic disease or pancreatectomy"], ["drug", "Glucocorticoid or other offending drug"]]} />
    {d.ctx === "none" && <>
      <In l="Age at diagnosis" u="years" v={d.age} set={s("age")} /><In l="BMI" u="kg/m²" v={d.bmi} set={s("bmi")} />
      <Sel l="Islet autoantibodies (GAD, IA-2, ZnT8)" v={d.ab} set={s("ab")} o={[["unk", "Not tested"], ["pos", "Positive"], ["neg", "Negative"]]} />
      <Ck l="Unintentional weight loss" v={d.weightLoss} set={s("weightLoss")} /><Ck l="Ketoacidosis at presentation" v={d.ketosis} set={s("ketosis")} />
      <Ck l="Plasma glucose >360 mg/dL at presentation" v={d.glu360} set={s("glu360")} />
      <Ck l="Monogenic features: A1C <7.5% at diagnosis, parent with diabetes, renal cysts, maternally inherited deafness" v={d.monogenic} set={s("monogenic")} />
      <fieldset><legend>Insulin-treated only</legend><In l="C-peptide" u="pmol/L" v={d.cpep} set={s("cpep")} /><In l="Diabetes duration" u="years" v={d.years} set={s("years")} /></fieldset></>}
    </div><Out r={classify(d)} /></div>);
}
function Screen() {
  const [m, setM] = useState("adult");
  const [a, sa] = useF({ age: "", bmi: "", asian: false, fdr: false, eth: false, cvd: false, htn: false, lipids: false, pcos: false, inactive: false, insres: false, prediabetes: false, gdm: false, pancreatitis: false, periodontal: false, ogtt: false, steroid: false, statin: false, thiazide: false, sga: false, hiv: false, ici: false, pi3k: false, mtor: false });
  const [c, sc] = useF({ age: "", puberty: false, bmi: "none", mat: false, fam: false, eth: false, ir: false });
  const [b, sb] = useF({ count: "one", iaa2: false });
  return (<div><Seg v={m} set={setM} o={[["adult", "Adults"], ["child", "Children and teens"], ["ab", "Type 1 antibodies"]]} />
    <div className="grid">
      {m === "adult" && <div className="panel"><h2>Asymptomatic adult</h2><p className="hint">Table 2.5 and recommendations 2.11–2.23.</p>
        <In l="Age" u="years" v={a.age} set={sa("age")} /><In l="BMI" u="kg/m²" v={a.bmi} set={sa("bmi")} />
        <Ck l="Asian ancestry (overweight cut point 23 kg/m²)" v={a.asian} set={sa("asian")} />
        <fieldset><legend>Risk factors</legend>
          <Ck l="First-degree relative with diabetes" v={a.fdr} set={sa("fdr")} /><Ck l="High-risk ancestry (African American, Latino, Native American, Asian American)" v={a.eth} set={sa("eth")} />
          <Ck l="Cardiovascular disease" v={a.cvd} set={sa("cvd")} /><Ck l="Hypertension ≥130/80 or treated" v={a.htn} set={sa("htn")} />
          <Ck l="HDL <35 mg/dL or triglycerides >250 mg/dL" v={a.lipids} set={sa("lipids")} /><Ck l="Polycystic ovary syndrome" v={a.pcos} set={sa("pcos")} />
          <Ck l="Physical inactivity" v={a.inactive} set={sa("inactive")} /><Ck l="Insulin resistance: severe obesity, acanthosis nigricans, MASLD" v={a.insres} set={sa("insres")} /></fieldset>
        <fieldset><legend>History</legend>
          <Ck l="Known prediabetes" v={a.prediabetes} set={sa("prediabetes")} /><Ck l="Prior gestational diabetes" v={a.gdm} set={sa("gdm")} />
          <Ck l="Acute or chronic pancreatitis" v={a.pancreatitis} set={sa("pancreatitis")} /><Ck l="Periodontal disease" v={a.periodontal} set={sa("periodontal")} />
          <Ck l="Planning an OGTT" v={a.ogtt} set={sa("ogtt")} /><Ck l="Living with HIV" v={a.hiv} set={sa("hiv")} /></fieldset>
        <fieldset><legend>Medicines</legend>
          <Ck l="Glucocorticoids (recurrent or long-term)" v={a.steroid} set={sa("steroid")} /><Ck l="Statin" v={a.statin} set={sa("statin")} /><Ck l="Thiazide diuretic" v={a.thiazide} set={sa("thiazide")} />
          <Ck l="Second-generation antipsychotic" v={a.sga} set={sa("sga")} /><Ck l="Checkpoint inhibitor (anti-PD-1/PD-L1)" v={a.ici} set={sa("ici")} />
          <Ck l="PI3Kα inhibitor (alpelisib, inavolisib)" v={a.pi3k} set={sa("pi3k")} /><Ck l="mTOR inhibitor (everolimus)" v={a.mtor} set={sa("mtor")} /></fieldset></div>}
      {m === "child" && <div className="panel"><h2>Child or adolescent</h2><p className="hint">Table 2.6 risk-based screening.</p>
        <In l="Age" u="years" v={c.age} set={sc("age")} /><Ck l="Puberty has begun" v={c.puberty} set={sc("puberty")} />
        <Sel l="Weight status" v={c.bmi} set={sc("bmi")} o={[["none", "BMI below 85th percentile"], ["over", "Overweight (≥85th percentile)"], ["obese", "Obesity (≥95th percentile)"]]} />
        <fieldset><legend>Additional risk factors</legend><Ck l="Maternal diabetes or GDM in this pregnancy" v={c.mat} set={sc("mat")} /><Ck l="Type 2 in a first- or second-degree relative" v={c.fam} set={sc("fam")} />
          <Ck l="High-risk ancestry" v={c.eth} set={sc("eth")} /><Ck l="Insulin resistance signs: acanthosis, hypertension, dyslipidemia, PCOS, large or small for gestational age" v={c.ir} set={sc("ir")} /></fieldset></div>}
      {m === "ab" && <div className="panel"><h2>Autoantibody result</h2><p className="hint">Offer testing to people with a family history of type 1 or known high genetic risk (Rec 2.6–2.7).</p>
        <Sel l="Confirmed result" v={b.count} set={sb("count")} o={[["none", "No antibodies"], ["one", "One antibody"], ["multi", "Two or more antibodies"]]} />
        {b.count === "one" && <Ck l="The single antibody is IA-2" v={b.iaa2} set={sb("iaa2")} />}</div>}
      <Out r={m === "adult" ? adultScreen(a) : m === "child" ? childScreen(c) : abScreen(b)} /></div></div>);
}
function Pregnancy() {
  const [d, s] = useF({ mode: "early", a1c: "", fpg: "", f0: "", f1: "", f2: "", cut: "140", glt: "", c0: "", c1: "", c2: "", c3: "" });
  const u = "mg/dL";
  return (<div><Seg v={d.mode} set={s("mode")} o={[["early", "Before 15 weeks"], ["one", "24–28 wk one-step"], ["two", "24–28 wk two-step"], ["post", "Postpartum"]]} />
    <div className="grid"><div className="panel"><h2>Glucose values</h2><p className="hint">Table 2.8. Draw the OGTT after an overnight fast of at least 8 h.</p>
      {d.mode === "early" && <><In l="A1C" u="%" v={d.a1c} set={s("a1c")} /><In l="Fasting plasma glucose" u={u} v={d.fpg} set={s("fpg")} /></>}
      {d.mode === "one" && <><In l="Fasting (75-g OGTT)" u={u} v={d.f0} set={s("f0")} /><In l="1 hour" u={u} v={d.f1} set={s("f1")} /><In l="2 hours" u={u} v={d.f2} set={s("f2")} /></>}
      {d.mode === "post" && <><p className="hint">75-g OGTT at 4–12 weeks.</p><In l="Fasting" u={u} v={d.f0} set={s("f0")} /><In l="2 hours" u={u} v={d.f2} set={s("f2")} /></>}
      {d.mode === "two" && <><Sel l="Step 1 threshold in use" v={d.cut} set={s("cut")} o={[["130", "130 mg/dL"], ["135", "135 mg/dL"], ["140", "140 mg/dL"]]} />
        <In l="Step 1: 1 h after 50-g load (nonfasting)" u={u} v={d.glt} set={s("glt")} />
        <fieldset><legend>Step 2: 100-g OGTT</legend><In l="Fasting" u={u} v={d.c0} set={s("c0")} /><In l="1 hour" u={u} v={d.c1} set={s("c1")} /><In l="2 hours" u={u} v={d.c2} set={s("c2")} /><In l="3 hours" u={u} v={d.c3} set={s("c3")} /></fieldset></>}
    </div><Out r={gdm(d)} /></div></div>);
}
const STEPS: [string, string][] = [
  ["Recognize hyperglycemia", "Symptoms, a crisis, an incidental result, or a risk-based screen. Use Screen for asymptomatic people."],
  ["Confirm the diagnosis", "Symptoms or crisis plus random glucose ≥200 mg/dL is enough. Otherwise two abnormal results, from different tests at one time or the same test twice (Rec 2.1b). Set A1C aside when it is unreliable."],
  ["Classify", "Test islet antibodies in adults with type 1 features, use C-peptide only on insulin, and consider genetic testing for neonatal or family-pattern diabetes. Recheck the label if the course does not fit."],
  ["Treat by type", "Insulin for type 1, CFRD and ICI-induced diabetes. Sulfonylurea for HNF1A/HNF4A-MODY and many KATP neonatal cases. Avoid incretins in pancreatitis. Drug choice beyond these belongs to ADA Section 9."],
  ["Look for the rest", "Screen for complications and comorbidities, autoimmune disease in type 1, and cardiovascular risk (ADA Sections 4 and 10–12). Prediabetes: prevention counseling (Section 3)."],
  ["Follow up", "Prediabetes yearly; normal results every 3 years or less; prior GDM every 1–3 years for life; antibody-positive people on the interval set by age."],
];
const TYPES: [string, string, string][] = [
  ["Type 1 (incl. LADA)", "Autoimmune β-cell loss; 5–10% of diabetes", "Insulin; DKA education; screen for other autoimmunity"],
  ["Type 2", "Progressive β-cell secretory loss with insulin resistance; 90–95%", "Lifestyle and pharmacologic plan (Sections 5, 8, 9); consider antibody testing if young or lean"],
  ["Monogenic (MODY, neonatal)", "Under 5% of diabetes", "Genetic testing and counseling; GCK: no therapy; HNF1A/4A: sulfonylurea"],
  ["Pancreatic (3c)", "Exocrine disease, pancreatectomy, CF, hemochromatosis", "Avoid incretins; early insulin; CFRD needs insulin"],
  ["Drug/chemical, ICI, PTDM", "Glucocorticoids, checkpoint inhibitors, transplant drugs", "Monitor glucose; referral and insulin for ICI; OGTT to diagnose PTDM"],
  ["Gestational", "Diagnosed in the 2nd or 3rd trimester", "ADA Section 15; postpartum OGTT at 4–12 weeks; screen every 1–3 years"],
];
function Pathway() {
  return (<div className="grid"><div className="panel"><h2>Care pathway</h2><p className="hint">Sequence recommended by Section 2.</p>
    <ol className="steps">{STEPS.map(([t, x]) => <li key={t}><b>{t}</b>{x}</li>)}</ol></div>
    <div className="panel"><h2>Type and first actions</h2><p className="hint">Section 2 covers diagnosis and classification; detailed treatment sits in other sections.</p>
      <div className="tw"><table><thead><tr><th>Type</th><th>Basis</th><th>First actions</th></tr></thead><tbody>{TYPES.map(r => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></div></div>);
}
const TABS: [string, () => JSX.Element][] = [["Diagnose", Diagnose], ["Classify", Classify], ["Screen", Screen], ["Pregnancy", Pregnancy], ["Pathway", Pathway]];
export default function Page() {
  const [i, setI] = useState(0);
  const Tab = TABS[i][1];
  return (<>
    <header><h1>Diabetes diagnosis and classification</h1><p>Enter findings, get the category and next steps from ADA Standards of Care in Diabetes—2026, Section 2.</p></header>
    <nav role="tablist">{TABS.map(([n], k) => <button key={n} role="tab" aria-selected={i === k} onClick={() => setI(k)}>{n}</button>)}</nav>
    <main><Tab /></main>
    <footer>Decision support for clinicians; it does not replace clinical judgment. Source: American Diabetes Association Professional Practice Committee. Diagnosis and classification of diabetes: Standards of Care in Diabetes—2026. Diabetes Care 2026;49(Suppl. 1):S27–S49. No patient data is stored or transmitted.</footer></>);
}
