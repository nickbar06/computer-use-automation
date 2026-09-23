export function parameterizeValue(
  value: string,
  inputs: Record<string, string>,
): string | undefined {
  for (const [name, example] of Object.entries(inputs)) {
    if (value === example) return `$inputs.${name}`;
  }
  return undefined;
}

/** Replace concrete input values in the URL path with `:name` tokens. Returns pathname only. */
export function canonicalizeUrl(url: string, inputs: Record<string, string>): string {
  const path = new URL(url).pathname;
  let out = path;
  for (const [name, value] of Object.entries(inputs)) {
    if (!value) continue;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`/${escaped}(?=/|$)`, "g"), `/:${name}`);
  }
  return out;
}

export function bindUrlTemplate(template: string, inputs: Record<string, string>): string {
  return template.replace(/:([A-Za-z_][\w]*)/g, (_match, name: string) => {
    const value = inputs[name];
    if (value === undefined) throw new Error(`missing input for :${name}`);
    return value;
  });
}
