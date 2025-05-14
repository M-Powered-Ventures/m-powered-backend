module.exports = {
  async getCombinedData(ctx) {
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
          let filters = {};
          let populate = "*";
          console.log("Collection Name:", collectionName);
          if (collectionName === "blog" || collectionName === "insight") {
            populate = {
              author: {
                populate: "*", // populate all fields of author
              },
              blog_category: true, // add other relations if needed
              image: true,
            };
          } else if (collectionName === "success-story") {
            populate = {
              author: {
                populate: "*",
              },
              createdBy: true,
              image: true,
              updatedBy: true,
            };
          }
          data[collectionName] = await strapi.entityService.findMany(type, {
            filters,
            populate,
          });
          const formattedCollectionName = collectionName.replace(/-/g, "_");
          data[formattedCollectionName] = data[collectionName];
        } catch (fetchError) {
          data[collectionName] = { error: `Failed to fetch ${collectionName}` };
        }
      }
      for (const collectionName of Object.keys(data)) {
        if (collectionName.includes("-")) {
          delete data[collectionName];
        }
      }
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
  async getDetailBlog(ctx) {
    const { _id } = ctx.params;
    try {
      const blog = await strapi.entityService.findOne("api::blog.blog", _id, {
        populate: {
          author: {
            populate: "*",
          },
          blog_category: true,
          image: true,
        },
      });
      ctx.body = blog;
    } catch (error) {
      console.error("Main Error:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },
  async getBlogsByCategory(ctx) {
    let page = ctx.query.page;
    let limit = parseInt(ctx.query.limit);
    let category = ctx.params.category_id;
    if (!ctx.query.page) {
      limit = 5;
    }
    if (page) {
      page = parseInt(page) + 1;
      if (isNaN(page)) {
        page = 1;
      }
    } else {
      page = 1;
    }
    let skip = (page - 1) * limit;
    try {
      let [blogs, total, other_blogs, latest_blogs] = await Promise.all([
        strapi.entityService.findMany("api::insight.insight", {
          filters: {
            blog_category: {
              id: category,
            },
          },
          populate: {
            author: {
              populate: "*",
            },
            blog_category: true,
            image: true,
          },
          start: Number(skip),
          limit: Number(limit),
        }),
        strapi.entityService.count("api::insight.insight", {
          filters: {
            blog_category: {
              id: category,
            },
          },
        }),
        strapi.entityService.findMany("api::insight.insight", {
          filters: {
            blog_category: {
              id: {
                $ne: category,
              },
            },
          },
          populate: {
            author: { populate: "*" },
            blog_category: true,
            image: true,
          },
        }),
        strapi.entityService.findMany("api::insight.insight", {
          sort: { createdAt: "desc" },
          limit: 3,
          populate: {
            author: { populate: "*" },
            blog_category: true,
            image: true,
          },
        }),
      ]);
      let loadMoreUrl = `api/fetch_category_insights/${category}?page=${page}&limit=${limit}`;
      let total_pages = Math.ceil(total / limit);
      if (page >= total_pages) {
        loadMoreUrl = "";
      }
      ctx.body = {
        blogs,
        total,
        total_pages,
        loadMoreUrl,
        other_blogs,
        latest_blogs,
      };
    } catch (error) {
      console.error("Error fetching blogs by category:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },
};
