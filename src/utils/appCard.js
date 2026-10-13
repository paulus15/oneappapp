import { safeColor } from '@/utils/cover'

// Normalises an API application into what cards display, without inventing values.
export function toCard(app) {
  const category = typeof app.category === 'object' ? app.category : null
  const reviews = Number(app.reviews_count || 0)
  return {
    id: app.id,
    name: app.name,
    to: `/apps/${app.id}`,
    category:
      category?.name || (typeof app.category === 'string' ? app.category : ''),
    categorySlug: category?.slug || '',
    // Inserted into a style attribute: only a plain hex colour is accepted.
    color: safeColor(category?.color) || 'var(--pwa-primary)',
    icon: category?.icon || 'widgets',
    iconUrl: app.icon_url || '',
    cover: app.cover && typeof app.cover === 'object' ? app.cover : null,
    shortDescription: app.short_description || '',
    sourceType: app.source_type || 'build',
    publisher:
      app.publisher?.public_name ||
      app.developer?.developer_profile?.public_name ||
      '',
    price: Number(app.price || 0),
    activations: Number(app.activations_count || 0),
    downloads: Number(app.downloads_count || 0),
    reviews,
    // No reviews means no rating, never a default score.
    rating: reviews ? Number(app.average_rating || 0).toFixed(1) : null,
    // Only the rankings endpoint sends a rank.
    rank: Number(app.rank) > 0 ? Number(app.rank) : null
  }
}
