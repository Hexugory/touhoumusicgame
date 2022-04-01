import { DataTypes, Sequelize } from "sequelize";
import { BlacklistUsers } from "./models/blacklistusers";
import { CommandBlacklist } from "./models/commandblacklist";
import { Scores } from "./models/scores";

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

Scores.init({
    user_id: {
        type: DataTypes.TEXT,
        primaryKey: true
    },
    wins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    guess_rates: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}'
    }
},
{
    tableName: 'scores',
    sequelize: db
});

(async () => {
    await db.sync();
})();
