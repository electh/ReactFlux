const ARTICLE_PARAGRAPH =
  "Researchers published a detailed account of the project after testing the prototype with readers across several devices. The results explain what changed, where the design still needs work, and how the team plans to evaluate the next release."

const makeFixture = (id, title, content, expected = {}) => ({
  entry: {
    author: "",
    content,
    enclosures: [],
    feed: { site_url: "https://example.test/feed", title: "Design Desk" },
    id,
    title,
    ...expected.entry,
  },
  expectedExcerpt: expected.excerpt ?? ARTICLE_PARAGRAPH,
  expectedImage: expected.image ?? null,
  expectedImageReason: expected.imageReason ?? "",
  expectedRejectedImageReason: expected.rejectedImageReason ?? "",
  kind: expected.kind ?? "excerpt",
  expectedPreviewReason: expected.previewReason ?? "substantive-paragraph",
  id: String(id).padStart(2, "0"),
  name: expected.name ?? title,
})

const makeImageFixture = (id, title, content, expected = {}) =>
  makeFixture(id, title, content, { ...expected, kind: "image" })

const makePortugueseBoilerplateFixture = (id, title, phrase) =>
  makeFixture(
    id,
    title,
    `<p>${phrase}. ${"Esta área reúne avisos de navegação e interação da publicação. ".repeat(2)}</p><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: title },
  )

const paragraph = `<p>${ARTICLE_PARAGRAPH}</p>`

export const entryPresentationFixtures = [
  makeImageFixture(
    1,
    "Normal article with hero",
    `<figure><img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1600" height="900" alt="Readers at a newsroom desk"></figure>${paragraph}`,
    { image: "/scripts/tests/fixtures/valid-horizontal.svg", imageReason: "figure" },
  ),
  makeImageFixture(
    2,
    "Logo before hero",
    `<img src="https://example.test/assets/site-logo.png" width="1200" height="400" alt="Publication logo">` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Editorial photograph">${paragraph}`,
    {
      image: "/scripts/tests/fixtures/valid-horizontal.svg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makeImageFixture(
    3,
    "Avatar before hero",
    `<div class="author-avatar"><img src="https://example.test/avatar/editor.png" width="600" height="600" alt="Author portrait"></div>` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Editorial photograph">${paragraph}`,
    {
      image: "/scripts/tests/fixtures/valid-horizontal.svg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makeImageFixture(
    4,
    "Tracker before hero",
    `<img src="https://example.test/track/pixel.gif" width="1" height="1" alt="">` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Editorial photograph">${paragraph}`,
    {
      image: "/scripts/tests/fixtures/valid-horizontal.svg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makeImageFixture(
    5,
    "Social icon before hero",
    `<div class="share-buttons"><img src="https://example.test/social/share.svg" width="512" height="512" alt="Share"></div>` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Editorial photograph">${paragraph}`,
    {
      image: "/scripts/tests/fixtures/valid-horizontal.svg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makeImageFixture(
    6,
    "Ad image before hero",
    `<img class="ad-banner" src="https://example.test/campaign/ad-banner.jpg" width="1600" height="900" alt="Sponsored offer">` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Editorial photograph">${paragraph}`,
    {
      image: "/scripts/tests/fixtures/valid-horizontal.svg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makeImageFixture(
    7,
    "Multiple reasonable images",
    `<img src="https://example.test/story/inline.jpg" width="640" height="360" alt="Street scene">` +
      `<figure><img src="https://example.test/story/feature.jpg" width="1800" height="1000" alt="The central subject of the report"></figure>${paragraph}`,
    { image: "https://example.test/story/feature.jpg", imageReason: "high-resolution" },
  ),
  makeImageFixture(
    8,
    "Vertical editorial image",
    `<figure><img src="https://example.test/story/portrait.jpg" width="600" height="1000" alt="Vertical editorial portrait"></figure>${paragraph}`,
    { image: "https://example.test/story/portrait.jpg", imageReason: "usable-aspect-ratio" },
  ),
  makeImageFixture(
    9,
    "Ultrawide editorial image",
    `<img src="https://example.test/story/panorama.jpg" width="2400" height="400" alt="Panoramic landscape">${paragraph}`,
    {
      image: "https://example.test/story/panorama.jpg",
      imageReason: "extreme-aspect-ratio-penalty",
    },
  ),
  makeImageFixture(
    10,
    "Image without dimensions",
    `<img src="/scripts/tests/fixtures/valid-horizontal.svg" alt="Editorial photograph">${paragraph}`,
    { image: "/scripts/tests/fixtures/valid-horizontal.svg", imageReason: "content-image" },
  ),
  makeImageFixture(
    11,
    "Picture with srcset",
    `<picture><source type="image/webp" srcset="/scripts/tests/fixtures/valid-horizontal.svg 640w, /scripts/tests/fixtures/valid-hero.svg 1600w"><img src="/scripts/tests/fixtures/valid-horizontal.svg" srcset="/scripts/tests/fixtures/valid-horizontal.svg 640w, /scripts/tests/fixtures/valid-hero.svg 1200w" width="800" height="450" alt="Editorial feature image"></picture>${paragraph}`,
    { image: "/scripts/tests/fixtures/valid-hero.svg", imageReason: "high-resolution" },
  ),
  makeImageFixture(
    12,
    "Video poster",
    `<video poster="/scripts/tests/fixtures/valid-horizontal.svg" width="1280" height="720"></video>${paragraph}`,
    { image: "/scripts/tests/fixtures/valid-horizontal.svg", imageReason: "video-poster" },
  ),
  makeImageFixture(13, "Image enclosure only", paragraph, {
    image: "https://example.test/enclosures/report-cover.jpg",
    imageReason: "image-enclosure",
    name: "Enclosure only",
    entry: {
      enclosures: [
        {
          height: 900,
          mime_type: "image/jpeg",
          title: "Report cover",
          url: "https://example.test/enclosures/report-cover.jpg",
          width: 1600,
        },
      ],
    },
  }),
  makeImageFixture(
    14,
    "Enclosure and superior content hero",
    `<figure><img src="https://example.test/story/feature.jpg" width="1800" height="1000" alt="Feature photograph"></figure>${paragraph}`,
    {
      image: "https://example.test/story/feature.jpg",
      imageReason: "high-resolution",
      name: "Enclosure with superior content hero",
      entry: {
        enclosures: [
          {
            height: 240,
            mime_type: "image/jpeg",
            title: "Small attachment thumbnail",
            url: "https://example.test/enclosures/thumbnail.jpg",
            width: 240,
          },
        ],
      },
    },
  ),
  makeImageFixture(
    15,
    "Broken first candidate and valid second",
    `<img src="/scripts/tests/fixtures/broken-image.jpg" width="1800" height="1000" alt="First editorial candidate">` +
      `<img src="/scripts/tests/fixtures/valid-horizontal.svg" width="1200" height="675" alt="Second editorial candidate">${paragraph}`,
    { image: "/scripts/tests/fixtures/broken-image.jpg", imageReason: "high-resolution" },
  ),
  makeImageFixture(
    16,
    "No valid image",
    `<img src="https://example.test/tracking/pixel.gif" width="1" height="1" alt="">` +
      `<img src="https://example.test/assets/site-logo.svg" width="800" height="450" alt="Site logo">${paragraph}`,
    { image: null, imageReason: "no-eligible-image-candidate" },
  ),
  makeFixture(
    17,
    "Credit before paragraph",
    `<p class="photo-credit">Photo credit: Reuters, 2026.</p><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Credit before paragraph" },
  ),
  makeFixture(
    18,
    "Figcaption before paragraph",
    `<figure><img src="https://example.test/story/hero.jpg" width="1280" height="720"><figcaption>Getty Images, photo credit from the archive.</figcaption></figure><p>${ARTICLE_PARAGRAPH}</p>`,
    {
      image: "https://example.test/story/hero.jpg",
      imageReason: "editorial-aspect-ratio",
      name: "Figcaption before paragraph",
    },
  ),
  makeFixture(
    19,
    "Comments before paragraph",
    `<p class="comments-count">128 comments</p><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Comments before paragraph" },
  ),
  makeFixture(
    20,
    "Share links before paragraph",
    `<div class="social-share"><p><a href="https://example.test/share">Share this article with your friends and colleagues</a></p></div><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Share links before paragraph" },
  ),
  makeFixture(
    21,
    "Byline before paragraph",
    `<p class="byline">By Jane Reporter</p><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Byline before paragraph" },
  ),
  makeFixture(
    22,
    "Newsletter boilerplate",
    `<div class="newsletter-signup"><p>Subscribe to our newsletter for the latest updates and special offers from the publication.</p></div><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Newsletter boilerplate" },
  ),
  makeFixture(
    23,
    "Related stories before text",
    `<section class="related-stories"><p>Related stories from our newsroom are available to read next.</p></section><p>${ARTICLE_PARAGRAPH}</p>`,
    { name: "Related stories before text" },
  ),
  makeFixture(
    24,
    "Normal first paragraph",
    `<p>${ARTICLE_PARAGRAPH}</p><p>This later paragraph has more background for readers.</p>`,
    { name: "Normal first paragraph" },
  ),
  makeFixture(
    25,
    "Very short paragraphs",
    "<p>Short line.</p><p>Another tiny paragraph.</p><p>End.</p>",
    { excerpt: "", name: "Very short paragraphs", previewReason: "no-substantive-paragraph" },
  ),
  makeFixture(
    26,
    "Link-heavy paragraph",
    `<p>${Array.from({ length: 10 }, (_, index) => `<a href="https://example.test/${index}">Linked newsroom phrase ${index}</a>`).join(" ")}</p><p>Only a brief follow-up.</p>`,
    { excerpt: "", name: "Link-heavy paragraph", previewReason: "no-substantive-paragraph" },
  ),
  makeFixture(
    27,
    "No valid excerpt",
    `<p>12 comments</p><p>Photo credit: Getty Images.</p><figcaption>Continue reading this story.</figcaption><div class="related-posts">More related articles.</div>`,
    { excerpt: "", name: "No valid excerpt", previewReason: "no-substantive-paragraph" },
  ),
  makeImageFixture(
    28,
    "URL-only publication logo",
    `<img src="https://example.test/publication-logo.png" width="1200" height="675">`,
    {
      rejectedImageReason: "decorative-image-token",
      imageReason: "no-eligible-image-candidate",
    },
  ),
  makeImageFixture(
    29,
    "URL-only author avatar",
    `<img src="https://example.test/author-avatar.jpg" width="1200" height="675">`,
    {
      rejectedImageReason: "decorative-image-token",
      imageReason: "no-eligible-image-candidate",
    },
  ),
  makeImageFixture(
    30,
    "URL-only tracking pixel",
    `<img src="https://example.test/tracking-pixel.gif" width="1200" height="675">`,
    {
      rejectedImageReason: "decorative-image-token",
      imageReason: "no-eligible-image-candidate",
    },
  ),
  makeImageFixture(
    31,
    "URL-only social share icon",
    `<img src="https://example.test/social-share-icon.png" width="1200" height="675">`,
    {
      rejectedImageReason: "decorative-image-token",
      imageReason: "no-eligible-image-candidate",
    },
  ),
  makeImageFixture(
    32,
    "URL-only ad banner",
    `<img src="https://example.test/ad-banner.jpg" width="1200" height="675">`,
    {
      rejectedImageReason: "decorative-image-token",
      imageReason: "no-eligible-image-candidate",
    },
  ),
  makeImageFixture(
    33,
    "URL-only editorial hero control",
    `<img src="https://example.test/story/hero-photo.jpg" width="1200" height="675">`,
    {
      image: "https://example.test/story/hero-photo.jpg",
      imageReason: "editorial-aspect-ratio",
    },
  ),
  makePortugueseBoilerplateFixture(34, "PT-BR photo credit Reuters", "Foto: Agência Reuters"),
  makePortugueseBoilerplateFixture(
    35,
    "PT-BR photo credit and disclosure",
    "Foto: João Silva / Divulgação",
  ),
  makePortugueseBoilerplateFixture(36, "PT-BR image credits", "Créditos da imagem: Getty Images"),
  makePortugueseBoilerplateFixture(37, "PT-BR comments count", "23 COMENTÁRIOS"),
  makePortugueseBoilerplateFixture(38, "PT-BR share action", "Compartilhe esta notícia"),
  makePortugueseBoilerplateFixture(39, "PT-BR read more", "Leia mais"),
  makePortugueseBoilerplateFixture(40, "PT-BR continue reading", "Continue lendo"),
  makePortugueseBoilerplateFixture(41, "PT-BR advertising", "Publicidade"),
  makePortugueseBoilerplateFixture(42, "PT-BR related stories", "MATÉRIAS RELACIONADAS"),
  makePortugueseBoilerplateFixture(43, "PT-BR related news", "Notícias relacionadas"),
  makePortugueseBoilerplateFixture(44, "PT-BR newsletter subscription", "Assine nossa newsletter"),
  makePortugueseBoilerplateFixture(45, "PT-BR advertisement", "ANÚNCIO"),
  makePortugueseBoilerplateFixture(46, "PT-BR photo slash credit", "Foto / Agência Reuters"),
  makePortugueseBoilerplateFixture(47, "PT-BR image credit label", "Crédito: Agência Reuters"),
  makePortugueseBoilerplateFixture(48, "PT-BR image label", "Imagem: Banco de imagens"),
  makePortugueseBoilerplateFixture(49, "PT-BR standalone disclosure", "Divulgação"),
  makePortugueseBoilerplateFixture(50, "PT-BR rights notice", "Direitos reservados"),
  makePortugueseBoilerplateFixture(51, "PT-BR singular comment", "1 comentário"),
  makePortugueseBoilerplateFixture(52, "PT-BR share infinitive", "Compartilhar esta notícia"),
  makeFixture(
    53,
    "PT-BR boilerplate only",
    `<p>Foto: Agência Reuters. Publicidade. Compartilhe esta notícia. Leia mais e continue lendo. Assine nossa newsletter. Matérias relacionadas. Notícias relacionadas. Anúncio. Créditos da imagem: Getty Images. Imagem: divulgação. Direitos reservados. ${"Esta área reúne avisos de navegação e interação da publicação. ".repeat(2)}</p>`,
    { excerpt: "", name: "PT-BR boilerplate only", previewReason: "no-substantive-paragraph" },
  ),
]

export { ARTICLE_PARAGRAPH }
