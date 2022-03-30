import { Intents } from "discord.js";
import { db } from "./database";
import { TMQClient } from "./tmqclient";

const intents = new Intents();
intents.add(Intents.FLAGS.GUILDS)
	.add(Intents.FLAGS.GUILD_VOICE_STATES)
	.add(Intents.FLAGS.GUILD_MESSAGES)
	.add(Intents.FLAGS.DIRECT_MESSAGES);
const Client = new TMQClient({
    intents: intents,
    partials: ['CHANNEL']
}, db);