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
  ],
};
