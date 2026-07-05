import Link from "next/link";

type CompareScenarioLinkProps = {
  id: number;
  label: string;
};

export function CompareScenarioLink({ id, label }: CompareScenarioLinkProps) {
  return (
    <Link
      href={"/configurations/" + id}
      className="text-emerald-700 hover:text-emerald-900 hover:underline"
    >
      {label}
    </Link>
  );
}