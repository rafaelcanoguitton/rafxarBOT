require("dotenv").config();
var snoowrap = require("snoowrap");
async function scrapeSubreddit(strsubreddit) {
  const r = new snoowrap({
    userAgent: process.env.userAgent,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken,
  });
  const awa = await r.getSubreddit(strsubreddit);
  const post = await awa.getNew({ limit: 1 });
  return post;
}
module.exports = { scrapeSubreddit };