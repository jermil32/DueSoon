import { InventoryItem } from '../types';

export function getAmazonUrl(item: InventoryItem): string {
  if (item.amazonUrl) {
    return item.amazonUrl;
  }
  // Build a search URL from the item name and brand
  const query = [item.brand, item.name, item.partNumber].filter(Boolean).join(' ');
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=plantwell01-20`;
}
