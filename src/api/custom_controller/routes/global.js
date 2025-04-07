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
  ],
};
