import { BlacklistCommand } from "./blacklist";
import { DeploySlashCommand } from "./deployslash";
import { EndGameCommand } from "./endgame";
import { EvalCommand } from "./eval";
import { GlobalBlacklistCommand } from "./gblacklist";
import { KillCommand } from "./kill";
import { RandomCaseCommand } from "./randomcase";
import { StartGameCommand } from "./startgame";
import { TestCommand } from "./test";

export const CommandList = [
    new GlobalBlacklistCommand(),
    new BlacklistCommand(),
    new RandomCaseCommand(),
    new TestCommand(),
    new KillCommand(),
    new StartGameCommand(),
    new EndGameCommand(),
    new DeploySlashCommand(),
    new EvalCommand()
];