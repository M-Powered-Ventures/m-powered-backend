module.exports = {
  routes: [
    {
      method: "GET",
      path: "/combined-data",
      handler: "global.getCombinedData",
      config: {
        auth: false,
      },

      // Define the parameters for the endpoint
    },
  ],
};
