import { Message, PermissionResolvable } from "discord.js";
import { Command } from "./command";

export class KillCommand implements Command {
	name = 'kill'
    aliases = []
    description = 'no'
    usage = 'no'
    permission = []
    guildOnly = false
    ownerOnly = true
    args = []

	async execute(msg: Message) {
        console.info('dying');
        msg.client.destroy();
        process.exit(0);
	}
};
