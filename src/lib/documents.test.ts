import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./db";
import { createDocumentsService, type DocumentsService } from "./documents";

let docs: DocumentsService;

beforeEach(async () => {
  docs = createDocumentsService(await createTestDb());
});

describe("My documents", () => {
  it("a created Document is owned by its creator and listed under My documents", async () => {
    const doc = await docs.create("alice", "Plan");
    const list = await docs.list("alice");
    expect(list.mine.map((d) => d.id)).toEqual([doc.id]);
    expect(list.shared).toEqual([]);
    expect(doc.title).toBe("Plan");
    expect(doc.owner).toBe("alice");
  });
});

describe("Save and reopen", () => {
  it("renamed title and formatted content are preserved when reopened", async () => {
    const doc = await docs.create("alice", "Draft");
    const html = "<h1>Hi</h1><p><strong>bold</strong> <em>it</em> <u>un</u></p><ul><li><p>x</p></li></ul>";
    await docs.save("alice", doc.id, { title: "Final", content: html });
    const reopened = await docs.get("alice", doc.id);
    expect(reopened.title).toBe("Final");
    expect(reopened.content).toBe(html);
  });

  it("rejects an empty title", async () => {
    const doc = await docs.create("alice", "Draft");
    await expect(docs.save("alice", doc.id, { title: "   " })).rejects.toMatchObject({ code: "invalid" });
  });

  it("hides a Document from a User with no access", async () => {
    const doc = await docs.create("alice", "Private");
    await expect(docs.get("bob", doc.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(docs.save("bob", doc.id, { title: "Hax" })).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("Sharing", () => {
  it("a shared Document appears under Shared with me, with its Owner, and the Collaborator can edit it", async () => {
    const doc = await docs.create("alice", "Spec");
    await docs.share("alice", doc.id, "bob");

    const bobs = await docs.list("bob");
    expect(bobs.mine).toEqual([]);
    expect(bobs.shared.map((d) => [d.id, d.owner])).toEqual([[doc.id, "alice"]]);

    await docs.save("bob", doc.id, { title: "Spec v2", content: "<p>bob was here</p>" });
    expect((await docs.get("alice", doc.id)).content).toBe("<p>bob was here</p>");
  });

  it("only the Owner can Share", async () => {
    const doc = await docs.create("alice", "Spec");
    await docs.share("alice", doc.id, "bob");
    await expect(docs.share("bob", doc.id, "carol")).rejects.toMatchObject({ code: "forbidden" });
  });

  it("explains an unknown username, and sharing with yourself", async () => {
    const doc = await docs.create("alice", "Spec");
    await expect(docs.share("alice", doc.id, "zed")).rejects.toMatchObject({
      code: "invalid",
      message: expect.stringContaining("zed"),
    });
    await expect(docs.share("alice", doc.id, "alice")).rejects.toMatchObject({ code: "invalid" });
  });

  it("sharing twice does not duplicate the Document", async () => {
    const doc = await docs.create("alice", "Spec");
    await docs.share("alice", doc.id, "bob");
    await docs.share("alice", doc.id, "BOB ");
    expect((await docs.list("bob")).shared).toHaveLength(1);
  });

  it("get reports who the Collaborators are to the Owner", async () => {
    const doc = await docs.create("alice", "Spec");
    await docs.share("alice", doc.id, "bob");
    expect((await docs.get("alice", doc.id)).collaborators).toEqual(["bob"]);
  });
});

describe("Import", () => {
  const bytes = (t: string) => new TextEncoder().encode(t);

  it("turns a .txt file into a new Document titled after the file, escaping markup and keeping paragraphs", async () => {
    const doc = await docs.importTxt("alice", { name: "Meeting notes.txt", bytes: bytes("Hello <b>x</b> & y\nline two\n\nSecond para") });
    expect(doc.title).toBe("Meeting notes");
    expect(doc.owner).toBe("alice");
    expect(doc.content).toBe("<p>Hello &lt;b&gt;x&lt;/b&gt; &amp; y<br>line two</p><p>Second para</p>");
    expect((await docs.list("alice")).mine.map((d) => d.id)).toContain(doc.id);
  });

  it("rejects other file types, naming the supported one", async () => {
    await expect(docs.importTxt("alice", { name: "a.docx", bytes: bytes("x") })).rejects.toMatchObject({
      code: "invalid",
      message: expect.stringContaining(".txt"),
    });
  });

  it("rejects files over 1 MB", async () => {
    await expect(
      docs.importTxt("alice", { name: "big.txt", bytes: new Uint8Array(1024 * 1024 + 1) }),
    ).rejects.toMatchObject({ code: "invalid", message: expect.stringContaining("1 MB") });
  });
});
