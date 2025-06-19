const slugify = require("slugify");

module.exports = {
  async beforeCreate(event) {
    await generateUniqueSlug(event);
  },
  async beforeUpdate(event) {
    // Only regenerate the slug if the title is being updated
    if (event.params.data.title) {
      await generateUniqueSlug(event);
    }
  },
};

async function generateUniqueSlug(event) {
  // Ensure the title exists in the data
  if (event.params.data.title) {
    let baseSlug = slugify(event.params.data.title, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs in the database
    const existingEntries = await strapi.entityService.findMany(
      "api::insight.insight",
      {
        filters: { slug: { $startsWith: baseSlug } },
        fields: ["slug"],
      }
    );

    // If a duplicate slug exists, append a counter to make it unique
    while (existingEntries.some((entry) => entry.slug === slug)) {
      slug = `${baseSlug}-${String(counter).padStart(2, "0")}`;
      counter++;
    }

    // Assign the unique slug to the data being created or updated
    event.params.data.slug = slug;
  } else {
    console.warn("Title is missing. Slug cannot be generated.");
  }
}
