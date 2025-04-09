module.exports = {
  routes: [
    {
      method: "GET",
      path: "/combined-data",
      handler: "global.getCombinedData",
      config: {
        auth: false,
      },

      // add query parameters

      query: {
        populate: {
          type: "string",
          default: "*",
        },
      },

      description: "Fetch combined data from all collections",
      tags: ["api::global.global"],
      // Define the response schema
      response: {
        200: {
          description: "Combined data from all collections",
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                  details: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  ],
};
