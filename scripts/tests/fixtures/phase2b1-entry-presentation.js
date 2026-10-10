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
  expectedPreviewSource:
    expected.previewSource ?? ((expected.excerpt ?? ARTICLE_PARAGRAPH) ? "paragraph" : "none"),
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
  makeFixture(
    54,
    "Div-only article text",
    `<div>O tribunal retomará o julgamento nesta terça-feira, após receber os dados atualizados das partes envolvidas.</div>`,
    {
      excerpt:
        "O tribunal retomará o julgamento nesta terça-feira, após receber os dados atualizados das partes envolvidas.",
      previewSource: "block",
    },
  ),
  makeFixture(
    55,
    "Direct text-node content",
    "A prefeitura confirmou nesta segunda-feira que as obras serão retomadas após a conclusão da vistoria técnica.",
    {
      excerpt:
        "A prefeitura confirmou nesta segunda-feira que as obras serão retomadas após a conclusão da vistoria técnica.",
      previewSource: "document-fallback",
    },
  ),
  makeFixture(
    56,
    "BR-separated summary",
    `<div>O governo publicou nesta terça o calendário atualizado da vacinação<br>e confirmou que os postos funcionarão também durante o próximo fim de semana.</div>`,
    {
      excerpt:
        "O governo publicou nesta terça o calendário atualizado da vacinação e confirmou que os postos funcionarão também durante o próximo fim de semana.",
      previewSource: "block",
    },
  ),
  makeFixture(
    57,
    "Section-only content",
    `<section>A universidade anunciou nesta quarta a abertura de novas vagas para o programa de bolsas, com inscrições disponíveis até o fim do mês.</section>`,
    {
      excerpt:
        "A universidade anunciou nesta quarta a abertura de novas vagas para o programa de bolsas, com inscrições disponíveis até o fim do mês.",
      previewSource: "block",
    },
  ),
  makeFixture(
    58,
    "Description-class content",
    `<div class="description">A comissão divulgou o relatório final nesta manhã e explicou quais medidas serão adotadas nos próximos meses.</div>`,
    {
      excerpt:
        "A comissão divulgou o relatório final nesta manhã e explicou quais medidas serão adotadas nos próximos meses.",
      previewSource: "block",
    },
  ),
  makeFixture(
    59,
    "Short valid paragraph",
    "<p>A equipe confirmou nesta quarta que o serviço será retomado amanhã.</p>",
    {
      excerpt: "A equipe confirmou nesta quarta que o serviço será retomado amanhã.",
      previewSource: "paragraph",
    },
  ),
  makeFixture(60, "Short PT-BR lead", "<p>STF retoma nesta terça o julgamento sobre o tema.</p>", {
    excerpt: "STF retoma nesta terça o julgamento sobre o tema.",
    previewSource: "paragraph",
  }),
  makeFixture(
    61,
    "Nested divs without duplicate text",
    `<div><div>${ARTICLE_PARAGRAPH}</div></div>`,
    { excerpt: ARTICLE_PARAGRAPH, previewSource: "block" },
  ),
  makeFixture(
    62,
    "Image followed by direct editorial text",
    `<img src="https://example.test/story/hero-photo.jpg" width="1200" height="675"> O ministério confirmou nesta quinta que a nova etapa do programa começa na próxima semana, com atendimento em todas as capitais.`,
    {
      excerpt:
        "O ministério confirmou nesta quinta que a nova etapa do programa começa na próxima semana, com atendimento em todas as capitais.",
      previewSource: "document-fallback",
    },
  ),
  makeFixture(
    63,
    "Boilerplate div and valid direct text",
    `<div class="newsletter-signup">Subscribe to our newsletter for the latest updates and special offers from the publication.</div> A defesa civil confirmou nesta manhã que as equipes seguem monitorando o nível dos rios depois das chuvas intensas.`,
    {
      excerpt:
        "A defesa civil confirmou nesta manhã que as equipes seguem monitorando o nível dos rios depois das chuvas intensas.",
      previewSource: "document-fallback",
    },
  ),
  makeFixture(
    64,
    "Thirty-five character fragment",
    `<p>Julgamento será retomado nesta terça.</p>`,
    { excerpt: "", previewReason: "no-substantive-paragraph" },
  ),
  makeFixture(
    65,
    "Ninety-character paragraph",
    `<p>O governo anunciou nesta terça uma nova etapa do programa, com início previsto para novembro.</p>`,
    {
      excerpt:
        "O governo anunciou nesta terça uma nova etapa do programa, com início previsto para novembro.",
      previewSource: "paragraph",
    },
  ),
  makeFixture(
    66,
    "Boilerplate-only block content",
    `<div class="newsletter-signup">Assine a newsletter para receber as principais notícias e atualizações da publicação.</div><div class="related-stories">Matérias relacionadas e leia mais.</div>`,
    { excerpt: "", previewReason: "no-substantive-paragraph" },
  ),
  makeFixture(
    67,
    "Hidden and comments content removed before direct text fallback",
    `<div class="comments">${ARTICLE_PARAGRAPH}</div><div hidden>${ARTICLE_PARAGRAPH}</div><figure><img src="https://example.test/story/hero.jpg" width="1200" height="675"><figcaption>Créditos da imagem: Getty Images.</figcaption></figure> A prefeitura informou nesta manhã que o atendimento será retomado em todas as unidades da região após a conclusão dos reparos.`,
    {
      excerpt:
        "A prefeitura informou nesta manhã que o atendimento será retomado em todas as unidades da região após a conclusão dos reparos.",
      previewSource: "document-fallback",
    },
  ),
]

export { ARTICLE_PARAGRAPH }

const makeSynopsisFixture = (
  id,
  title,
  content,
  {
    expectedSentence,
    expectedSentenceIndex,
    expectedSource = "sentence",
    expectedPreviewNonempty = false,
    titleOverlapAssisted = false,
    truncated = expectedSentence ? expectedSentence.length > 60 : false,
  },
) => ({
  entry: {
    author: "",
    content,
    enclosures: [],
    feed: { site_url: "https://example.test/feed", title: "Synopsis Desk" },
    id: `synopsis-${id}`,
    published_at: "2026-10-10T12:00:00.000Z",
    reading_time: 3,
    starred: false,
    title,
  },
  expectedSentence,
  expectedSentenceIndex,
  expectedSource,
  expectedPreviewNonempty,
  expectedTitleOverlapAssisted: titleOverlapAssisted,
  expectedTruncated: truncated,
  id: `S${String(id).padStart(2, "0")}`,
  name: title,
})

export const cardSynopsisFixtures = [
  makeSynopsisFixture(
    1,
    "STF resumes judgment on platform responsibility",
    "<p>The court session started at 14:00 on Tuesday after the justices arrived at the building. The STF resumed its judgment on platform responsibility, considering how companies must respond to illegal posts.</p>",
    {
      expectedSentence:
        "The STF resumed its judgment on platform responsibility, considering how companies must respond to illegal posts.",
      expectedSentenceIndex: 2,
      titleOverlapAssisted: true,
    },
  ),
  makeSynopsisFixture(
    2,
    "Apple introduces MacBook Pro with the M6 chip",
    "<p>Apple held its launch event this morning before a group of invited journalists and developers. The new MacBook Pro uses the M6 chip and promises longer battery life for demanding creative work.</p>",
    {
      expectedSentence:
        "The new MacBook Pro uses the M6 chip and promises longer battery life for demanding creative work.",
      expectedSentenceIndex: 2,
      titleOverlapAssisted: true,
    },
  ),
  makeSynopsisFixture(
    3,
    "Study finds vaccine reduced severe illness by 42 percent",
    "<p>Researchers found that the new vaccine reduced severe illness by 42% in a year-long study involving 18,000 adults.</p>",
    {
      expectedSentence:
        "Researchers found that the new vaccine reduced severe illness by 42% in a year-long study involving 18,000 adults.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    4,
    "The Senate approves the climate bill after a five-hour debate",
    "<p>The Senate approves the climate bill after a five-hour debate. The measure now heads to the president, who has ten days to sign it or send it back to Congress.</p>",
    {
      expectedSentence:
        "The measure now heads to the president, who has ten days to sign it or send it back to Congress.",
      expectedSentenceIndex: 2,
    },
  ),
  makeSynopsisFixture(
    5,
    "City opens a new bridge over the Blue River",
    "<p>The city opened the new bridge over the Blue River on Wednesday, after completing final safety tests.</p><p>The lengthy infrastructure program involved several contractors, months of road closures, detailed environmental reviews, and a large budget approved by the city council.</p>",
    {
      expectedSentence:
        "The city opened the new bridge over the Blue River on Wednesday, after completing final safety tests.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    6,
    "STF retoma julgamento sobre responsabilidade das plataformas",
    "<p>A sessão começou às 14h desta terça-feira, com a chegada dos ministros ao tribunal. O STF retomou o julgamento sobre a responsabilidade das plataformas digitais por publicações ilegais.</p>",
    {
      expectedSentence:
        "O STF retomou o julgamento sobre a responsabilidade das plataformas digitais por publicações ilegais.",
      expectedSentenceIndex: 2,
      titleOverlapAssisted: true,
    },
  ),
  makeSynopsisFixture(
    7,
    "Apple lança MacBook Pro com chip M6",
    "<p>A Apple realizou o evento de lançamento nesta manhã diante de jornalistas e desenvolvedores convidados. O novo MacBook Pro usa o chip M6 e promete mais autonomia para trabalhos criativos.</p>",
    {
      expectedSentence:
        "O novo MacBook Pro usa o chip M6 e promete mais autonomia para trabalhos criativos.",
      expectedSentenceIndex: 2,
      titleOverlapAssisted: true,
    },
  ),
  makeSynopsisFixture(
    8,
    "Estudo aponta queda de 42% nos casos graves da doença",
    "<p>Pesquisadores observaram que a nova vacina reduziu os casos graves em 42% durante um estudo de um ano com 18 mil adultos.</p>",
    {
      expectedSentence:
        "Pesquisadores observaram que a nova vacina reduziu os casos graves em 42% durante um estudo de um ano com 18 mil adultos.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    9,
    "Senado aprova projeto climático após debate de cinco horas",
    "<p>Senado aprova projeto climático após debate de cinco horas. A proposta segue agora para o presidente, que tem dez dias para sancionar o texto ou devolvê-lo ao Congresso.</p>",
    {
      expectedSentence:
        "A proposta segue agora para o presidente, que tem dez dias para sancionar o texto ou devolvê-lo ao Congresso.",
      expectedSentenceIndex: 2,
    },
  ),
  makeSynopsisFixture(
    10,
    "Cidade inaugura nova ponte sobre o Rio Azul",
    "<p>A cidade inaugurou a nova ponte sobre o Rio Azul nesta quarta-feira, após concluir os testes finais de segurança.</p><p>O longo programa de infraestrutura envolveu diversas empreiteiras, meses de bloqueios viários, análises ambientais detalhadas e um orçamento aprovado pela câmara municipal.</p>",
    {
      expectedSentence:
        "A cidade inaugurou a nova ponte sobre o Rio Azul nesta quarta-feira, após concluir os testes finais de segurança.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    11,
    "New transit plan brings changes across the city",
    `<p>The regional transit authority published a detailed service plan this morning, listing new schedules, station changes, transfer rules, and several other updates for commuters across the city. ${"The extended notice also repeats background information for passengers. ".repeat(4)}</p>`,
    { expectedSentenceIndex: 1, truncated: true },
  ),
  makeSynopsisFixture(
    12,
    "Prefeitura divulga plano de transporte para a região metropolitana",
    "<p>A prefeitura divulgou nesta terça um plano detalhado de transporte para bairros da região metropolitana, com alterações de linhas, horários e integração tarifária</p>",
    {
      expectedSentenceIndex: null,
      expectedSource: "none",
      expectedPreviewNonempty: true,
    },
  ),
  makeSynopsisFixture(
    13,
    "Senado aprova novo plano de transporte urbano",
    "<p>O Senado aprovou nesta terça o novo plano de transporte urbano.</p>",
    {
      expectedSentence: "O Senado aprovou nesta terça o novo plano de transporte urbano.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    14,
    "NASA confirma missão Artemis III para 2027",
    "<p>NASA's Artemis III mission will launch from Kennedy Space Center in 2027.</p>",
    {
      expectedSentence: "NASA's Artemis III mission will launch from Kennedy Space Center in 2027.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    15,
    "Pesquisadora apresenta medidas para infraestrutura metropolitana",
    "<p>A pesquisadora Mariana Costa apresentou em São José dos Campos 18 medidas de interoperabilidade para a infraestrutura metropolitana.</p>",
    {
      expectedSentence:
        "A pesquisadora Mariana Costa apresentou em São José dos Campos 18 medidas de interoperabilidade para a infraestrutura metropolitana.",
      expectedSentenceIndex: 1,
    },
  ),
  makeSynopsisFixture(
    16,
    "Researchers find vulnerabilities in satellite-navigation networks",
    "<p>Researchers at the Massachusetts Institute of Technology identified 37 vulnerabilities in satellite-navigation infrastructure used by regional carriers.</p>",
    {
      expectedSentence:
        "Researchers at the Massachusetts Institute of Technology identified 37 vulnerabilities in satellite-navigation infrastructure used by regional carriers.",
      expectedSentenceIndex: 1,
    },
  ),
]

export const cardSynopsisPresenterFixtures = [
  {
    entry: {
      author: "",
      cardSynopsis: "",
      content: "",
      coverCandidates: [],
      feed: { site_url: "https://example.test/feed", title: "Synopsis Desk" },
      id: "presenter-empty-synopsis",
      previewText: ARTICLE_PARAGRAPH,
      published_at: "2026-10-10T12:00:00.000Z",
      reading_time: 3,
      starred: false,
      title: "Excerpt present without a card synopsis",
    },
    expectedRenderedSummary: null,
    id: "presenter-empty-synopsis",
    name: "presenter-explicit-empty",
  },
]
