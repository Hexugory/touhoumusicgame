import { CreateVoiceConnectionOptions, joinVoiceChannel, JoinVoiceChannelOptions, VoiceConnection } from "@discordjs/voice";
import { BaseGuildTextChannel, Client, ClientOptions, Collection, GuildMember, Message, NewsChannel, TextBasedChannel, TextChannel, VoiceChannel } from "discord.js";
import { env } from "process";
import { Sequelize } from "sequelize";
import { CommandList } from "./commands/commandlist";
import { Command } from "./commands/command";
import { BlacklistUsers } from "./models/blacklistusers";
import { CommandBlacklist } from "./models/commandblacklist";
import { SlashCommand } from "./slash/slash";

export class TMQClient extends Client {
    constructor (options: ClientOptions, db: Sequelize) {
        super(options);

        this.db = db;

        for (const command of CommandList) {
            this.commands.set(command.name, command);
        }

        this.on('messageCreate', (msg: Message) => {
            if (!msg.content.startsWith(env.PREFIX as string) || msg.author.bot) return;

            if (msg.author.id != env.OWNER && (BlacklistUsers.findOne({ where: { user_id: msg.author.id } }))) return;

            this.parseCommand(msg);
        });

        this.on('ready', () => {
            console.log(`Logged in as ${this.user!.tag}`);
        });

        this.on('interactionCreate', async (int) => {
            if (int.isCommand()) {
                if (!int.channel) return;

                const command = this.slashCommands.get(int.commandName);

                if (!command) throw new Error('Slash command does not exist');
        
                if (command.permission && int.user.id != env.OWNER) {
                    if (!(int.channel instanceof BaseGuildTextChannel)) {
                        int.reply({ content: 'that command doesn\'t work in DMs!', ephemeral: true })
                    }
                    for (const permission of command.permission) {
                        if (!(int!.member as GuildMember).permissionsIn(int.channel as TextChannel | NewsChannel).has(permission)) return int.reply({ content: 'you aren\'t allowed to use that command', ephemeral: true });
                    }
                }
        
                command.execute(int).catch(error => {
                    int.reply({ content: 'there was an error\nping guy 19 times', ephemeral: true });
                    return console.error(error);
                });
                return console.info(`${int.user.tag} (${int.user.id}) used ${command.name} in ${'name' in int.channel ? int.channel.name : 'DM CHANNEL'} (${int.channel.id})`);
            }
        });

        this.login(env.TOKEN);
    }

    /**
     * Gives an array of single or multi-word arguments
     * @param msg 
     * @returns 
     */
    static formatArgs (msg: string): string[] {
        const args = msg.match(/("[^"]+")|(\S+)/g);
        if (args === null) return [];
        for (let [i, arg] of args.entries()) {
            args[i] = arg.replace(/(^"|"$)/g, '');
        }
        
        return args;
    }

    async parseCommand (msg: Message): Promise<Command | undefined> {
        const args = TMQClient.formatArgs(msg.content.slice(env.PREFIX!.length));
        
        if (args.length < 1) return;
        const commandName = args.shift()!.toLowerCase();
    
        const command: Command | undefined = this.commands.get(commandName)
            || this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) {
            return //this.parseCustomCommand(msg, commandName);
        };
    
        if (command.ownerOnly && msg.author.id != env.OWNER) {
            msg.reply('you can\'t use that command if you don\'t own this bot...');
            return;
        } 
    
        if (msg.channel instanceof BaseGuildTextChannel) {
            if (!msg.member) throw new Error('Command sending member does not exist');
            
            if (command.permission && msg.author.id != env.OWNER) {
                for (const permission of command.permission) {
                    if (!msg.member.permissionsIn(msg.channel).has(permission)) {
                        msg.reply('you don\'t have permission to use that command!');
                        return;
                    }
                }
            }

            if (msg.author.id != env.OWNER) {
                const member = (await CommandBlacklist.findOrCreate({ where: { user_id: msg.author.id, guild_id: msg.guild!.id } }))[0];
                if (JSON.parse(member.blacklist)[command.name]) {
                    return;
                }
            }
        }

        if(command.guildOnly) {
            msg.reply('that command doesn\'t work in DMs!');
            return;
        }
    
        if (!command.args[0].optional && args.length === 0) {
            let reply = 'i can\'t do anything without the command arguments!';
    
            if (command.usage) {
                reply += `\nthe proper usage would be: \`${env.PREFIX}${command.name} ${command.usage}\``;
            }
    
            msg.channel.send(reply);
            return;
        }
    
        if (args.length < command.args.filter(arg => {return !arg.optional}).length) {
            let reply = 'you\'re missing arguments!';
    
            if (command.usage) {
                reply += `\nthe proper usage would be: \`${env.PREFIX}${command.name} ${command.usage}\``;
            }
    
            msg.channel.send(reply);
            return;
        }
    
        if (command.cooldown && msg.author.id != env.OWNER) {
            if (!this.cooldowns.has(command.name)) {
                this.cooldowns.set(command.name, new Collection());
            }
    
            const now = Date.now();
            const timestamps = this.cooldowns.get(command.name);

            if (!timestamps) throw new Error('Command lacks cooldown collection');
    
            if (timestamps.has(msg.author.id)) {
                const expirationTime = (timestamps.get(msg.author.id) as number) + command.cooldown;
                const timeLeft = (expirationTime - now) / 1000;
                msg.reply(`you need to wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command!`);
                return;
            }
    
            timestamps.set(msg.author.id, now);
            setTimeout(() => timestamps.delete(msg.author.id), command.cooldown);
        }
    
        try {
            return this.runCommand(msg, command, args);
        }
        catch (error) {
            console.error(error);
            msg.reply('there was an error, shout at guy and hope he hears you!');
        }
    }

    runCommand (msg: Message, command: Command, args: any[]): Command | undefined {
        for(var i = 0; i < command.args.length; i++) {
            try {
                if (args[i]) {
                    if (!command.args[i].infinite) {
                        if (!command.args[i].type.validate(args[i], msg)) throw new Error('Argument is invalid');
                        args[i] = command.args[i].type.parse(args[i], msg);
                    }
                    else {
                        const infinite = [];
                        for (var j = i; j < args.length; j++) {
                            if (!command.args[i].type.validate(args[j], msg)) throw new Error('Argument is invalid');
                            infinite.push(command.args[i].type.parse(args[j], msg));
                        }
                        
                        args[i] = infinite;
                    }

                    if (command.args[i].validator && !command.args[i].validator?.(args[i], msg)) throw new Error('Argument is invalid');
                }
            }
            catch {
                msg.reply(`\`${args[i]}\` is invalid!`);
                return;
            }

            const keyedArgs: { [key: string]: any }  = {};
            for (var i = 0; i < command.args.length; i++) {
                keyedArgs[command.args[i].key] = args[i];
            }

            console.info(`${msg.author.tag} (${msg.author.id}) used ${command.name} in ${'name' in msg.channel ? msg.channel.name : 'DM CHANNEL'} (${msg.channel.id})`);
            command.execute(msg, keyedArgs);
            return command;
        }
    }

    /**
     * Join voice channel while destroying previous voice connection
     * @param channel 
     */
    joinVoiceChannel (channel: VoiceChannel) {
        this.voiceConnection?.destroy();
        this.voiceConnection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id
        } as JoinVoiceChannelOptions & CreateVoiceConnectionOptions);
    }

    readonly commands = new Collection<string, Command>();
    readonly slashCommands = new Collection<string, SlashCommand>();
    readonly cooldowns = new Collection<string, Collection<string, number>>();
    db: Sequelize

    voiceConnection?: VoiceConnection;
}