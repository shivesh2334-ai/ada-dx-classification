// Decision logic transcribed from ADA Standards of Care in Diabetes—2026, Section 2
// (Diabetes Care 2026;49(Suppl. 1):S27–S49). Units: mg/dL, A1C %, C-peptide pmol/L.
export type Tone = "ok" | "info" | "warn" | "alert";
export type Result = { tone: Tone; title: string; notes: string[]; actions: string[] };
export type F = Record<string, any>;
export const num = (v: any): number | undefined => { const x = parseFloat(v); return isNaN(x) ? undefined : x; };
const R = (tone: Tone, title: string, notes: string[] = [], actions: string[] = []): Result => ({ tone, title, notes, actions });

// ---- Diagnosis: Table 2.1, 2.2; Rec 2.1–2.4 ----
export function diagnose(f: F): Result {
  const a1c = num(f.a1c), fpg = num(f.fpg), og = num(f.ogtt), rpg = num(f.rpg);
  if ((f.symptoms || f.crisis) && rpg !== undefined && rpg >= 200)
    return R("alert", "Diabetes diagnosed on clinical grounds",
      ["Classic hyperglycemia symptoms or a hyperglycemic crisis plus random plasma glucose ≥200 mg/dL is sufficient; no confirmatory test is needed (Table 2.1, Rec 2.1a–b)."],
      ["Measure A1C to show how long hyperglycemia has been present.", f.crisis ? "Treat DKA/HHS as an emergency (see the ADA hyperglycemic crises consensus)." : "Start management without waiting for repeat testing.", "Classify the type (Classify tab)."]);
  type T = { n: string; v: number; dx: number; pre: number };
  const notes: string[] = [], t: T[] = [];
  if (a1c !== undefined) {
    if (f.a1cUnreliable) notes.push("A1C set aside: with hemoglobin variants, altered red-cell turnover, pregnancy, G6PD deficiency or HIV, use plasma glucose criteria (Rec 2.4).");
    else t.push({ n: "A1C", v: a1c, dx: 6.5, pre: 5.7 });
  }
  if (fpg !== undefined) t.push({ n: "FPG", v: fpg, dx: 126, pre: 100 });
  if (og !== undefined) t.push({ n: "2-h PG (75-g OGTT)", v: og, dx: 200, pre: 140 });
  if (rpg !== undefined && !(f.symptoms || f.crisis)) notes.push("A random glucose alone does not diagnose diabetes without classic symptoms or a crisis.");
  if (!t.length) return R("info", "Enter at least one result", notes.length ? notes : ["A1C, FPG or 2-h PG are each appropriate for diagnosis."]);
  const abn = t.filter(x => x.v >= x.dx), pre = t.filter(x => x.v >= x.pre && x.v < x.dx);
  if (abn.length >= 2 || (abn.length === 1 && f.repeat))
    return R("alert", "Diabetes confirmed", [...notes,
      abn.length >= 2 ? `Two different tests are above the cut point (${abn.map(x => x.n).join(" + ")}).` : "The same test is above the cut point on repeat.",
      "If another test is below its cut point, the person still has diabetes when two results meet criteria."],
      ["Classify the type (Classify tab).", "Screen for complications and comorbidities (ADA Sections 4 and 10–12)."]);
  if (abn.length === 1)
    return R("warn", "Above the diagnostic cut point — confirmation required", [...notes,
      `${abn[0].n} meets the criterion. Without unequivocal hyperglycemia, two abnormal results are required (Rec 2.1b).`,
      t.length > 1 ? "Discordant results: repeat the test that is above the cut point and check for factors that alter A1C or glucose (Table 2.3)." : "Repeat the same test or add a different one, measured at the same time or at a second time point."],
      ["Repeat promptly and record the result here (tick “repeat also abnormal”).", "Teach the person the symptoms of hyperglycemia meanwhile.", "For consistent, marked A1C–glucose discordance look for assay interference; consider fructosamine or glycated albumin (Rec 2.3)."]);
  if (pre.length) {
    const veryHigh = (a1c !== undefined && !f.a1cUnreliable && a1c > 6.0) || (fpg !== undefined && fpg >= 100 && og !== undefined && og >= 140);
    return R("warn", "Prediabetes range", [...notes, `In range: ${pre.map(x => x.n).join(", ")}.`, veryHigh ? "Very high risk (A1C >6.0% or both IFG and IGT): pursue aggressive intervention and vigilant follow-up." : "Risk is continuous and rises disproportionately at the upper end of the range."],
      ["Counsel on lowering diabetes and cardiovascular risk (ADA Section 3).", "Screen comprehensively for cardiovascular risk factors.", "Retest yearly (Table 2.5); if close to the diabetes threshold, teach symptoms and repeat in 3–6 months."]);
  }
  return R("ok", "Below prediabetes and diabetes thresholds", notes, ["Repeat screening at a minimum of 3-year intervals, sooner with symptoms, weight gain or new risk factors (Rec 2.12c)."]);
}

// ---- Classification: Fig 2.1, AABBCC, special types; Rec 2.5, 2.10, 2.29 ----
function unclear(cp?: number, yrs?: number, lead = ""): Result {
  const n = [lead, "Type 2 is likely in older adults. C-peptide is only meaningful in people treated with insulin; do not test within 2 weeks of a hyperglycemic emergency (Fig 2.1 notes)."].filter(Boolean);
  const a = ["A trial of noninsulin therapy may be appropriate with careful monitoring and education so insulin can start rapidly if glycemia deteriorates."];
  if (cp !== undefined && yrs !== undefined && yrs > 3) {
    if (cp < 200) return R("alert", "Type 1 diabetes (C-peptide <200 pmol/L after >3 years)", n, ["Insulin therapy; measure C-peptide before ever stopping insulin.", "Consider GLP-1 RA or SGLT2 inhibitor for cardiometabolic benefit if features of both types."]);
    if (cp > 600) return R("info", "Type 2 diabetes (C-peptide >600 pmol/L)", n, ["Proceed with type 2 management; investigate pancreatic or other causes if the picture is atypical."]);
    return R("warn", "Indeterminate (C-peptide 200–600 pmol/L)", [...n, "Values of 200–600 fit type 1 or MODY but can occur in insulin-treated type 2, especially with normal or low BMI or long duration."], ["Repeat C-peptide after >5 years of duration."]);
  }
  return R("warn", "Unclear classification — make a clinical treatment decision", n, [...a, "Consider a C-peptide test after >3 years of duration."]);
}
export function classify(f: F): Result {
  const ctx: Record<string, Result> = {
    neonatal: R("alert", "Neonatal diabetes (diagnosed before 6 months)", ["About 80–85% have a monogenic cause; autoimmune type 1 rarely occurs before 6 months."],
      ["Genetic testing regardless of current age (Rec 2.29a, A); refer to a diabetes genetics center (2.29c).", "KATP-related (KCNJ11, ABCC8): 30–50% improve on high-dose sulfonylurea instead of insulin. INS mutations need insulin."]),
    ici: R("alert", "Immune checkpoint inhibitor–induced diabetes", ["Occurs in 0.6–1.4% of treated people, often presents as DKA, and almost always needs lifelong insulin. Fewer than half have islet antibodies."],
      ["Refer promptly to an endocrinologist and provide diabetes self-management education.", "Monitor glucose before treatment and at each visit (Rec 2.20)."]),
    cf: R("alert", "Cystic fibrosis–related diabetes (CFRD)", ["Distinct from type 1 and type 2; often accompanied by exocrine pancreatic insufficiency."],
      ["Treat with insulin to individualized goals.", "Start annual complication monitoring 5 years after diagnosis (Rec 2.25)."]),
    tx: R("warn", "Posttransplantation diabetes mellitus (PTDM)", ["Formal diagnosis is best made once stable on immunosuppression (usually ≥3 months) and free of acute infection (Rec 2.26)."],
      ["OGTT is the preferred diagnostic test (Rec 2.27).", "Keep the immunosuppression that is best for graft survival, whatever the PTDM risk (Rec 2.28).", "Insulin is the agent of choice in hospital; choose long-term agents by side effects, drug interactions and cardiorenal benefit."]),
    panc: R("warn", "Pancreatic (type 3c) diabetes", ["Commonly misdiagnosed as type 2. Look for exocrine insufficiency, abnormal pancreatic imaging and absent type 1 autoimmunity."],
      ["Avoid incretin-based therapies; consider early insulin.", "Consider fecal elastase to screen for exocrine insufficiency.", "Selected people may be considered for islet autotransplantation at specialized centers."]),
    drug: R("warn", "Drug- or chemical-induced diabetes", ["Glucocorticoids, some antipsychotics, statins, thiazides and some HIV drugs raise glucose, often through insulin resistance."],
      ["With glucocorticoids, check postprandial (1–2 h after meals) or random glucose, not fasting (Rec 2.18).", "For HIV, consider changing the offending antiretroviral if safe alternatives exist."]),
  };
  if (ctx[f.ctx]) return ctx[f.ctx];
  const age = num(f.age), bmi = num(f.bmi), cp = num(f.cpep), yrs = num(f.years);
  const t1: string[] = [];
  if (age !== undefined && age < 35) t1.push("age <35"); if (bmi !== undefined && bmi < 25) t1.push("BMI <25");
  if (f.weightLoss) t1.push("unintentional weight loss"); if (f.ketosis) t1.push("ketoacidosis"); if (f.glu360) t1.push("glucose >360 mg/dL");
  const t2 = bmi !== undefined && bmi >= 25 && !f.weightLoss && !f.ketosis && !f.glu360;
  const feat = t1.length ? `Type 1–leaning features: ${t1.join(", ")}.` : "No type 1–leaning features entered.";
  if (f.ab === "pos") return R("alert", "Type 1 diabetes (islet autoantibody positive)", [feat, "Antibody positivity classifies as type 1; obesity does not exclude it."],
    ["Start insulin; educate on DKA prevention.", "Screen for other autoimmune disease (thyroid, celiac, Addison, pernicious anemia).", "If features of both types, label accordingly to access CGM and GLP-1 RA/SGLT2 inhibitor benefits."]);
  if (f.ab !== "neg") return R("info", "Test islet autoantibodies first", [feat, "Up to 40% of adults with new type 1 may be misdiagnosed as type 2."],
    ["Measure GAD first; if negative add IA-2 and/or ZnT8 (insulin antibody only if not yet on insulin).", "Standardized testing is recommended when type 1 risk factors overlap (Rec 2.10, E): younger age, weight loss, ketoacidosis, rapid need for insulin.", "Do not delay insulin if ketosis or rapid deterioration."]);
  const neg = "Antibody negative (5–10% of adult-onset type 1 has no antibodies).";
  if (age !== undefined && age < 35) {
    if (f.monogenic) {
      if (cp === undefined) return R("info", "Possible monogenic diabetes — check C-peptide", [feat, neg, "Suggestive: A1C <7.5% at diagnosis, one parent with diabetes, syndromic features, or model probability >5%."], ["Measure C-peptide if on insulin (≥600 pmol/L is valid at any time; <600 with glucose <70 mg/dL or fasting, repeat)."]);
      if (cp > 200) return R("warn", "Consider monogenic diabetes — genetic testing", [feat, neg], ["Genetic testing and referral to a diabetes genetics center (Rec 2.29b–c).", "HNF1A/HNF4A-MODY: sulfonylurea first line. GCK-MODY: usually no therapy."]);
      return R("alert", "Type 1 diabetes (antibody negative, C-peptide <200 pmol/L)", [feat, neg], ["Insulin therapy."]);
    }
    if (!t2) return R("alert", "Type 1 diabetes (antibody negative, age <35)", [feat, neg, "A negative result does not change the diagnosis in those <35 with no type 2 or monogenic features."], ["Insulin therapy and education."]);
    return unclear(cp, yrs, `${feat} ${neg} Type 2 features are also present.`);
  }
  return unclear(cp, yrs, `${feat} ${neg}`);
}

// ---- Screening: Table 2.5, 2.6; Rec 2.6–2.9, 2.11–2.23 ----
export function adultScreen(f: F): Result {
  const age = num(f.age), bmi = num(f.bmi), thr = f.asian ? 23 : 25;
  const rf = ["fdr", "eth", "cvd", "htn", "lipids", "pcos", "inactive", "insres"].filter(k => f[k]).length;
  const a: string[] = [], n: string[] = [];
  const now = f.prediabetes || f.gdm || (age !== undefined && age >= 35) || (bmi !== undefined && bmi >= thr && rf > 0);
  if (f.prediabetes) a.push("Prediabetes: test yearly."); else if (f.gdm) a.push("Prior GDM: test every 1–3 years for life (Rec 2.34).");
  else if (now) a.push("Test with FPG, 2-h OGTT or A1C (Rec 2.13). Normal results: repeat at ≥3-year intervals.");
  else a.push(`Below the age and risk-factor thresholds (overweight cut point ${thr} kg/m²). Reassess with age, weight gain or new risk factors.`);
  if (f.ogtt) a.push("Before an OGTT ensure ≥150 g/day of carbohydrate for 3 days (Rec 2.14).");
  if (f.steroid) a.push("Glucocorticoids: check postprandial or random glucose, not fasting (Rec 2.18). One pragmatic outpatient approach is twice weekly, daily if ≥200 mg/dL.");
  if (f.statin || f.thiazide) a.push("Statin or thiazide use: consider screening (Rec 2.16a).");
  if (f.sga) a.push("Second-generation antipsychotic: screen at baseline, 12–16 weeks after starting, then yearly (Rec 2.16b).");
  if (f.hiv) a.push("HIV: FPG before starting or switching ART and 3–6 months after; yearly if normal (Rec 2.17). Prefer plasma glucose over A1C.");
  if (f.ici) a.push("Immune checkpoint inhibitor: fasting or random glucose before treatment and at every visit; educate on hyperglycemia and DKA (Rec 2.19–2.20).");
  if (f.pi3k) a.push("PI3Kα inhibitor: glucose and A1C at baseline, random glucose weekly for 2 weeks then every 4 weeks; consider A1C every 3 months (Rec 2.21).");
  if (f.mtor) a.push("mTOR inhibitor: glucose before starting and at each visit; consider A1C every 3 months (Rec 2.22).");
  if (f.pancreatitis) a.push("Pancreatitis: screen 3–6 months after an acute episode and yearly thereafter; yearly for chronic pancreatitis (Rec 2.23).");
  if (f.periodontal) n.push("Periodontal disease marks a higher-risk group; monitor closely.");
  return R(now ? "warn" : "ok", now ? "Testing indicated" : "Routine screening not yet due", n, a);
}
export function childScreen(f: F): Result {
  const age = num(f.age), rf = ["mat", "fam", "eth", "ir"].filter(k => f[k]).length;
  const ok = (f.puberty || (age !== undefined && age >= 10)) && f.bmi !== "none" && rf > 0;
  return R(ok ? "warn" : "ok", ok ? "Risk-based testing indicated" : "Criteria not met",
    ["Testing applies after puberty onset or age 10 (whichever is earlier), with BMI ≥85th percentile plus at least one risk factor (Rec 2.15, Table 2.6). Type 2 before age 10 is reported and can be considered with many risk factors."],
    ok ? ["Use A1C, FPG or 2-h PG. If normal, repeat at ≥3-year intervals, sooner if BMI rises or risk factors accumulate."] : ["Reassess as weight, puberty or risk profile changes."]);
}
export function abScreen(f: F): Result {
  if (f.count === "none") return R("ok", "Autoantibody negative", ["Repeat testing is not routinely needed; consider it if symptoms or a strong family history develop."]);
  if (f.count === "multi") return R("alert", "Multiple islet autoantibodies: stage 1 or 2 type 1 diabetes", ["Stage 1 five-year risk of symptomatic disease is about 44%; stage 2 is about 75%."],
    ["Confirm with a second test within 3 months, ideally in an IASP-standardized lab.", "Evaluate for stage 3 with A1C, urinalysis and/or plasma glucose (Rec 2.8a).", "Refer to a specialized center for metabolic staging, education and prevention trials or approved therapy such as teplizumab (Rec 2.8b)."]);
  if (f.iaa2) return R("warn", "Single IA-2 autoantibody", ["IA-2 positivity is an independent risk factor for progression."], ["Monitor like multiple-antibody positivity (Rec 2.9).", "Evaluate for stage 3 diabetes now."]);
  return R("warn", "Single autoantibody", ["Up to half of children with one antibody revert to negative; adult progression risk is lower."],
    ["Confirm within 3 months; evaluate metabolic status.", "Repeat antibodies, random glucose and A1C every 6 months to 3 years by age: ≤3 y every 6 months for 3 years, then yearly for 3; 3–18 y yearly (consider stopping after 3 y if no progression); adults every 3 years, or yearly with added risk."]);
}

// ---- Pregnancy: Table 2.8; Rec 2.30–2.34 ----
export function gdm(f: F): Result {
  const v = (k: string) => num(f[k]);
  const ge = (x: number | undefined, c: number) => x !== undefined && x >= c;
  if (f.mode === "early") {
    const a1c = v("a1c"), fpg = v("fpg");
    if (ge(a1c, 6.5) || ge(fpg, 126)) return R("alert", "Meets diabetes criteria in early pregnancy", ["Use standard Table 2.1 criteria (confirmation needed unless unequivocal). Classify as diabetes complicating pregnancy, most often type 2."], ["Manage as pregestational diabetes (ADA Section 15)."]);
    if ((a1c !== undefined && a1c >= 5.9) || (fpg !== undefined && fpg >= 110)) return R("warn", "Early abnormal glucose metabolism", ["A1C 5.9–6.4% or FPG 110–125 mg/dL before 15 weeks signals higher adverse-outcome risk and later GDM (Rec 2.31b)."], ["Do not use the 24–28 week IADPSG or two-step criteria for early screening.", "Follow ADA Section 15 for management."]);
    return R("ok", "No early abnormality", [], ["If not otherwise diagnosed, screen for GDM at 24–28 weeks (Rec 2.32)."]);
  }
  if (f.mode === "one") {
    const hit = [ge(v("f0"), 92) && "fasting ≥92", ge(v("f1"), 180) && "1 h ≥180", ge(v("f2"), 153) && "2 h ≥153"].filter(Boolean);
    return hit.length ? R("alert", "GDM diagnosed (one-step, IADPSG)", [`Any single value at or above threshold: ${hit.join(", ")} mg/dL.`], ["Start GDM management (ADA Section 15).", "Screen for prediabetes/diabetes at 4–12 weeks postpartum with a 75-g OGTT (Rec 2.33)."]) : R("ok", "No GDM by one-step criteria", ["Thresholds: fasting 92, 1 h 180, 2 h 153 mg/dL after a 75-g OGTT."]);
  }
  if (f.mode === "two") {
    const cut = num(f.cut) || 140;
    if (v("glt") === undefined) return R("info", "Enter the 1-h 50-g glucose load result", ["Step 1 is nonfasting. Proceed to the 100-g OGTT if 1-h glucose ≥130, 135 or 140 mg/dL (ACOG accepts any)."]);
    if (v("glt") < cut) return R("ok", "Screen negative on step 1", [`1-h value is below ${cut} mg/dL.`]);
    const hit = [ge(v("c0"), 95), ge(v("c1"), 180), ge(v("c2"), 155), ge(v("c3"), 140)].filter(Boolean).length;
    if (hit >= 2) return R("alert", "GDM diagnosed (two-step, Carpenter-Coustan)", [`${hit} of 4 values met (fasting 95, 1 h 180, 2 h 155, 3 h 140 mg/dL).`], ["Start GDM management (ADA Section 15).", "Screen at 4–12 weeks postpartum with a 75-g OGTT (Rec 2.33)."]);
    return hit === 1 ? R("warn", "One elevated value on the 100-g OGTT", ["Two are required by Carpenter-Coustan; ACOG notes that one elevated value can be used for diagnosis."], ["Decide with the obstetric team."]) : R("info", "Step 1 positive: complete the 100-g OGTT", ["Fasting OGTT with values at fasting, 1, 2 and 3 h."]);
  }
  const d = diagnose({ fpg: f.f0, ogtt: f.f2 });
  return R(d.tone, `Postpartum 75-g OGTT: ${d.title}`, ["Use nonpregnancy criteria at 4–12 weeks postpartum (Rec 2.33).", ...d.notes], ["Lifelong screening every 1–3 years after GDM (Rec 2.34)."]);
}
