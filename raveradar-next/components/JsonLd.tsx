/**
 * Renders one or more JSON-LD blocks into the page.
 *
 * `dangerouslySetInnerHTML` is required here — React escapes text children, which
 * would corrupt the JSON. The payload is built from our own typed data, never from
 * user input, and `<` is escaped so a string value can't break out of the tag.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((b, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(b).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
