import fs from "fs";
import path from "path";

describe("perf lazy-load", () => {
  it("payment element and address autocomplete are not in initial checkout chunk", () => {
    const appDir = path.join(
      process.cwd(),
      ".next",
      "server",
      "app",
      "checkout"
    );
    if (!fs.existsSync(appDir)) {
      // If not built, skip
      return;
    }
    const files = fs.readdirSync(appDir).join("\n");
    // Expect dynamic import chunks, not inline in root
    expect(files).toMatch(/chunk/);
    // Payment form and address validator should be in their own dynamic chunks
    const all = fs.readFileSync(path.join(appDir, "page.js"), "utf8");
    expect(all).not.toMatch(/PaymentElement/);
    // Address validator module imported via dynamic()
    expect(all).not.toMatch(/address-validator/);
  });
});
