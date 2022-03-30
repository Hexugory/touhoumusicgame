import { Message, PermissionResolvable, User } from "discord.js"
import { Command } from "./command"
import { UserArgument } from "../types/user"
import { BlacklistUsers } from "../models/blacklistusers"

interface GlobalBlacklistArguments {
    user: User
}

export class GlobalBlacklistCommand implements Command {
	name = 'gblacklist'
    aliases = []
    description = 'banish to the shadow realm'
    usage = 'no'
    permission = []
    guildOnly = false
    ownerOnly = true
    args = [
        {
            key: 'user',
            type: UserArgument,
            infinite: true,
            optional: false
        }
    ]

	async execute(msg: Message, arglist: {}) {
        const args = (arglist as GlobalBlacklistArguments);
        const user = (await BlacklistUsers.findOrCreate({ where: { user_id: args.user.id } }))[0];

        if (user) user.destroy()

        msg.reply(`${user ? '' : 'un'}blacklisted **${args.user.tag}**`);
        return;
	}
};
