/**
 * Preload critical fonts to reduce FCP
 */
export function PreloadFonts() {
  return (
    <>
      <link
        rel="preload"
        href="/_next/static/media/[montserrat-hash].woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}

