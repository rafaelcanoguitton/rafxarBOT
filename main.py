import os
from discord.ext import commands
import asyncio
import datetime
from models import subreddits, canalSr, cursos, canalFijado
import asyncpraw as praw
from dotenv import load_dotenv
#loading cog files
from courses import Cursos
from mixed import Mixed
from subreddits import Subreddit
from voice import Voice
import discord
load_dotenv()
reddit_instance = praw.Reddit(client_id=os.getenv("clientId"),
                                client_secret=os.getenv("clientSecret"),
                                user_agent=os.getenv("userAgent"),)
intents = discord.Intents.all()

bot = commands.Bot(command_prefix=">",intents=intents)
@bot.command()
async def ping(ctx):
    await ctx.send("pong")

# Defining background tasks


async def flujo_principal():
    while(True):
        day = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-5))).weekday()
        if day == 6:
            day = 0
        else:
            day += 1
        coursesForTheDay = cursos.find({
            "dia": day,
            "hora": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-5))).strftime("%H"),
            "minuto": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-5))).strftime("%M")
        })
        for course in coursesForTheDay:
            canalid = canalFijado.find_one({"_id_sv": course["server"]})["_id_canal"]
            canal = bot.get_channel(int(canalid))
            canal.send("Gente de " + course["rol"] + " tienen clases!.")
            canal.send("Su enlace es el siguiente: " + course["enlace"])
        #execute every 5 minutes
        await asyncio.sleep(300)

async def sub_queries():
    lastPosts = {}
    while True:
        subrds = subreddits.find()
        for sub in subrds:
            subreddit = await reddit_instance.subreddit(sub["_id_sub"])
            lastpost = subreddit.new(limit=1)
            if lastPosts.get(sub["_id_sub"]) is None or lastPosts[sub["_id_sub"]] != lastpost[0].id:
                lastpost= None
                async for post in subreddit.new(limit=1):
                    lastpost = post
                for svid in sub["_id_sv"]:
                    canalfromDb = canalSr.find_one({"_id_sv": svid})
                    print(f'id del canal: {canalfromDb["_id_canal"]}')
                    canalid = canalfromDb["_id_canal"]
                    canal = bot.get_channel(int(canalid))
                    print(f'canal: {canal}')
                    await canal.send("¡Hay un nuevo post en **r/" + sub["_id_sub"] + "**!\n" + lastpost.url)
        await asyncio.sleep(600)



#adding cogs
bot.add_cog(Cursos(bot))
bot.add_cog(Mixed(bot))
bot.add_cog(Subreddit(bot))
bot.add_cog(Voice(bot))
@bot.event
async def on_ready():
    print("Bot is ready")
    bot.loop.create_task(sub_queries())
    bot.loop.create_task(flujo_principal())
    activity = discord.Activity(name=f'on {len(bot.guilds)} servers! | >help | rafxarBot!', type=discord.ActivityType.playing)
    await bot.change_presence(status=discord.Status.idle, activity=activity)
bot.run(os.getenv("discordKey"))