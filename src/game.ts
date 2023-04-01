import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType, VoiceConnection } from "@discordjs/voice";
import { BaseGuildVoiceChannel, Collection, DMChannel, Message, EmbedBuilder, Snowflake, StageChannel, TextChannel } from "discord.js";
import { FFmpeg } from "prism-media";
import { Scores } from "./models/scores";
import { TMQClient } from "./tmqclient";

interface Song {
    names: string[]
    file: string
    length: number
}

interface SongGuessRates {
    [key: string]: {
        appeared: number
        correct: number
    }
}

interface Player {
    name: string
    id: string
    score: number
    guess: string
    correct: boolean
}

export enum GameState {
    Starting,
    Guessing,
    Revealing,
    Ended
}

const FFMPEG_OPUS_ARGUMENTS = [
    '-loglevel',
    '0',
    '-acodec',
    'libopus',
    '-f',
    'opus',
    '-ar',
    '48000',
    '-ac',
    '2',
];

export const SONGS = new Collection<string, Song>();

const SONG_LIST: {
    names: string[]
    file: string
    length: number
}[] = require('../audio/songs.json');

for (const song of SONG_LIST) {
    SONGS.set(song.file, {
        names: song.names,
        file: song.file,
        length: song.length
    });
}

function cleanFormatting (string: string) {
    return string.replace(/(\`|\n)/g, '');
}

export class Lobby {
    constructor (client: TMQClient, voiceChannel: StageChannel, repeat: boolean) {
        this.client = client;
        this.voiceChannel = voiceChannel;
        this.repeat = repeat;

        this.connection = joinVoiceChannel({
            channelId: this.voiceChannel.id,
            guildId: this.voiceChannel.guild.id,
            adapterCreator: this.voiceChannel.guild.voiceAdapterCreator
        });
        
        this.player = createAudioPlayer();
        this.player.on(AudioPlayerStatus.Playing, () => {
            if (this.voiceChannel.guild.members.me!.voice.suppress) this.voiceChannel.guild.members.me!.voice.setSuppressed(false);
        });

        this.connection.subscribe(this.player);

        this.startGame();
    }

    async startGame () {
        if (this.game?.state != GameState.Ended) await this.game?.endGame(true);

        if (!this.voiceChannel.stageInstance) {
            await this.voiceChannel.guild.stageInstances.create(this.voiceChannel, {
                topic: 'the game is on! (open the stage chat)'
            });
            this.game = new Game(this);
            return this.game.startSong();
        }
        this.voiceChannel.stageInstance.setTopic('the game is on! (open the stage chat)');
        this.game = new Game(this);
        return this.game.startSong();
    }

    async destroyLobby () {
        await this.game?.endGame();
        this.connection.disconnect();
        this.connection.destroy();
        this.player.stop();
        this.voiceChannel.stageInstance?.delete();
        
        this.client.lobbies.delete(this.voiceChannel.guildId);
    }

    game?: Game
    client: TMQClient
    voiceChannel: StageChannel
    repeat: boolean
    connection: VoiceConnection
    player: AudioPlayer
    starting = setTimeout(()=>{},0);
}

export class Game {
    constructor (lobby: Lobby) {
        console.debug('constructing game');

        this.lobby = lobby;
        this.remainingSongs = this.totalSongs;

        this.lobby.client.on('messageCreate', this.messageCallback.bind(this));

        this.lobby.voiceChannel.send('the game is starting!');
    }

    messageCallback (msg: Message) {
        if (!(msg.channel instanceof DMChannel) || msg.author.bot) return;

        if (this.state === GameState.Guessing && msg.content.length <= 75) {
            if (!this.players.get(msg.author.id)) {
                this.players.set(msg.author.id, {
                    name: msg.author.username,
                    id: msg.author.id,
                    score: 0,
                    guess: '',
                    correct: false
                });
            }

            const player = this.players.get(msg.author.id);
            player!.guess = msg.content.toLowerCase();
            console.debug('guess dm', msg.content);
            msg.react('🗳️');

            return;
        }
    }

    getScores (guessFormat: boolean) {
        let scorestr = '';
        this.players.sort((a, b) => {
            return b.score - a.score;
        });
        this.players.forEach((player) => {
            scorestr += `${player.name}: ${player.score}${guessFormat ? ` ${player.correct ? '✅ ' : ''}${player.guess ? `\`${cleanFormatting(player.guess)}\`` : ''}` : ''}\n`;
        });
        scorestr = scorestr.substring(0, 4095);
        return scorestr;
    }

    async startSong () {
        console.debug('start song');
        const embed = new EmbedBuilder()
            .setColor(0xfd6b5f);

        console.debug('past new thing');

        if (this.remainingSongs === 0) {
            const scorestr = this.getScores(false);
            embed.setTitle(`the game is over, thanks for playing!`)
                .setDescription(scorestr || 'no guesses?');
            if (this.lobby.repeat) {
                embed.setFooter({
                    text: 'starting again in 30 seconds...'
                });
            }
            this.lobby.voiceChannel.send({ embeds: [embed] });

            const winners = [...this.players.filter((player) => {
                return player.score >= [...this.players][0][1].score && player.score > 0;
            })];
            for (const value of winners) {
                const player = value[1];

                const playerRates = await Scores.findOrCreate({ where: {
                    user_id: player.id
                } });

                playerRates[0].set({
                    wins: playerRates[0].getDataValue('wins')+1,
                })
                await playerRates[0].save();
            }

            await this.endGame(false);
            return;
        }

        this.currentSong = SONGS.random();
        this.remainingSongs--;
        console.debug(this.currentSong, __dirname + '/../audio/'+ this.currentSong!.file);

        const ffmpeg = new FFmpeg({
            args: ['-ss', `${Math.floor(Math.random()*(this.currentSong!.length-30))}`, '-t', '30', '-i', __dirname + '/../audio/'+ this.currentSong!.file, ...FFMPEG_OPUS_ARGUMENTS]
        });
        const resource = createAudioResource(ffmpeg, { inputType : StreamType.OggOpus });

        this.state = GameState.Guessing;
        this.reveal = setTimeout(this.revealSong.bind(this), 20_000);
        this.end = setTimeout(this.startSong.bind(this), 30_000);
        this.lobby.player.play(resource);
        
        embed.setTitle(`guess the new song, use /guess or DM me your answer!`)
            .setFooter({
                text: `${this.totalSongs-this.remainingSongs}/${this.totalSongs}`
            });
        this.lobby.voiceChannel.send({ embeds: [embed] });
    }

    async revealSong () {
        this.state = GameState.Revealing;

        for (const value of [...this.players]) {
            const player = value[1];

            if (this.currentSong?.names.map((name) => {
                return name.toLowerCase().replace(/[^\w]/g, '');
            }).includes(player.guess.toLowerCase().replace(/[^\w]/g, ''))) player.correct = true;

            if (player.correct) {
                player.score++;
            }

            const playerRates = await Scores.findOrCreate({ where: {
                user_id: player.id
            } });

            const guessRates: SongGuessRates = JSON.parse(playerRates[0].getDataValue('guess_rates'));
            if (!guessRates[this.currentSong!.names[0]]) guessRates[this.currentSong!.names[0]] = {appeared:0,correct:0};
            guessRates[this.currentSong!.names[0]].appeared++;
            guessRates[this.currentSong!.names[0]].correct += player.correct ? 1 : 0;
            playerRates[0].set({
                guess_rates: JSON.stringify(guessRates)
            });
            await playerRates[0].save();
        }
        const scorestr = this.getScores(true);
        this.players.forEach((player) => {
            player.guess = '';
            player.correct = false;
        });

        const embed = new EmbedBuilder()
            .setColor(0x5ffd5f)
            .setTitle(`the answer was ${this.currentSong?.names[0].toLowerCase()}!`)
            .setDescription(scorestr || 'no guesses?');
        this.lobby.voiceChannel.send({ embeds: [embed] });
    }

    async endGame (force:boolean = false) {
        this.state = GameState.Ended;
        clearTimeout(this.reveal);
        clearTimeout(this.end);
        this.lobby.client.removeListener('messageCreate', this.messageCallback);
        if (!force) await this.lobby.voiceChannel.stageInstance?.setTopic('the game is over' + (this.lobby.repeat ? ', restarting...' : '!'));

        if (this.lobby.repeat && !force) {
            clearTimeout(this.lobby.starting);
            this.lobby.starting = setTimeout(this.lobby.startGame.bind(this.lobby), 30_000);
        }
    }

    lobby: Lobby
    players = new Collection<Snowflake, Player>();
    currentSong?: Song
    totalSongs = 20
    remainingSongs: number
    state = GameState.Starting
    reveal = setTimeout(()=>{},0);
    end = setTimeout(()=>{},0);
}