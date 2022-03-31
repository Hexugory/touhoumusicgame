import { Message, PermissionResolvable } from "discord.js";
import { Command } from "./command";

export class KillCommand implements Command {
	name = 'kill'
    aliases = []
    description = 'no'
    usage = 'no'
    permission: PermissionResolvable[] = ['ADMINISTRATOR']
    guildOnly = false
    ownerOnly = false
    args = []

	async execute() {
        process.exit(0);
	}
};
