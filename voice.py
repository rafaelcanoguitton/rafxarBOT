from discord.ext import commands
import pyttsx3
class Voice(commands.Cog):
    def __init__(self,client):
        self.client = client
        self.engine = pyttsx3.init()
        voices = self.engine.getProperty('voices')
        for voice in voices:
            if voice.languages[0].startswith('es'):
                print(voice.id)
                print(voice.languages)
                print(voice.name)
    @commands.command(name='join')
    async def join(self, ctx):
        channel = None
        if ctx.author.voice and ctx.author.voice.channel:
            channel = ctx.author.voice.channel
        else:
            await ctx.send("Primero únete a un canal de voz.")
            return
        await channel.connect()
    @commands.command(name='say')
    async def say(self, ctx, *, message):
        if ctx.message.author.voice and ctx.message.author.voice.channel:
            print(message)
            self.engine.say(message)
        else:
            await ctx.send("Primero únete a un canal de voz.")
        