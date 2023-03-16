import { BaseGuildVoiceChannel, Collection, Guild, Snowflake, StageChannel, TextChannel } from "discord.js";
import { CommandClient } from "./commandclient";
import { Lobby } from "./game";

export class TMQClient extends CommandClient {
    readonly lobbies = new Collection<Snowflake, Lobby>();

    createLobby (guild: Guild, voiceChannel: StageChannel, repeat: boolean) {
        this.lobbies.set(guild.id, new Lobby(this, voiceChannel, repeat));
    }
}