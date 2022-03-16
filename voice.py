from discord.ext import commands

class Voice(commands.Cog):
    def __init__(self,client):
        self.client = client

    @commands.command(name='join')
    async def join(self, ctx):
        channel = None
        if ctx.author.voice and ctx.author.voice.channel:
            channel = ctx.author.voice.channel
        else:
            await ctx.send("You are not connected to a voice channel")
            return
        await ctx.send("Joining channel")
        await channel.connect()
    @commands.command(name='say')
    async def say(self, ctx, *, message):
        if ctx.message.author.voice and ctx.message.author.voice.channel:
            print(message)
            await ctx.send(message, tts=True)
        else:
            await ctx.send("You are not connected to a voice channel")
        