module.exports = {
  async getCombinedData(ctx) {
    let originalUrl = ctx.request.url;
    var slug = originalUrl.match(/slug=([^&]*)/);
    if (slug) {
      slug = slug[1];
    }
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
              seo: true,
              // publishedAt: true,
            };

            filters = {
              is_published: true, // filter for published blogs
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
            filters: filters,
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
      if (slug == "slug=home" || slug == "home") {
        console.log("Filtering insights for home page...");
        data = {
          ...data,
          insight: data.insight.filter((item) => item.is_show_on_home),
          all_insights: data.insight,
          faq: data.faq.filter((item) => item.use_for == "home"),
        };
      } else if (slug == "slug=pricing") {
        console.log("Filtering insights for about page...");
        data = {
          ...data,
          all_insights: data.insight,
          faq: data.faq.filter((item) => item.use_for == "pricing"),
        };
      } else if (slug == "slug=services" || slug == "services") {
        console.log("Filtering insights for success story page...");
        data = {
          ...data,
          all_insights: data.insight,
          faq: data.faq.filter((item) => item.use_for == "services"),
        };
      } else if (slug == "slug=contact" || slug == "contact") {
        console.log("Filtering insights for about page...");
        data = {
          ...data,
          all_insights: data.insight,
          faq: data.faq.filter((item) => item.use_for == "contact"),
        };
      }

      data.all_insights = data?.all_insights?.map((item) => {
        return {
          ...item,
          meta_title: item.seo ? item.seo.metaTitle : item.meta_title,
          meta_description: item.seo
            ? item.seo.metaDescription
            : item.meta_description,
        };
      });

      data.insight = data?.insight?.map((item) => {
        return {
          ...item,
          meta_title: item.seo ? item.seo.metaTitle : item.meta_title,
          meta_description: item.seo
            ? item.seo.metaDescription
            : item.meta_description,
          meta_keyword: item.seo ? item.seo.metaKeyword : item.meta_keyword,
          slug: item.title_slug,
        };
      });

      ctx.body = data;
      ctx.status = 200;
      ctx.set("Cache-Control", "no-store");
    } catch (error) {
      console.error("Main Error:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },
  async getDetailBlog(ctx) {
    const { _id } = ctx.params;
    let type = ctx.query.type ?? "insight";
    let contentTypes = "api::insight.insight";

    let populate = {
      author: {
        populate: "*",
      },
      image: true,
    };
    if (type === "insight") {
      contentTypes = "api::insight.insight";
      populate = { ...populate, blog_category: true, seo: true };
    } else {
      contentTypes = "api::success-story.success-story";
    }
    try {
      let blog = {};

      if (contentTypes == "api::insight.insight") {
        let blogs = await strapi.entityService.findMany(contentTypes, {
          filters: {
            title_slug: _id,
            is_published: true, // filter for published blogs
          },
          populate,
        });
        if (blogs && blogs.length > 0) {
          blog = blogs[0];
        }
      } else {
        blog = await strapi.entityService.findOne(contentTypes, _id, {
          populate,
        });
      }

      if (!blog || Object.keys(blog).length === 0) {
        ctx.status = 404;
        ctx.body = { error: "Blog not found" };
        return;
      }
      let other_liked_blogs = [];
      let other_blogs = [];
      let author_other_blogs = [];
      let category = blog.blog_category || null;
      if (!!category) {
        other_liked_blogs = await strapi.entityService.findMany(contentTypes, {
          filters: {
            blog_category: {
              id: category.id,
            },
            id: {
              $ne: blog.id,
            },
            is_published: true, // filter for published blogs
          },
          populate,
          limit: 3,
          sort: { createdAt: "desc" },
        });
        other_blogs = await strapi.entityService.findMany(contentTypes, {
          filters: {
            blog_category: {
              id: {
                $ne: category.id,
              },
            },

            is_published: true, // filter for published blogs
          },
          populate,
          sort: { createdAt: "desc" },
        });
      }
      let author = blog.author || null;
      if (!!author) {
        author_other_blogs = await strapi.entityService.findMany(contentTypes, {
          filters: {
            author: {
              id: author.id,
            },
            id: {
              $ne: blog.id,
            },
            is_published: true, // filter for published blogs
          },
          populate,
          limit: 3,
          sort: { createdAt: "desc" },
        });
      }

      if (!!blog.seo) {
        blog.meta_title = blog.seo.metaTitle ?? blog?.meta_title;
        blog.meta_description =
          blog.seo.metaDescription ?? blog?.meta_description;
      }

      blog.slug = blog.title_slug;

      ctx.body = blog;
      ctx.body.other_blogs = other_blogs.map((blog) => {
        return {
          ...blog,
          meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
          meta_description: blog.seo
            ? blog.seo.metaDescription
            : blog.meta_description,
          meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
          slug: blog.title_slug ?? "",
        };
      });

      ctx.body.other_liked_blogs = other_liked_blogs.map((blog) => {
        return {
          ...blog,
          meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
          meta_description: blog.seo
            ? blog.seo.metaDescription
            : blog.meta_description,
          meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
          slug: blog.title_slug ?? "",
        };
      });

      ctx.body.author_other_blogs = author_other_blogs.map((blog) => {
        return {
          ...blog,
          meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
          meta_description: blog.seo
            ? blog.seo.metaDescription
            : blog.meta_description,
          meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
          slug: blog.title_slug ?? "",
        };
      });
    } catch (error) {
      console.error("Main Error:", error);
      ctx.body = { error: "Something went wrong >>>>", details: error };
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
      let [blogs, total, other_blogs, latest_blogs, blog_categorys] =
        await Promise.all([
          strapi.entityService.findMany("api::insight.insight", {
            filters: {
              blog_category: {
                id: category,
              },
              is_published: true, // filter for published blogs
            },
            populate: {
              author: {
                populate: "*",
              },
              blog_category: true,
              image: true,
              seo: true,
            },
            start: Number(skip),
            limit: Number(limit),
          }),
          strapi.entityService.count("api::insight.insight", {
            filters: {
              blog_category: {
                id: category,
              },
              is_published: true, // filter for published blogs
            },
          }),
          strapi.entityService.findMany("api::insight.insight", {
            filters: {
              blog_category: {
                id: {
                  $ne: category,
                },
              },
              is_published: true, // filter for published blogs
            },
            populate: {
              author: { populate: "*" },
              blog_category: true,
              image: true,
              seo: true,
            },
          }),
          strapi.entityService.findMany("api::insight.insight", {
            sort: { createdAt: "desc" },
            limit: 3,
            populate: {
              author: { populate: "*" },
              blog_category: true,
              image: true,
              seo: true,
            },
            filters: {
              is_published: true, // filter for published blogs
            },
          }),
          strapi.entityService.findMany("api::blog-category.blog-category", {
            sort: { createdAt: "desc" },
            populate: "*",
          }),
        ]);
      let loadMoreUrl = `api/fetch_category_insights/${category}?page=${page}&limit=${limit}`;
      let total_pages = Math.ceil(total / limit);
      if (page >= total_pages) {
        loadMoreUrl = "";
      }
      ctx.body = {
        blogs: blogs.map((blog) => {
          return {
            ...blog,
            meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
            meta_description: blog.seo
              ? blog.seo.metaDescription
              : blog.meta_description,
            meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
            slug: blog.title_slug ?? "",
          };
        }),

        total,
        total_pages,
        loadMoreUrl,
        other_blogs: other_blogs.map((blog) => {
          return {
            ...blog,
            meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
            meta_description: blog.seo
              ? blog.seo.metaDescription
              : blog.meta_description,
            meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
            slug: blog.title_slug ?? "",
          };
        }),

        latest_blogs: latest_blogs.map((blog) => {
          return {
            ...blog,
            meta_title: blog.seo ? blog.seo.metaTitle : blog.meta_title,
            meta_description: blog.seo
              ? blog.seo.metaDescription
              : blog.meta_description,
            meta_keyword: blog.seo ? blog.seo.metaKeyword : blog.meta_keywords,
            slug: blog.title_slug ?? "",
          };
        }),

        blog_categorys,
      };
    } catch (error) {
      console.error("Error fetching blogs by category:", error);
      ctx.body = { error: "Something went wrong", details: error };
      ctx.status = 500;
    }
  },

  async addContact(ctx) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Token token=1Qj7_cK_ZA9Ie6Z6pwmWFA");
    myHeaders.append("Content-Type", "application/json");
    let url =
      "https://mpoweredventures.myfreshworks.com/crm/sales/api/contacts";
    console.log("URL:", url);
    console.log("Request Body:", ctx.request.body);

    const raw = JSON.stringify({
      contact: {
        ...ctx.request.body,
      },
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(url, requestOptions);
      console.log("Response Status:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Response Data:", result);
      if (result.error) {
        ctx.body = { error: result.error };
        ctx.status = 400;
        return;
      }

      ctx.status = 200;
    } catch (error) {
      console.error("Error adding contact:", error);
      ctx.body = { error: "Something went wrong", details: error.message };
      ctx.status = 500;
    }
  },
};
