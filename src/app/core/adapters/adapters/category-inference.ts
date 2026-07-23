const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/iphone|android|phone|macbook|laptop|tablet|imac|screen|desktop|monitor|smartwatch|smartphone|mobile|device|handheld|cell|notebook|mac|ipad|watch|wearable/, 'devices'],
  [/shirt|tshirt|t.?shirt|hoodie|apparel|clothing|jacket|sweater|sweatshirt|hat|cap|fashion|garment|wear|cotton|fabric|knit|fleece|raglan|crewneck|polo|vest|jersey|uniform|sportswear|apron|sock/, 'apparel'],
  [/box|bottle|package|label|cups?|can|container|jar|pack|packet|wrap|sleeve|tube|pouch|carton|crate|basket/, 'packaging'],
  [/card|logo|brand|stationery|letterhead|business|identity|corporate|paper|document|folder|presentation|portfolio|envelope|notebook/, 'branding'],
  [/poster|book|magazine|flyer|brochure|print|catalog|catalogue|pamphlet|leaflet|booklet|ticket|invitation|newspaper|menu|certificate|calendar/, 'print'],
  [/billboard|sign|banner|outdoor|building|street|kiosk|bus|transit|advertising|exhibition|display\s+stand|pop.?up|storefront|flag/, 'outdoor'],
  [/mug|desk|office|frame|wall|home|decor|candle|vase|towel|rug|cushion|blanket|throw|plate|bowl|tray|organizer|pillow|mouse.?pad|canvas/, 'home-office'],
  [/app|web|ui|ux|screenshot|digital|browser|website|landing|software|interface|responsive|social.?media|instagram|dashboard/, 'digital'],
  [/sticker|tote|bag|case|merchandise|gift|promotional|promo|souvenir|novelty|key.?chain|badge|pin|patch|phone.?case|usb|pen/, 'merchandise'],
  [/water.?bottle|drink|coffee|tea|beer|wine|juice/, 'packaging'],
];

export function inferCategory(tags: string[], family: string): string {
  const all = [...tags, family.toLowerCase()].join(' ');

  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(all)) return category;
  }

  return family === 'digital' ? 'digital' : 'devices';
}
