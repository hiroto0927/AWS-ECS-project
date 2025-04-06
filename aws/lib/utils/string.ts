export function toPascalCase(input: string): string {
  return input
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export function toKebabCase(input: string): string {
  return input
    .split(/(?=[A-Z])|[\s_]+/)
    .join("-")
    .toLowerCase();
}
