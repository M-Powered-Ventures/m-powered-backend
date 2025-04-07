'use strict';

/**
 * client-review service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::client-review.client-review');
