# rafxarBot

<img width="300" height="150" align="left" style="float: left;" alt="rafxarBot" src="pirfil.png">rafxarBot is an open source Discord bot made with Javascript using [Discord.js](https://discord.js.org), [Mongoose](https://mongoosejs.com) and [Snoowrap](https://github.com/not-an-aardvark/snoowrap). Under constant development! Mostly made to learn javascript and also since I couldn't find discord bots that did what I wanted to do.

The bot currently only works in Spanish, since it's my mother language. If the use case occurs then I would translate it.

# Commands

All commands work with the prefix "**>**" and there are two types of commands: **Course-related** and **Subreddits-related**.

### General Commands

- **help | ayuda:** To get bot help information.

- **comandos:** To get a list of available commands.

### Course-Related

- **inscribirme:** To be able to enroll in a course (this means you get the role of said course so that you can receiv reminders).
- **nuevo curso:** To create a course that reminders will be sent of.
- **fijar canal:** To set the channel reminders will be sent to.

### Subreddit-related

- **que sr:** List all subreddits the server receives posts of .

- **nuevo sr:** Adds a subreddit to the list the current server is sent new posts of.

- **fijar sr:** To set the channel new posts from subreddits are sent to.

- **borrar sr:** To delete a subreddit from the list the server currently receives new posts from.

# Contributions / Usage

## Contributions

Simply do a pull request, I've never managed a project and if you're interested in the project I'll be glad.

## You'll need

A discord bot key, a mongodb database and a reddit api key if you want to test full functionality.

- Discord bot key to even start the bot which you can get [here](https://discord.com/developers/docs/intro).

- mongodb to save reminders, channel that reminders will be sent, subreddit notifications and channel that these notifications will be sent to, you can install it [here](https://docs.mongodb.com/manual/installation/) or you can host it using a service like [atlas](https://www.mongodb.com/cloud/atlas?tck=docs_server).

- Reddit api key to simply scrap last post from the selected subreddit, since it uses snoowrap, there's aditional steps to follow [here](https://browntreelabs.com/scraping-reddits-api-with-snoowrap/).

## Usage

This project runs on **nodejs** and these are the following steps to run it:

- First clone the repository
  
  ```bash
  git clone git@github.com:rafaelcanoguitton/rafxarBOT.git
  ```

- Then issue an **npm install** command
  
  ```bash
  npm install
  ```

- You will need to rename [**example.env**](example.env) to **.env** and change variables as described on the file.
  
  ```env
  discordKey=YOURKEYHERE
  mongoPath=YOURMONGOPATHHERE
  userAgent=YOURUSERAGENTHERE
  clientId=YOURCLIENTIDHERE
  clientSecret=YOURCLIENTSECRETHERE
  refreshToken=YOURREFRESHTOKENHERE
  ```

- Finally, when everything is properly set up simply do an npm run or node index.js.
  
  ```bash
  npm run
  node index.js
  ```

# Tasks/ To-do

- Add delete command for courses.
- Validation and error handling for commands, I haven't really implemented those. At least I need to describe them oh god.

# License

There isn't any... I don't even know how that works... yet.
