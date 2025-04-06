import { toKebabCase, toPascalCase } from "../lib/utils/string";

test("パスカルケースへの変換の検証", () => {
  expect(toPascalCase("sample-project-test")).toBe("SampleProjectTest");
  expect(toPascalCase("sample project test")).toBe("SampleProjectTest");
  expect(toPascalCase("sample_project_test")).toBe("SampleProjectTest");
  expect(toPascalCase("sampleProjectTest")).toBe("SampleProjectTest");
  expect(toPascalCase("sample-project")).toBe("SampleProject");
  expect(toPascalCase("sample")).toBe("Sample");
});

test("ケバブケースへの変換の検証", () => {
  expect(toKebabCase("sample-project-test")).toBe("sample-project-test");
  expect(toKebabCase("sample_project_test")).toBe("sample-project-test");
  expect(toKebabCase("sampleProjectTest")).toBe("sample-project-test");
  expect(toKebabCase("sample-project")).toBe("sample-project");
  expect(toKebabCase("sample")).toBe("sample");
});
