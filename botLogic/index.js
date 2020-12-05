import mongoose from 'mongoose';
import packageInfo from '../package.json'
import express from 'express'
import dotenv from 'dotenv';
dotenv.config();
import userSchema from '../userLogic/userdatabase.js';
import Pokedex from 'pokedex-promise-v2';
const P = new Pokedex();
import session from 'telegraf/session.js';
import Stage from 'telegraf/stage.js';
import Scene from 'telegraf/scenes/base.js';
const { enter, leave } = Stage;
import Composer from 'micro-bot';

let currentDate;

const pokeScene = new Scene('pokemon');
pokeScene.enter((ctx) => ctx.reply('Enter pokémon name:'));
pokeScene.leave((ctx) => ctx.reply('Going back home'));
pokeScene.command('back', leave());
pokeScene.on('text', ctx => {
  let requestedPokemon = (ctx.message.text).toLowerCase();
  let evRes;
  P.getPokemonByName(`${requestedPokemon}`.toLowerCase())
    .then(async function (response) {
      let pokeName = capitalizeFirstLetter(response.species.name);
      await ctx.replyWithPhoto(response.sprites.front_default);
      await ctx.reply(pokeName + '\n' + 'Pokédex number: ' + ' ' + '#' + response.id + '\n' + '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' + '\n' +
        'Abilities:' + '\n' + '\n' + response.abilities.map((ability) => {
          let pokeAbility = (dashChecker(capitalizeFirstLetter(afterUnderscoreCapitalizer(ability.ability.name))));
          return ((underscoreToSpace(pokeAbility)) +
            '\n' + `https://bulbapedia.bulbagarden.net/wiki/${pokeAbility}`);
        }).join('\n') + '\n' + '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' +
        '\n' + 'Base experience:' + ' ' + response.base_experience +
        '\n' + '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' +
        '\n' + 'Height:' + ' ' + (response.height / 10).toFixed(1) + 'm'
        + '\n' + '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' + '\n' +
        'Weight:' + ' ' + (response.weight / 10).toFixed(1) + 'kg'
        + '\n' + '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯' + '\n' +
        'Base stats:' + '\n' +
        response.stats.map((stat) => {
          let stats = capitalizeFirstLetter(afterDashCapitalizer(dashToSpace(stat.stat.name)));
          return ((`${stats}` + ':' + ' ' + `${stat.base_stat}`));
        }).join('\n'));
      P.getPokemonSpeciesByName(`${requestedPokemon}`.toLowerCase())
        .then(async function (anotherResponse) {
          evRes = anotherResponse.order;
          let evolvedPokemon = anotherResponse.evolves_from_species.name;
          await ctx.replyWithMarkdown('Evolves from' + ' ' + `[${capitalizeFirstLetter(evolvedPokemon)}](https://bulbapedia.bulbagarden.net/wiki/${evolvedPokemon}`);
          P.getEvolutionChainById(2)
            .then(function (thirdResponse) {
            })
            .catch(function (error) {
              console.log('There was an ERROR: ', error);
              ctx.reply("Doesn't evolve from anything!");
            });
        });
    })
    .catch(function (error) {
      console.log('There was an ERROR: ', error);
      ctx.reply('No such pokemon!');
    });
});

const bot = new Composer(process.env.BOT_TOKEN);
const stage = new Stage([pokeScene], { ttl: 10 });
bot.use(session());
bot.use(stage.middleware());
bot.command('pokemon', (ctx) => ctx.scene.enter('pokemon'));

bot.start((ctx) => ctx.reply("You can enter Pokémon's name and get its info."));

bot.command('reg', async (ctx) => {
  const UserModel = mongoose.model(`${ctx.chat.id}`, userSchema);
  try {
    await UserModel.addNew({
      firstName: ctx.from.first_name,
      username: ctx.from.username,
      userCounter: 0
    });
  }
  catch (err) {
    await ctx.reply("uzhe est'");
  };
});
bot.command('user', async (ctx) => {
  const UserModel = mongoose.model(`${ctx.chat.id}`, userSchema);
  let userList = await UserModel.getUsers();
  let randomNumber = Math.floor((Math.random() * userList.length) + 1);
  let userOftheDay = await UserModel.findUser({ firstName: userList[randomNumber - 1].firstName });
  let userQuery = userOftheDay.username;
  let counterQuery = userOftheDay.userCounter;
  if (oneDayHasPassed()) {
    await ctx.reply(`${userList[randomNumber - 1].firstName + ' ' + '@' + (userList[randomNumber - 1].username)}  - user`);
    await UserModel.update({ username: userQuery }, { userCounter: counterQuery += 1 });
    currentDate = new Date().getTime();
  }
  else {
    await ctx.reply('nelzya');
  };
});

bot.command('who', async (ctx) => {
  const UserModel = mongoose.model(`${ctx.chat.id}`, userSchema);
  let userList = await UserModel.getUsers();
  await userList.map((e) => {
    ctx.reply(`${e.firstName} ${e.userCounter}`);
  });
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
function dashChecker(word) {
  return word.replace(/-/g, '_');
};
function afterUnderscoreCapitalizer(string) {
  return string.split('-').map(e => e.charAt(0).toUpperCase() + e.slice(1)).join('-');
};
function underscoreToSpace(word) {
  return word.replace('_', ' ');
};
function dashToSpace(word) {
  return word.replace('-', ' ');
};
function afterDashCapitalizer(string) {
  return string.split('-').map(e => e.charAt(0).toUpperCase() + e.slice(1)).join('-');
};
function oneDayHasPassed() {
  if ((new Date().getTime() - currentDate) < 86400000) {
    return false;
  }
  else {
    return true;
  }
}
bot.launch();


