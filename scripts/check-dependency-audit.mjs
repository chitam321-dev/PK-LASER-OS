import { spawnSync } from "node:child_process";

const advisoryUrl = "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm";
const audit = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error("Dependency audit did not return valid JSON.");
  if (audit.stderr) console.error(audit.stderr);
  process.exit(1);
}

const vulnerabilities = Object.values(report.vulnerabilities ?? []);
const vulnerabilityByName = new Map(vulnerabilities.map((item) => [item.name, item]));
const highOrCritical = vulnerabilities.filter((item) =>
  item.severity === "high" || item.severity === "critical"
);

function reachesApprovedBracesAdvisory(name, seen = new Set()) {
  if (seen.has(name)) return false;
  seen.add(name);
  const item = vulnerabilityByName.get(name);
  if (!item) return false;
  if (
    name === "braces" &&
    item.severity === "high" &&
    item.via.some((entry) =>
      typeof entry === "object" && entry.url === advisoryUrl
    )
  ) {
    return true;
  }
  return item.via.some((entry) =>
    typeof entry === "string" && reachesApprovedBracesAdvisory(entry, seen)
  );
}

const approved = highOrCritical.filter((item) =>
  reachesApprovedBracesAdvisory(item.name)
);
const unapproved = highOrCritical.filter((item) => !approved.includes(item));

const counts = report.metadata?.vulnerabilities ?? {};
console.log(
  `Full dependency audit: ${counts.critical ?? 0} critical, ${counts.high ?? 0} high, ${counts.moderate ?? 0} moderate, ${counts.low ?? 0} low.`
);
for (const item of vulnerabilities.filter((entry) =>
  entry.severity === "moderate" || entry.severity === "low"
)) {
  console.log(`Tracked ${item.severity} advisory: ${item.name} (${item.range}).`);
}

if (unapproved.length > 0) {
  console.error("Unapproved high/critical dependency advisories:");
  for (const item of unapproved) {
    console.error(`- ${item.name}: ${item.via.map((entry) => typeof entry === "string" ? entry : entry.title).join(", ")}`);
  }
  process.exit(1);
}

if (approved.length > 0) {
  const productionTree = spawnSync(
    "npm",
    ["ls", "--omit=dev", "--all", "--json"],
    { encoding: "utf8" }
  );
  let tree;
  try {
    tree = JSON.parse(productionTree.stdout);
  } catch {
    console.error("Could not verify the production dependency tree; failing closed.");
    if (productionTree.stderr) console.error(productionTree.stderr);
    process.exit(1);
  }
  if (productionTree.status !== 0) {
    console.error("npm ls could not verify the production dependency tree; failing closed.");
    if (productionTree.stderr) console.error(productionTree.stderr);
    process.exit(1);
  }

  function containsPackage(node, name) {
    if (!node || typeof node !== "object") return false;
    if (node.name === name) return true;
    return Object.entries(node.dependencies ?? {}).some(([key, child]) =>
      key === name || containsPackage(child, name)
    );
  }

  const productionFindings = approved.filter((item) =>
    containsPackage(tree, item.name)
  );
  if (productionFindings.length > 0) {
    console.error("The braces exception is limited to development-only dependency paths; affected production packages were found:");
    for (const item of productionFindings) console.error(`- ${item.name}`);
    process.exit(1);
  }

  console.warn(
    `Accepted documented dev-only exception for GHSA-vfj7-8cjw-p6xm through the audit dependency chain: ${approved.map((item) => item.name).join(", ")}. Every affected package was verified absent from the production dependency tree. See docs/security/dependency-audit-exceptions.md.`
  );
}

if (audit.status !== 0 && vulnerabilities.length === 0) {
  console.error("npm audit failed without a parseable vulnerability report.");
  if (audit.stderr) console.error(audit.stderr);
  process.exit(1);
}

console.log("Dependency audit policy passed.");
