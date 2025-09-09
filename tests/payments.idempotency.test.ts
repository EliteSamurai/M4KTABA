import {
  begin,
  commit,
  deriveIdempotencyKey,
  makeKey,
} from "@/lib/idempotency";

describe("idempotency", () => {
  it("reuses committed result on second begin", async () => {
    const key = makeKey(["pay", "create", "u1", "o1"]);
    await begin(key);
    await commit(key, { ok: true });
    const again = await begin(key);
    expect(again?.status).toBe("committed");
  });

  it("derives stable key from inputs", () => {
    const a = deriveIdempotencyKey("create", "u1", "o1");
    const b = deriveIdempotencyKey("create", "u1", "o1");
    expect(a).toBe(b);
  });
});
