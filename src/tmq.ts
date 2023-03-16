import { GatewayIntentBits, Partials } from "discord.js";
import { db } from "./database";
import { TMQClient } from "./tmqclient";

const Client = new TMQClient({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages
	],
    partials: [Partials.Channel]
}, db);