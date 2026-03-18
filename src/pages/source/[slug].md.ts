import { getCatalogItem, loadCatalogItems } from "../../lib/catalog";

export function getStaticPaths() {
  return loadCatalogItems().map((item) => ({
    params: { slug: item.slug },
  }));
}

export async function GET({ params }: { params: { slug?: string } }) {
  const slug = params.slug;
  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const item = getCatalogItem(slug);
  if (!item) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(item.sourceText, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}-SKILL.md"`,
    },
  });
}
