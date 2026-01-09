import { DefaultValues } from '../utils/Constans';

export default {
    NODE_ENVIRONMENT: process.env.NODE_ENVIRONMENT ?? DefaultValues.NODE_ENV_DEV,
    DATABASE: {
        LOCAL: {
            host: "db-atenea-pos.ctiw48myq04p.us-east-1.rds.amazonaws.com",
            user: "postgres",
            password: "KratosMilo123**",
            database: "ateneapos",
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            }
        },
        DEV: {
            host: "db-atenea-pos.ctiw48myq04p.us-east-1.rds.amazonaws.com",
            user: "postgres",
            password: "KratosMilo123**",
            database: "ateneapos",
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            }
        },
        PROD: {
            host: "db-atenea-pos.ctiw48myq04p.us-east-1.rds.amazonaws.com",
            user: "postgres",
            password: "KratosMilo123**",
            database: "ateneapos",
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            }
        },
        QA: {
            host: process.env.PG_HOST ?? DefaultValues.EMPTY_STRING,
            user: process.env.PG_USER ?? DefaultValues.EMPTY_STRING,
            password: process.env.PG_PASSWORD ?? DefaultValues.EMPTY_STRING,
            database: process.env.PG_DATABASE ?? DefaultValues.EMPTY_STRING,
            port: Number(process.env.PG_PORT) ?? 5432,
            ssl: {
                rejectUnauthorized: false
            }
        },
    }
};
