module.exports = {
  async getCombinedData(ctx) {
    console.log("Fetching combined data...", ctx);

    let originalUrl = ctx.request.url;
    var slug = originalUrl.split("?").pop();
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

      let data = {};
      for (const type of contentTypes) {
        const collectionName = type.split("::")[1].split(".")[0];

        try {
          // populate the data for each collection

          let filters = {};

          // if (collectionName == "insight" && slug == "home") {
          //   filters = {
          //     is_show_on_home: {
          //       $eq: true,
          //     },
          //   };
          // } else {
          //   filters = {
          //     is_show_on_home: {
          //       $eq: false,
          //     },
          //   };
          // }

          console.log("Filters:", filters);
          data[collectionName] = await strapi.entityService.findMany(type, {
            filters,
            populate: "*",
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

      // if slug is home then i=in insight filter only is_show_on_home = true else false

      if (slug == "slug=home") {
        console.log("Filtering insights for home page...");
        data = {
          ...data,
          insight: data.insight.filter((item) => item.is_show_on_home),
          faq: data.faq.filter((item) => item.use_for === "home"),
        };
      }

      ctx.body = data;
    } catch (error) {
      console.error("Main Error:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },
};
