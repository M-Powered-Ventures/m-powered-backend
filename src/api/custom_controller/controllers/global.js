module.exports = {
  async getCombinedData(ctx) {
    try {
      const contentTypes = Object.keys(strapi.contentTypes).filter((type) =>
        type.startsWith("api::")
      );
      const data = {};
      for (const type of contentTypes) {
        const collectionName = type.split("::")[1].split(".")[0];
        try {
          data[collectionName] = await strapi.entityService.findMany(type);
        } catch (fetchError) {
          data[collectionName] = { error: `Failed to fetch ${collectionName}` };
        }
      }
      ctx.body = data;
    } catch (error) {
      console.error("Main Error:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },
};
