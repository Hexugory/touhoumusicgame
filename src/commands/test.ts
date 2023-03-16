import { AudioPlayerState, AudioPlayerStatus, createAudioPlayer, createAudioResource, CreateVoiceConnectionOptions, entersState, getVoiceConnection, joinVoiceChannel, JoinVoiceChannelOptions, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import { Message, TextChannel, VoiceChannel } from "discord.js";
import { TMQClient } from "../tmqclient";
import { Command } from "./command";
import { env } from "process";
import { FFmpeg } from "prism-media";

export class TestCommand implements Command {
	name = 'test'
    aliases = []
    description = 'no'
    usage = 'no'
    permission = []
    guildOnly = false
    ownerOnly = true
    args = []

	async execute(msg: Message) {
        const channel = msg.client.channels.resolve('164266554786185216') as TextChannel;
        channel.send(
`@everyone hello! i have an announcement! today, ~~due to recent events, we're rebranding as~~
sike! we're still a touhou server this time! but are we really?
i keep hearing about weird things like "secondaries" and "DMCA takedowns", so today, i've prepared a challenge for you all!
if you're all such massive touhou fans that need the games so badly, let's see how much you *really* know about touhou...
with the Choujuu Gigaku Music Game!
can you identify touhou songs *by name* given only a small sample? come join the fun in <#959276051995951204>!`
        );
	}
};
