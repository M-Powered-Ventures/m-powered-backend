module.exports = {
  async getCombinedData(ctx) {
    console.log("Fetching combined data...", ctx);

    let originalUrl = ctx.request.url;

    let slug = originalUrl.split("?").pop();
    console.log("Slug:", slug);

    try {
      let contentTypes = Object.keys(strapi.contentTypes).filter((type) =>
        type.startsWith("api::")
      );

      if (slug && slug !== "home") {
        contentTypes.push(
          "api::project.project",
          "api::website-setting.website-setting"
        );
      }

      const data = {};
      for (const type of contentTypes) {
        console.log("Type:", type);

        const collectionName = type.split("::")[1].split(".")[0];
        console.log("Collection Name:", collectionName);

        try {
          // populate the data for each collection

          data[collectionName] = await strapi.entityService.findMany(type, {
            populate: "*", // specify the fields to populate
          });

          // replace - in the name with _ in the  collection name
          const formattedCollectionName = collectionName.replace(/-/g, "_");
          // replace - in the name with _ in the  collection name
          data[formattedCollectionName] = data[collectionName];
        } catch (fetchError) {
          data[collectionName] = { error: `Failed to fetch ${collectionName}` };
        }
      }

      // delete the original collection with - in the name
      for (const collectionName of Object.keys(data)) {
        if (collectionName.includes("-")) {
          delete data[collectionName];
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
