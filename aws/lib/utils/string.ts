export function toPascalCase(input: string): string {
  return input
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
export function toKebabCase(input: string): string {
  return input
    .split(/[\s_]+/)
    .map((word) => word.toLowerCase())
    .join("-");
}

export function toCamelCase(input: string): string {
  return input
    .split(/[\s-_]+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}
