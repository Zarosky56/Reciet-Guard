export function repairJson(raw: string): unknown | null {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  const candidate = match[0];

  try {
    return JSON.parse(candidate);
  } catch {
    const repaired = candidate
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
      .replace(/:\s*'([^']*)'/g, ': "$1"');

    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}
