module.exports = {
  routes: [
    {
      method: "GET",
      path: "/combined-data",
      handler: "global.getCombinedData",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/detail_blog/:_id",
      handler: "global.getDetailBlog",
      config: {
        auth: false,
      },
    },
    {
      method: "GET",
      path: "/fetch_category_insights/:category_id",
      handler: "global.getBlogsByCategory",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/add_contact",
      handler: "global.addContact",
      config: {
        auth: false,
      },
    },
  ],
};
