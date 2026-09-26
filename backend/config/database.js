import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false,

        dialectOptions: {
            ssl: {
                rejectUnauthorized: false
            }
        }
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();

        console.log('Database connected');

        await sequelize.sync({ alter: true });

        console.log('Database synchronized');
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

await connectDB();