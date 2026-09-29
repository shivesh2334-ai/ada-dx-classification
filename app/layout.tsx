import "./globals.css";
export const metadata = {
  title: "Diabetes Diagnosis & Classification Guide — ADA 2026",
  description: "Clinical decision support built from ADA Standards of Care in Diabetes—2026, Section 2.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
