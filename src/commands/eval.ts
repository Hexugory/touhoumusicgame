import { Message } from "discord.js"
import { Command } from "./command"
import { StringArgument } from "../types/string"

interface EvalArguments {
    code: string
}

export class EvalCommand implements Command {
	name = 'eval'
    aliases = []
    description = 'that thing'
    usage = 'yeah'
    permission = []
    guildOnly = false
    ownerOnly = true
    args = [
        {
            key: 'code',
            type: StringArgument,
            infinite: false,
            optional: false
        }
    ]

	async execute(msg: Message, arglist: {}) {
        if (!msg.channel.isSendable()) return;
        const args = (arglist as EvalArguments);
        const result = eval(args.code);
        console.log(args.code);
        console.log(result);
        return msg.channel.send(result.toString());
	}
};
