/**
 * Structured data builders (spec §44, §45).
 * Only Schema.org properties that reflect real, visible data.
 * No fabricated reviews/ratings — ever.
 */
import type { MenuReadModel } from "@/domains/menu-engine/read-model";

export function buildRestaurantJsonLd(model: MenuReadModel) {
  const b = model.business;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": pickEstablishmentType(b.businessType),
    name: b.name,
    ...(b.nameEn ? { alternateName: b.nameEn } : {}),
    url: `https://menu.foryxo.com/menus/${model.slug}/menu`,
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.address || b.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(b.address ? { streetAddress: b.address } : {}),
            ...(b.city ? { addressLocality: b.city } : {}),
            addressCountry: "IR",
          },
        }
      : {}),
    ...(b.latitude && b.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: b.latitude,
            longitude: b.longitude,
          },
        }
      : {}),
    ...(b.servesCuisine ? { servesCuisine: b.servesCuisine } : {}),
    ...(b.priceRange ? { priceRange: b.priceRange } : {}),
    ...(b.openingHours ? { openingHoursSpecification: b.openingHours } : {}),
    hasMenu: buildMenuJsonLd(model),
  };
  return data;
}

function pickEstablishmentType(businessType: string): string {
  switch (businessType) {
    case "cafe":
      return "CafeOrCoffeeShop";
    case "bakery":
      return "Bakery";
    case "fastfood":
      return "FastFoodRestaurant";
    case "foodhall":
      return "FoodCourt";
    default:
      return "Restaurant";
  }
}

export function buildMenuJsonLd(model: MenuReadModel) {
  return {
    "@type": "Menu",
    name: model.title,
    inLanguage: model.locales,
    hasMenuSection: model.categories.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      ...(c.nameEn ? { alternateName: c.nameEn } : {}),
      ...(c.description ? { description: c.description } : {}),
      hasMenuItem: c.products
        .filter((p) => !p.hidden)
        .map((p) => ({
          "@type": "MenuItem",
          name: p.name,
          ...(p.nameEn ? { alternateName: p.nameEn } : {}),
          ...(p.description ? { description: p.description } : {}),
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "IRT",
            ...(p.soldOut ? { availability: "https://schema.org/SoldOut" } : {}),
          },
          // suitableForDiet only when factual (spec §45)
          ...(p.dietary.includes("vegan")
            ? { suitableForDiet: "https://schema.org/VeganDiet" }
            : p.dietary.includes("vegetarian")
              ? { suitableForDiet: "https://schema.org/VegetarianDiet" }
              : {}),
          ...(p.nutrition
            ? {
                nutrition: {
                  "@type": "NutritionInformation",
                  calories: `${p.nutrition.kcal} kcal`,
                  proteinContent: `${p.nutrition.protein} g`,
                  carbohydrateContent: `${p.nutrition.carbs} g`,
                  fatContent: `${p.nutrition.fat} g`,
                },
              }
            : {}),
        })),
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQPage only where real Q&A content exists and is visible on-page (spec §44). */
export function buildFaqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Foryxo Menu",
    url: "https://menu.foryxo.com",
    logo: "https://menu.foryxo.com/icon.svg",
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Foryxo Menu",
    url: "https://menu.foryxo.com",
    inLanguage: ["fa", "en"],
  };
}
