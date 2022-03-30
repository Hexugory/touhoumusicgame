import { DataTypes, Sequelize } from "sequelize";
import { BlacklistUsers } from "./models/blacklistusers";
import { CommandBlacklist } from "./models/commandblacklist";

export const db = new Sequelize({
	dialect: 'sqlite',
	storage: './database.sqlite',
	logging: false
});

BlacklistUsers.init({
    user_id: DataTypes.TEXT
},
{
    tableName: 'blacklistusers',
    sequelize: db
});

CommandBlacklist.init({
    user_id: DataTypes.TEXT,
    guild_id: DataTypes.TEXT,
    blacklist: {
        type: DataTypes.TEXT,
        defaultValue: '{}'
    }
},
{
    tableName: 'commandblacklist',
    sequelize: db
});