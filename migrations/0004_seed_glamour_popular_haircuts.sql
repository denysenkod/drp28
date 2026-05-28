-- Seed gallery with women's haircut images scraped from
-- Glamour: Best Haircuts for Women 2026 (https://www.glamour.com/gallery/most-popular-haircuts)
-- These are added alongside the existing British GQ men's hair trend images.
INSERT OR IGNORE INTO gallery_images (id, title, description, image_url, features_json)
VALUES
  (
    'glamour-2026-itty-bitty-bob-1',
    'Itty-Bitty Bob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/68ed7181a4fe9188be0eb761/master/w_1024%2Cc_limit/GettyImages-2198831032%2520(1).jpg',
    '["glamour","womens-hair-trends","the-itty-bitty-bob"]'
  ),
  (
    'glamour-2026-itty-bitty-bob-2',
    'Itty-Bitty Bob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5a43f2d39155a83e134b41f9/master/w_1024%2Cc_limit/Screen%2520Shot%25202017-12-27%2520at%25202.21.18%2520PM.png',
    '["glamour","womens-hair-trends","the-itty-bitty-bob"]'
  ),
  (
    'glamour-2026-bold-bangs-1',
    'Bold Bangs 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/68ed1428c87c59fb7751c2d1/master/w_1024%2Cc_limit/2240485359',
    '["glamour","womens-hair-trends","the-bold-bangs"]'
  ),
  (
    'glamour-2026-bold-bangs-2',
    'Bold Bangs 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/69372e08f7553c6ee07ccf56/master/w_1024%2Cc_limit/GettyImages-2249731577.jpg',
    '["glamour","womens-hair-trends","the-bold-bangs"]'
  ),
  (
    'glamour-2026-waterfall-layers-1',
    'Waterfall Layers 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/693071561ac87b8c5499bd76/master/w_1024%2Cc_limit/GettyImages-2233957555%2520(1).jpg',
    '["glamour","womens-hair-trends","the-waterfall-layers"]'
  ),
  (
    'glamour-2026-waterfall-layers-2',
    'Waterfall Layers 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6941c8a9c0d7c066afcdc882/master/w_1024%2Cc_limit/4bee6291-dd33-4827-845a-41da20bb0dd2.jpeg',
    '["glamour","womens-hair-trends","the-waterfall-layers"]'
  ),
  (
    'glamour-2026-off-duty-lob-1',
    'Off-Duty Lob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6940343a9d0f178a14bcedf2/master/w_1024%2Cc_limit/588735614_18567736753037292_7094520756821958226_n.jpg',
    '["glamour","womens-hair-trends","the-off-duty-lob"]'
  ),
  (
    'glamour-2026-off-duty-lob-2',
    'Off-Duty Lob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6941c00b060835e704f230c5/master/w_1024%2Cc_limit/779a4786-2c54-4162-a272-786734b8487d.jpeg',
    '["glamour","womens-hair-trends","the-off-duty-lob"]'
  ),
  (
    'glamour-2026-tinkerbell-haircut-1',
    'Tinkerbell Haircut 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/690e0910ff45fda4d90b0032/master/w_1024%2Cc_limit/GettyImages-2222348273.jpg',
    '["glamour","womens-hair-trends","the-tinkerbell-haircut"]'
  ),
  (
    'glamour-2026-tinkerbell-haircut-2',
    'Tinkerbell Haircut 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6945ae0f2fdefbc38c1a97d9/master/w_1024%2Cc_limit/GettyImages-2171851716.jpg',
    '["glamour","womens-hair-trends","the-tinkerbell-haircut"]'
  ),
  (
    'glamour-2026-modern-shag',
    'Modern Shag',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6942fb16ce635d3f09163b83/master/w_1024%2Cc_limit/original-B7569862-0FEB-4F63-A97D-B13CDDC0A591.jpg',
    '["glamour","womens-hair-trends","the-modern-shag"]'
  ),
  (
    'glamour-2026-curly-shag',
    'Curly Shag',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5ea87ba53fb8170008a753c2/master/w_1024%2Cc_limit/GettyImages-1082127492%2520(1).jpg',
    '["glamour","womens-hair-trends","the-curly-shag"]'
  ),
  (
    'glamour-2026-flippy-ends-1',
    'Flippy Ends 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6941c747c749ed7ad0f7b2e2/master/w_1024%2Cc_limit/GettyImages-2242278805.jpg',
    '["glamour","womens-hair-trends","the-flippy-ends"]'
  ),
  (
    'glamour-2026-flippy-ends-2',
    'Flippy Ends 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/691e03365f0d47e9de19a1de/master/w_1024%2Cc_limit/GettyImages-2244953428%2520(1).jpg',
    '["glamour","womens-hair-trends","the-flippy-ends"]'
  ),
  (
    'glamour-2026-long-and-sleek-1',
    'Long and Sleek 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6945ab6df8572a721d7097b6/master/w_1024%2Cc_limit/7e653d96-f872-4796-abcf-4a10e4bbb1ac.jpeg',
    '["glamour","womens-hair-trends","the-long-and-sleek"]'
  ),
  (
    'glamour-2026-long-and-sleek-2',
    'Long and Sleek 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6942ed7ee1bd6d462adae46f/master/w_1024%2Cc_limit/1d865787-1f21-4854-98ec-6a9876873742.jpeg',
    '["glamour","womens-hair-trends","the-long-and-sleek"]'
  ),
  (
    'glamour-2026-italian-bob-1',
    'Italian Bob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/673e28d3688ae8c6b0af3446/master/w_1024%2Cc_limit/448391671_1714211912441718_1703583485903221085_n.jpg',
    '["glamour","womens-hair-trends","the-italian-bob"]'
  ),
  (
    'glamour-2026-italian-bob-2',
    'Italian Bob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/66686567504d01e278034c06/master/w_1024%2Cc_limit/BOB%2520HAIRCUTS%2520180424%2520hoskelsa.jpg',
    '["glamour","womens-hair-trends","the-italian-bob"]'
  ),
  (
    'glamour-2026-birkin-bangs-1',
    'Birkin Bangs 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/673e2819cef512a5e26a2b3b/master/w_1024%2Cc_limit/460726732_494341936922492_2280519371179861965_n.jpg',
    '["glamour","womens-hair-trends","the-birkin-bangs"]'
  ),
  (
    'glamour-2026-birkin-bangs-2',
    'Birkin Bangs 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/67f428d390fae0a0a01d15cf/master/w_1024%2Cc_limit/2160776183',
    '["glamour","womens-hair-trends","the-birkin-bangs"]'
  ),
  (
    'glamour-2026-whisper-pixie-1',
    'Whisper Pixie 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/661703832fc6373b7e6a4f70/master/w_1024%2Cc_limit/taylor_hill_1710444183_3323769174907126534_32728491.jpg',
    '["glamour","womens-hair-trends","the-whisper-pixie"]'
  ),
  (
    'glamour-2026-whisper-pixie-2',
    'Whisper Pixie 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6616f6ac9b35a1dac846d938/master/w_1024%2Cc_limit/1701203182',
    '["glamour","womens-hair-trends","the-whisper-pixie"]'
  ),
  (
    'glamour-2026-beach-bob-1',
    'Beach Bob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/66c36e2a0c3dc9f8ab1f8742/master/w_1024%2Cc_limit/111.jpg',
    '["glamour","womens-hair-trends","the-beach-bob"]'
  ),
  (
    'glamour-2026-beach-bob-2',
    'Beach Bob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/672a35fe88179fa6f4286107/master/w_1024%2Cc_limit/111.jpg',
    '["glamour","womens-hair-trends","the-beach-bob"]'
  ),
  (
    'glamour-2026-old-hollywood-bob-1',
    'Old Hollywood Bob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/67f42193a210a5e6296f669e/master/w_1024%2Cc_limit/2192002664',
    '["glamour","womens-hair-trends","the-old-hollywood-bob"]'
  ),
  (
    'glamour-2026-old-hollywood-bob-2',
    'Old Hollywood Bob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/67f4215375c9cf9d702e56ed/master/w_1024%2Cc_limit/2192043650',
    '["glamour","womens-hair-trends","the-old-hollywood-bob"]'
  ),
  (
    'glamour-2026-tousled-deconstructed-bob',
    'Tousled Deconstructed Bob',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6320c04024702ad50e63446a/master/w_1024%2Cc_limit/1423360279',
    '["glamour","womens-hair-trends","the-tousled-deconstructed-bob"]'
  ),
  (
    'glamour-2026-french-girl-chic-1',
    'French Girl Chic 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/65f09de640bad812a149e802/master/w_1024%2Cc_limit/409544766_681039720828104_4508651960622031779_n.jpg',
    '["glamour","womens-hair-trends","the-french-girl-chic"]'
  ),
  (
    'glamour-2026-french-girl-chic-2',
    'French Girl Chic 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/65f0997a46a71a8819851a9f/master/w_1024%2Cc_limit/image002.png',
    '["glamour","womens-hair-trends","the-french-girl-chic"]'
  ),
  (
    'glamour-2026-90s-layers-1',
    '’90s Layers 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/62697fa510db2c9e782b1a1c/master/w_1024%2Cc_limit/GettyImages-1390214801.jpg',
    '["glamour","womens-hair-trends","the-90s-layers"]'
  ),
  (
    'glamour-2026-90s-layers-2',
    '’90s Layers 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/62698293e05c2a9a609d7de0/master/w_1024%2Cc_limit/90s%2520layers.png',
    '["glamour","womens-hair-trends","the-90s-layers"]'
  ),
  (
    'glamour-2026-medium-cut-1',
    'Medium Cut 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6269847fab55b24704f5ff8c/master/w_1024%2Cc_limit/275791920_1828373184030547_409140248994509763_n.jpg',
    '["glamour","womens-hair-trends","the-medium-cut"]'
  ),
  (
    'glamour-2026-medium-cut-2',
    'Medium Cut 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6269847dab55b24704f5ff8a/master/w_1024%2Cc_limit/medium%2520chop.png',
    '["glamour","womens-hair-trends","the-medium-cut"]'
  ),
  (
    'glamour-2026-blunt-bob-1',
    'Blunt Bob 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6269a060d864261c94efaf5e/master/w_1024%2Cc_limit/Blunt%2520bob%2520.png',
    '["glamour","womens-hair-trends","the-blunt-bob"]'
  ),
  (
    'glamour-2026-blunt-bob-2',
    'Blunt Bob 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/6269a161ab55b24704f5ff94/master/w_1024%2Cc_limit/Blunt%2520Bob.png',
    '["glamour","womens-hair-trends","the-blunt-bob"]'
  ),
  (
    'glamour-2026-easy-waves-1',
    'Easy Waves 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/600063132101686f67a35052/master/w_1024%2Cc_limit/75562928_412783622943416_4186436272927483425_n.jpg',
    '["glamour","womens-hair-trends","the-easy-waves"]'
  ),
  (
    'glamour-2026-easy-waves-2',
    'Easy Waves 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/600068cd2101686f67a3505a/master/w_1024%2Cc_limit/135788673_161193232079203_2750032830133143242_n.jpg',
    '["glamour","womens-hair-trends","the-easy-waves"]'
  ),
  (
    'glamour-2026-easy-waves-3',
    'Easy Waves 3',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c1785659865935c710d85f/master/w_1024%2Cc_limit/Screen%2520Shot%25202023-01-13%2520at%252010.27.05%2520AM.png',
    '["glamour","womens-hair-trends","the-easy-waves"]'
  ),
  (
    'glamour-2026-curtain-bangs-1',
    'Curtain Bangs 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0e32bc9f970c720ce36ec6/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25206.33.11%2520PM.png',
    '["glamour","womens-hair-trends","the-curtain-bangs"]'
  ),
  (
    'glamour-2026-curtain-bangs-2',
    'Curtain Bangs 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/626996390aca11e120fa967a/master/w_1024%2Cc_limit/Curtain%2520Bangs.png',
    '["glamour","womens-hair-trends","the-curtain-bangs"]'
  ),
  (
    'glamour-2026-chandelier-layers',
    'Chandelier Layers',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5e1ca1e067f09a00097de40d/master/w_1024%2Cc_limit/IMG_4365.jpeg',
    '["glamour","womens-hair-trends","the-chandelier-layers"]'
  ),
  (
    'glamour-2026-tight-crop-1',
    'Tight Crop 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f10700c11b1bf164f5b47af/master/w_1024%2Cc_limit/GettyImages-1182609810.jpg',
    '["glamour","womens-hair-trends","the-tight-crop"]'
  ),
  (
    'glamour-2026-tight-crop-2',
    'Tight Crop 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f10788116dbc58312c04c1c/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-16%2520at%252011.54.17%2520AM.png',
    '["glamour","womens-hair-trends","the-tight-crop"]'
  ),
  (
    'glamour-2026-asymmetrical-cut',
    'Asymmetrical Cut',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5bd13031549cdf2dc4269f0b/master/w_1024%2Cc_limit/Screen%2520Shot%25202018-10-24%2520at%252010.52.53%2520PM.png',
    '["glamour","womens-hair-trends","the-asymmetrical-cut"]'
  ),
  (
    'glamour-2026-invisible-layers-1',
    'Invisible Layers 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0f352a88fd7243bc9bcee1/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-15%2520at%252012.55.49%2520PM.png',
    '["glamour","womens-hair-trends","the-invisible-layers"]'
  ),
  (
    'glamour-2026-invisible-layers-2',
    'Invisible Layers 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0f352a92d5234d718ea14e/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-15%2520at%252012.55.36%2520PM.png',
    '["glamour","womens-hair-trends","the-invisible-layers"]'
  ),
  (
    'glamour-2026-textured-bob',
    'Textured Bob',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0dfee89f970c720ce36ea4/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25202.52.03%2520PM.png',
    '["glamour","womens-hair-trends","the-textured-bob"]'
  ),
  (
    'glamour-2026-blunt-bangs',
    'Blunt Bangs',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5c58c055a7afdd63a2240e1f/master/w_1024%2Cc_limit/Screen%2520Shot%25202019-02-04%2520at%252012.37.08%2520PM.png',
    '["glamour","womens-hair-trends","the-blunt-bangs"]'
  ),
  (
    'glamour-2026-90s-chop-1',
    '’90s Chop 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5e1cbcf35b81ea00089cd0dc/master/w_1024%2Cc_limit/image2.jpeg',
    '["glamour","womens-hair-trends","the-90s-chop"]'
  ),
  (
    'glamour-2026-90s-chop-2',
    '’90s Chop 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0dfadcad2bb587acf07070/master/w_1024%2Cc_limit/GettyImages-1200246964.jpg',
    '["glamour","womens-hair-trends","the-90s-chop"]'
  ),
  (
    'glamour-2026-curly-bangs',
    'Curly Bangs',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5ea8984ab56e0e00087cfdfa/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-04-28%2520at%25204.55.16%2520PM.png',
    '["glamour","womens-hair-trends","the-curly-bangs"]'
  ),
  (
    'glamour-2026-polished-bob',
    'Polished Bob',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5e1cacd7b710b200099e9f84/master/w_1024%2Cc_limit/FullSizeRender.jpeg',
    '["glamour","womens-hair-trends","the-polished-bob"]'
  ),
  (
    'glamour-2026-tapered-cut-1',
    'Tapered Cut 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5bd08d5b9a8a662e2f667a18/master/w_1024%2Cc_limit/popular-haircuts-memphis.png',
    '["glamour","womens-hair-trends","the-tapered-cut"]'
  ),
  (
    'glamour-2026-tapered-cut-2',
    'Tapered Cut 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0e1419474420a300d3c687/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25204.22.32%2520PM.png',
    '["glamour","womens-hair-trends","the-tapered-cut"]'
  ),
  (
    'glamour-2026-curly-layers-1',
    'Curly Layers 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5e4d88b40353510008e4fcbc/master/w_1024%2Cc_limit/Headshots%2520(Film)%2520(22%2520of%252040).jpg',
    '["glamour","womens-hair-trends","the-curly-layers"]'
  ),
  (
    'glamour-2026-curly-layers-2',
    'Curly Layers 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5f0e1c59f6b7bf0c9215cccc/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25204.56.14%2520PM.png',
    '["glamour","womens-hair-trends","the-curly-layers"]'
  ),
  (
    'glamour-2026-mermaid-shag-1',
    'Mermaid Shag 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5e1cc8085b81ea00089cd0e0/master/w_1024%2Cc_limit/IMG_4244.jpeg',
    '["glamour","womens-hair-trends","the-mermaid-shag"]'
  ),
  (
    'glamour-2026-mermaid-shag-2',
    'Mermaid Shag 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/5ea868c357294900080a22e0/master/w_1024%2Cc_limit/GettyImages-1145966603.jpg',
    '["glamour","womens-hair-trends","the-mermaid-shag"]'
  ),
  (
    'glamour-2026-face-framing-layers-1',
    'Face-Framing Layers 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c0894f9c19bc9b7aa11810/master/w_1024%2Cc_limit/IMG_B3E513095EC7-1.jpeg',
    '["glamour","womens-hair-trends","the-face-framing-layers"]'
  ),
  (
    'glamour-2026-face-framing-layers-2',
    'Face-Framing Layers 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c08cc6b16b47dae4198df3/master/w_1024%2Cc_limit/Hif3licia.jpg',
    '["glamour","womens-hair-trends","the-face-framing-layers"]'
  ),
  (
    'glamour-2026-face-framing-layers-3',
    'Face-Framing Layers 3',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c17beedc47839d1025a0e6/master/w_1024%2Cc_limit/Screen%2520Shot%25202023-01-13%2520at%252010.42.27%2520AM.png',
    '["glamour","womens-hair-trends","the-face-framing-layers"]'
  ),
  (
    'glamour-2026-razor-cut-hair-1',
    'Razor-Cut Hair 1',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c096466a1bbcc699a6fc24/master/w_1024%2Cc_limit/Screen%2520Shot%25202023-01-12%2520at%25206.22.24%2520PM.png',
    '["glamour","womens-hair-trends","the-razor-cut-hair"]'
  ),
  (
    'glamour-2026-razor-cut-hair-2',
    'Razor-Cut Hair 2',
    'Source: Glamour article Best Haircuts for Women 2026 (most popular haircuts).',
    'https://media.glamour.com/photos/63c0a5fda00d0099c69fa8a9/master/w_1024%2Cc_limit/Screen%2520Shot%25202023-01-12%2520at%25207.29.11%2520PM.png',
    '["glamour","womens-hair-trends","the-razor-cut-hair"]'
  );
