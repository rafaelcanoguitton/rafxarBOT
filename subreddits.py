from discord.ext import commands
from models import subreddits, canalSr


class Subreddit(commands.Cog):
    def __init__(self, client):
        self.client = client

    @commands.command(name='fijarCanalSr', aliases=['fijar_sr'])
    async def fijar_sr(self, ctx):
        canalSr.update_one(
            {"_id_sv": ctx.message.guild.id},
            {"$set": {"_id_sv": ctx.message.guild.id,
                      "_id_canal": ctx.message.channel.id}},
            upsert=True
        )
        await ctx.send('Okay, ¡Aquí enviaré los nuevos posts de ahora en adelante! en ' + ctx.message.channel.name)

    @commands.command(name='nuevoSubreddit', aliases=['nuevo'])
    async def nuevo_sr(self, ctx, sr=None):
        if sr != "sr":
            return
        author = ctx.message.author
        if canalSr.count_documents({"_id_sv": ctx.message.guild.id}) == 0:
            await ctx.send("Por favor, primero fija un canal para mandar los nuevos posts." +
                           "\n" +
                           "Puedes hacerlo con el comando:" +
                           "\n" +
                           "**>fijar sr**")
        else:
            # reply to message and wait response with the same author
            await ctx.send("¿Qué subreddit quieres que se envíe?")
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            subreddit = msg.content
            subreddits.update_one({"_id_sub": subreddit}, {"$push": {"_id_sv": ctx.message.guild.id}}, upsert=True)

    @commands.command(name='borrarSubreddit', aliases=['borrar sr'])
    async def borrar_sr(self, ctx):
        author = ctx.message.author
        allsr = subreddits.find({"_id_sv": ctx.message.guild.id})
        if allsr.count() == 0:
            await ctx.send("Aún no tiene ningún subreddit, puede agregar uno con el comando:\n\n" +
                           "**>nuevo sr**")
        else:
            mensaje = "Seleccione el subreddit que desea eliminar:\n\n"
            for index, sr in enumerate(allsr):
                mensaje += str(index) + " : **r/" + sr["_id_sub"] + "**\n"
            await ctx.send(mensaje)
            msg = await self.client.wait_for('message', check=lambda message: message.author == author)
            subreddit = msg.content
            subreddits.update_one({"_id_sub": subreddit}, {"$pull": {"_id_sv": ctx.message.guild.id}})
            await ctx.reply("Subreddit eliminado")

    @commands.command(name='queSubreddits', aliases=['que sr'])
    async def que_sr(self, ctx):
        curr_sv_sr = subreddits.find({"_id_sv": ctx.message.guild.id})
        if curr_sv_sr.count() == 0:
            await ctx.send("Aún no tiene ningún subreddit, puede agregar uno con el comando:\n\n" +
                           "**>nuevo sr**")
        else:
            mensaje = "Se recibe nuevos posts para los siguientes subreddits:\n\n"
            for sr in curr_sv_sr:
                mensaje += "**r/" + sr["_id_sub"] + "**\n"
            await ctx.send(mensaje)
