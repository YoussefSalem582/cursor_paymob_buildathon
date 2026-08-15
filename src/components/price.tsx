import { piastresToEgp } from "@/lib/paymob";

export function Price({ piastres }: { piastres: number }) {
  const egp = piastresToEgp(piastres);
  return (
    <span className="font-display tabular-nums">
      {new Intl.NumberFormat("en-EG", {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0,
      }).format(egp)}
    </span>
  );
}
