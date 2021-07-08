require("dotenv").config();
var snoowrap = require("snoowrap");
async function scrapeSubreddit(strsubreddit) {
  const r = new snoowrap({
    userAgent: process.env.userAgent,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    refreshToken: process.env.refreshToken,
  });
  r.config({ debug: true });
  const awa = await r.getSubreddit(strsubreddit);
  const post = await awa.getNew({ limit: 1 });
//   let data = [];
//   topPosts.forEach((post) => {
//     data.push({
//       link: post.url,
//       text: post.title,
//       score: post.score,
//     });
//   });
  return post;
}
module.exports = { scrapeSubreddit };