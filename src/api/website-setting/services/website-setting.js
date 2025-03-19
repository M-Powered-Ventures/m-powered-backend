'use strict';

/**
 * website-setting service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::website-setting.website-setting');
